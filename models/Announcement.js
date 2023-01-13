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
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);
