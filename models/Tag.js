const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
    },
    name: String,
    color: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tag", TagSchema);
