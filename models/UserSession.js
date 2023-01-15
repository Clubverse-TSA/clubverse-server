const mongoose = require("mongoose");

const UserSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = UserSession = mongoose.model("UserSession", UserSessionSchema);
