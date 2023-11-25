const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
const fs = require("fs");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ msg: "hi" });
});

app.post("/api/login", async (req, res) => {
  let resp = {};
  try {
    const users = await fs.readFileSync(
      path.join(__dirname, "./users.json"),
      "utf8"
    );

    let usersJson = JSON.parse(users);
    let key = req?.body?.key;
    let UUID = req?.body?.UUID;
    let user = usersJson?.find((el) => el.key === key);
    if (user && !user.active && UUID) {
      let index = usersJson?.findIndex((el) => el.key === key);
      user.active = true;
      user.UUID = UUID;
      usersJson[index] = user;
      fs.writeFileSync(
        path.join(__dirname, "./users.json"),
        JSON.stringify(usersJson)
      );
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
