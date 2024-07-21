const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  phone: {
    required: true,
    type: Number,
  },
  name: {
    required: true,
    type: String,
  },
  email: {
    required: false,
    type: String,
  },
  address: {
    required: false,
    type: String,
  },
});
module.exports = mongoose.model("info", dataSchema);
