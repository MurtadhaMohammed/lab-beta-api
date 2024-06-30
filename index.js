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

app.post("/api/user/add", async (req, res) => {
  const { key, exp } = req.body;

  const newUser = new User({
    key,
    exp,
    active: true,
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
