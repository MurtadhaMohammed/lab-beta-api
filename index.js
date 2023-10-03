const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
const util = require("util");
require("dotenv").config();
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");

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
const path = require("path");
const deleteFile = util.promisify(fs.unlink); // unlink will delete the file
const accessToken = process.env.ACCESS_KEY;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const uploadFile = async (file, client) => {
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", fs.createReadStream(file?.path));
  formData.append("type", "application/pdf");
  const url = `https://graph.facebook.com/v18.0/${client?.key}/media`;

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data?.error) return { success: false, ...data };
    else return { success: true, ...data };
  } catch (error) {
    return { success: false, ...error };
  }
};

const sendMessage = async (type, phone, client, fileID) => {
  const url = `https://graph.facebook.com/v18.0/${client?.key}/messages`;
  let msgType = {
    template: {
      type: "template",
      template: { name: "lab", language: { code: "ar" } },
    },
    document: {
      type: "document",
      document: {
        id: fileID,
        filename: "results.pdf",
        caption: "مختبر العلوم للتحليلات المرضية",
      },
    },
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `964${phone}`,
      ...msgType[type],
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data?.error) return { success: false, ...data };
    else return { success: true, ...data };
  } catch (error) {
    return { success: false, ...error };
  }
};

app.post("/api/:client/message", upload.single("file"), async (req, res) => {
  let resp = {};
  try {
    let client = clients[req?.params?.client];
    let { phone } = req.body;
    let file = await req.file;

    let fileResp = await uploadFile(file, client);
    if (!fileResp?.success)
      resp = { err: fileResp?.error?.message, success: false };
    else {
      let msgResp = await sendMessage("document", phone, client, fileResp?.id);
      if (!msgResp.success)
        resp = { err: fileResp?.error?.message, success: false };
      else resp = { success: true, msg: "تم الارسال بنجاح", ...msgResp };
    }
    await deleteFile(file.path);
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.post("/api/:client/template", upload.none(), async (req, res) => {
  let resp = {};
  try {
    let client = clients[req?.params?.client];
    let { phone } = req.body;
    let msgResp = await sendMessage("template", phone, client, null);
    if (!msgResp.success)
      resp = { err: msgResp?.error?.message, success: false };
    else resp = { success: true, msg: "تم الارسال بنجاح", ...msgResp };
  } catch (error) {
    resp = { err: error.message, success: false };
  }
  res.json(resp);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
