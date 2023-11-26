const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
require("dotenv").config();

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

app.get("/", (req, res) => {
  res.json({ msg: "hi" });
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
