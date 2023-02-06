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
      default:
        "https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg",
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
