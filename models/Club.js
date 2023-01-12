const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema(
  {
    name: String,
    sponsors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    room: Number,
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["Officer", "Member"],
        },
      },
    ],
    // need to add dues and settings properties soon
  },
  { timestamps: true }
);

module.exports = mongoose.model("Club", ClubSchema);
