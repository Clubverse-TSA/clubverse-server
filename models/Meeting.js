const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema(
  {
    date: Date,
    attendance: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["present", "neutral", "absent"],
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Club", ClubSchema);
