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
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sponsors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    clubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", SchoolSchema);
