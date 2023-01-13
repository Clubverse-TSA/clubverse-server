const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    importantDates: [
      {
        date: Date,
        name: String,
      },
    ],
    announcements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
      },
    ],
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
          enum: ["officer", "member"],
          default: "member",
        },
      },
    ],
    // need to add dues and settings properties soon
    meetings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
      },
    ],
    dues: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        paid: {
          type: String,
          enum: ["paid", "neutral", "unpaid"],
          default: "neutral",
        },
      },
    ],
    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pending: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Club", ClubSchema);
