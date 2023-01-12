const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema(
  {
    name: String,
    phoneNumber: Number,
    email: String,
    state: String,
    link: String,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", SchoolSchema);
