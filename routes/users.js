const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const keys = require("../config/keys");

const User = require("../models/User");
const School = require("../models/School");
const Club = require("../models/Club");
const UserSession = require("../models/UserSession");

router.get("/", (req, res) => {
  return res.json({
    message: "Hello World",
  });
});

router.post("/login/:id", (req, res) => {
  let { username, password } = req.body;
  username = username.toLowerCase();

  const schoolID = req.params.id;
  School.findOne({ _id: schoolID }, (err, school) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!school) {
      return res.json({
        success: false,
        message: "School doesn't exist",
      });
    }

    User.findOne({ school: school._id, username }, (err, user) => {
      if (err) {
        return res.json({
          success: false,
          message: "Error: Server Error",
        });
      }

      if (!user) {
        return res.json({
          success: false,
          message: "Invalid username or password",
        });
      }

      if (!user.validPassword(password)) {
        return res.json({
          success: false,
          message: "Error: Invalid username or password",
        });
      }

      const newUserSession = new UserSession();
      newUserSession.user = user._id;
      newUserSession.save((err, doc) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        User.findOne({ _id: doc.userId }, (err, user1) => {
          return res.json({
            success: true,
            message: "Authenticated",
            token: doc._id,
            user: user1,
          });
        });
      });
    });
  });
});

router.get("/verify", (req, res) => {
  const { token } = req.query;

  UserSession.find({ _id: token, isDeleted: false }, (err, sessions) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (sessions.length !== 1) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    } else {
      User.findOne({ _id: sessions[0].user }, (err, user) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        return res.json({
          success: true,
          message: "valid",
          user,
        });
      });
    }
  });
});

router.get("/logout", (req, res) => {
  const { token } = req.query;

  UserSession.deleteOne({ _id: token }, (err) => {
    if (err) {
      return res.json({
        success: false,
        message: "server err",
      });
    }
    return res.json({
      success: true,
      message: "logged out",
    });
  });
});

router.post("/delete", (req, res) => {
  const { userId, deleteId } = req.body;

  User.findOne({ _id: userId }, (err, user) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!user) {
      return res.json({
        success: false,
        message: "Something went wrong",
      });
    }

    if (user.type === "admin") {
      User.findOne({ _id: deleteId }, (err, deleteThis) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!deleteThis) {
          return res.json({
            success: false,
            message: "User doesn't exist",
          });
        }

        User.deleteOne({ _id: deleteThis._id }, (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "User deleted",
          });
        });
      });
    } else {
      return res.json({
        success: false,
        message: "You are not an admin",
      });
    }
  });
});

module.exports = router;
