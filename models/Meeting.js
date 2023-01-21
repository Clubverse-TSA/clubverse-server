const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    date: Date,
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
    },
    attendance: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          default: "neutral",
          enum: ["present", "neutral", "absent"],
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", MeetingSchema);
