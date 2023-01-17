const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const keys = require("../config/keys");

const User = require("../models/User");
const School = require("../models/School");
const Club = require("../models/Club");
const Meeting = require("../models/Meeting");
const Announcement = require("../models/Announcement");
const Tag = require("../models/Tag");
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
        message: "Error: Server Error 1",
        error: err,
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
          message: "Error: Server error 2",
        });
      }

      if (school) {
        return res.json({
          success: false,
          message: "School name taken",
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
            message: "Error: Server error 3",
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
              message: "Error: Server Error 4",
            });
          }

          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error 5",
              });
            }

            newUser.password = hash;
            newUser.save((err, user) => {
              if (err) {
                return res.json({
                  success: false,
                  message: "Error: Server Error 6",
                });
              }

              school.admin = user._id;
              school.save((err, school) => {
                if (err) {
                  return res.json({
                    success: false,
                    message: "Error: Server Error 7",
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

        const hashedPassword = bcrypt.hashSync(password, 10);

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

        const hashedPassword = bcrypt.hashSync(password, 10);

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

router.get("/get-clubs", (req, res) => {
  const { userId } = req.query;

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
        message: "Error: Server Error",
      });
    }

    Club.find({ school: user.school })
      .populate("sponsors")
      .exec((err, clubs) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!clubs || clubs.length === 0) {
          return res.json({
            success: true,
            myClubs: [],
            otherClubs: [],
          });
        }

        if (user.type === "student") {
          const myClubs = [];
          const otherClubs = [];

          clubs.forEach((club) => {
            const isMember = club.members.find(
              (member) => member.user.toString() == userId.toString()
            );

            if (isMember && !club.pending) {
              myClubs.push(club);
            } else {
              if (!club.pending) {
                otherClubs.push(club);
              }
            }
          });

          return res.json({
            success: true,
            myClubs,
            otherClubs,
          });
        } else if (user.type === "sponsor") {
          const myClubs = [];
          const otherClubs = [];

          clubs.forEach((club) => {
            const findSponsor = club.sponsors.find(
              (sponsor) => sponsor._id.toString() == user._id.toString()
            );
            const index = club.sponsors.indexOf(findSponsor);

            if (index !== -1 && !club.pending) {
              myClubs.push(club);
            } else {
              // Sponsors should only see their own clubs
            }
          });

          return res.json({
            success: true,
            myClubs,
            otherClubs,
          });
        } else if (user.type === "admin") {
          const allClubs = []; //(all)
          const pendingClubs = []; //(pending)

          clubs.forEach((club) => {
            if (club.pending) {
              pendingClubs.push(club);
            } else {
              if (!club.pending) {
                allClubs.push(club);
              }
            }
          });

          return res.json({
            success: true,
            allClubs,
            pendingClubs,
          });
        }
      });
  });
});

module.exports = router;
