const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const User = require("./src/modals/User");
const Admin = require("./src/modals/Admin");
const Info = require("./src/modals/info");

app.get("/", (req, res) => {
  res.json({ msg: "hi All" });
});

app.put("/api/signout/:id", async (req, res) => {
  let resp = {};
  try {
    let _id = req?.params?.id;
    await User.findByIdAndUpdate(_id, {
      active: false,
      UUID: null,
    });
    resp = { success: true };
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.post("/api/login", async (req, res) => {
  let resp = {};
  try {
    let key = req?.body?.key;
    let UUID = req?.body?.UUID;
    const user = await User.findOne({ key }).exec();
    if (user && !user.active && UUID) {
      user.active = true;
      user.UUID = UUID;
      await User.findByIdAndUpdate(user._id, user);
      resp = { user, success: true };
    } else if (user && user.active && UUID === user.UUID)
      resp = { user, success: true };
    else resp = { success: false };
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

//users
app.get("/api/users", async (req, res) => {
  let resp = {};
  let q = req.query.q || "";
  try {
    const users = await User.find({
      key: { $regex: ".*" + q + ".*" },
    }).exec();
    resp = { users, success: true };
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.delete("/api/user/:id", async (req, res) => {
  let resp = {};
  try {
    let _id = req.params.id;
    const deletedUser = await User.findByIdAndDelete(_id);
    if (!deletedUser) {
      resp = { message: "User not found", success: false };
    } else {
      resp = { message: "User deleted successfully", success: true };
    }
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.put("/api/user/toggle/:id", async (req, res) => {
  let resp = {};
  try {
    let _id = req.params.id;
    const user = await User.findById(_id);
    user.active = !user.active;
    const updatedUser = await user.save();
    resp = { user: updatedUser, success: true };
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});



app.post("/api/user/add", async (req, res) => {
  const { key, exp } = req.body;

  const newUser = new User({
    key,
    exp,
    active: false,
    UUID: null
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).json({ user: savedUser, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

//Admin
app.post("/api/admin/add", async (req, res) => {
  try {
    const { username, password } = req.body;
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    res.status(201).send({ message: "Admin created successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).send({ error: "Invalid username or password" });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ error: "Invalid username or password" });
    }
    const token = jwt.sign({ id: admin._id }, "your_jwt_secret", {
      expiresIn: "100000h",
    });
    res.status(200).send({ token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});



//info


app.post("/api/info/add", async (req, res) => {
  const { phone, name, email, address, userId } = req.body;

  const newInfo = new Info({
    phone,
    name,
    email,
    address,
  });

  try {
    const savedInfo = await newInfo.save();
    const user = await User.findById(userId);
    if (user) {
      user.info = savedInfo._id;
      await user.save();
      res.status(201).json({ info: savedInfo, user, success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


app.get("/api/infos", async (req, res) => {
  try {
    const infos = await Info.find();
    res.json({ infos, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


app.get("/api/info/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const info = await Info.findById(_id);
    if (!info) {
      return res.status(404).json({ message: "Info not found", success: false });
    }
    res.json({ info, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/info/:id", async (req, res) => {
  const _id = req.params.id;
  const updates = req.body;
  try {
    const updatedInfo = await Info.findByIdAndUpdate(_id, updates, { new: true });
    if (!updatedInfo) {
      return res.status(404).json({ message: "Info not found", success: false });
    }
    res.json({ info: updatedInfo, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/info/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const deletedInfo = await Info.findByIdAndDelete(_id);
    if (!deletedInfo) {
      return res.status(404).json({ message: "Info not found", success: false });
    }
    res.json({ message: "Info deleted successfully", success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/api/user/:id/info", async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id).populate('info');
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
    res.json({ user, info: user.info, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
