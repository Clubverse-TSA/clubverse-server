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

router.post("/register", (req, res) => {
  let { name, phoneNumber, email, state, username, password } = req.body;

  const link = name.replace(/\s/g, "").toLowerCase();

  User.findOne({ username }, (err, user) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (user) {
      return res.json({
        success: false,
        message: "Username already taken",
      });
    }

    School.findOne({ link }, (err, school) => {
      if (err) {
        return res.json({
          success: false,
          message: "Error: Server error",
        });
      }

      if (school) {
        return res.json({
          success: false,
          message: "School link already taken",
        });
      }

      const newSchool = new School();
      newSchool.name = name;
      newSchool.phoneNumber = phoneNumber;
      newSchool.email = email;
      newSchool.state = state;
      newSchool.link = link;

      newSchool.save((err, school) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server error",
          });
        }

        const newUser = new User({
          firstName: "Admin",
          lastName: "",
          username,
          password,
          school: school._id,
          type: "admin",
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            newUser.password = hash;
            newUser.save((err, user) => {
              if (err) {
                return res.json({
                  success: false,
                  message: "Error: Server Error",
                });
              }

              school.admin = user._id;
              school.save((err, school) => {
                if (err) {
                  return res.json({
                    success: false,
                    message: "Error: Server Error",
                  });
                }

                return res.json({
                  success: true,
                  message: "School registered",
                  school,
                  user,
                });
              });
            });
          });
        });
      });
    });
  });
});

router.post("/upload-user-db", (req, res) => {
  const { userJSON, dbType, schoolID } = req.body;

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
        message: "School not found",
      });
    }

    if (dbType === "student") {
      let users = [];
      users = userJSON.map(async (user) => {
        const { firstName, lastName, id, email, password, grade } = user;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
          firstName,
          lastName,
          username: id.toString(),
          password: hashedPassword,
          school: schoolID,
          type: "student",
          grade,
          email,
        });

        return newUser.save();
      });

      Promise.all(users).then((values) => {
        school.students = values.map((user) => user._id);
        school.save((err, school) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            school,
          });
        });
      });
    } else if (dbType === "sponsor") {
      let users = [];
      users = userJSON.map(async (user) => {
        const { firstName, lastName, id, email, password } = user;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
          firstName,
          lastName,
          username: id.toString(),
          password: hashedPassword,
          school: schoolID,
          type: "sponsor",
          email,
        });

        return newUser.save();
      });

      Promise.all(users).then((values) => {
        school.sponsors = values.map((user) => user._id);
        school.save((err, school) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            school,
          });
        });
      });
    } else {
      return res.json({
        success: false,
        message: "Error: Invalid dbType",
      });
    }
  });
});

module.exports = router;
