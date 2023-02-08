const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    message: String,
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    dateReminder: {
      type: Date,
      default: null,
    },
    images: [
      {
        type: String,
      },
    ],
    files: [
      {
        name: String,
        size: Number,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);
