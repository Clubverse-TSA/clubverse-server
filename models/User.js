const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    username: String,
    profilePic: {
      type: String,
      default: "",
    },
    password: String,
    grade: Number,
    type: {
      type: String,
      enum: ["student", "sponsor", "admin"],
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    clubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
    notifications: [
      {
        club: {
          type: mongoose.Schema.Types.ObjectId,
        },
        announcements: {
          type: Boolean,
          default: true,
        },
        attendanceUpdates: {
          type: Boolean,
          default: false,
        },
        duesUpdates: {
          type: Boolean,
          default: false,
        },
        clubChanges: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
