const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  key: {
    required: true,
    type: String,
  },
  active: {
    required: true,
    type: Boolean,
  },
  exp: {
    required: true,
    type: Number,
  },
  UUID: {
    required: false,
    type: String,
  },
});

module.exports = mongoose.model("user", dataSchema);
