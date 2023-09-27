const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
const util = require("util");
require("dotenv").config();
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");
const formData = new FormData();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const clients = {
  lab: {
    key: "142971062224854",
    msg: "مرحبا",
  },
};

app.get("/", (req, res) => {
  res.json({ msg: "hi" });
});
const multer = require("multer");
const deleteFile = util.promisify(fs.unlink); // unlink will delete the file
const upload = multer({ dest: "uploads/" });

app.post("/api/:client/message", upload.single("file"), async (req, res) => {
  let resp = {};
  try {
    let client = clients[req?.params?.client];
    let { phone } = req.body;
    let file = req.file;

    formData.append("messaging_product", "whatsapp");
    formData.append(
      "file",
      fs.createReadStream("uploads/3e1684edd40954ca2951c9c2fbabbcec.pdf")
    );
    //formData.append("file", '@"uploads/3e1684edd40954ca2951c9c2fbabbcec.pdf"');
    formData.append("type", "application/pdf");

    let response = await fetch(
      `https://graph.facebook.com/v18.0/${client?.key}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "multipart/form-data; boundary=---011000010111000001101001",
          Authorization: `Bearer ${process.env.ACCESS_KEY}`,
        },
        body: formData,
      }
    );

    // let response = await fetch(
    //   `https://graph.facebook.com/v17.0/${client?.key}/messages`,
    //   {
    //     body: JSON.stringify({
    //       messaging_product: "whatsapp",
    //       to: `964${phone}`,
    //       type: "template",
    //       template: { name: "hello_world", language: { code: "en_US" } },
    //     }),
    //     headers: {
    //       Authorization: `Bearer ${process.env.ACCESS_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //     method: "POST",
    //   }
    // );
    // let result = await uploadFileResp.json()
    // console.log(result);

    let jsonData = await response.json();
    resp = { success: response.ok, ...jsonData };
    await deleteFile(file.path);
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
