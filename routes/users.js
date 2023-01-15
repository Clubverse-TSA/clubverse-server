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

    User.findOne({ school: schoolID, username }, (err, user) => {
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

        return res.json({
          success: true,
          message: "Authenticated",
          token: doc._id,
          user: user,
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

    if (user.type === "admin" || userId == deleteId) {
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

        if (deleteThis.type === "admin") {
          return res.json({
            success: false,
            message: "You can't delete an admin account",
          });
        }

        User.deleteOne({ _id: deleteThis._id }, (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          School.findOne({ _id: user.school }, (err, school) => {
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

            if (school.sponsors.includes(deleteThis._id)) {
              school.sponsors.splice(
                school.sponsors.indexOf(deleteThis._id),
                1
              );
            } else {
              school.students.splice(
                school.students.indexOf(deleteThis._id),
                1
              );
            }

            school.save((err, school) => {
              if (err) {
                return res.json({
                  success: false,
                  message: "Error: Server Error",
                });
              }

              Club.find({ _id: { $in: deleteThis.clubs } }, (err, clubs) => {
                if (err) {
                  return res.json({
                    success: false,
                    message: "Error: Server Error",
                  });
                }

                let promises = [];

                promises = clubs.map((club) => {
                  const found = club.members.find(
                    (member) =>
                      member.user.toString() == deleteThis._id.toString()
                  );

                  if (found) {
                    club.members.splice(club.members.indexOf(found), 1);
                  } else {
                    if (
                      club.sponsors.length === 1 &&
                      club.sponsors.includes(deleteThis._id)
                    ) {
                      const clubId = club._id.toString();
                      const deleteUser = deleteThis._id.toString();

                      // Club Delete
                      Club.findOne({ _id: clubId }, (err, club) => {
                        if (err) {
                          return res.json({
                            success: false,
                            message: "Error: Server Error",
                          });
                        }

                        if (!club) {
                          return res.json({
                            success: false,
                            message: "Club doesn't exist",
                          });
                        }

                        // User.findOne({ _id: deleteUser }, (err, user) => {
                        // if (err) {
                        //   return res.json({
                        //     success: false,
                        //     message: "Error: Server Error",
                        //   });
                        // }

                        // if (!user) {
                        //   return res.json({
                        //     success: false,
                        //     message: "User doesn't exist",
                        //   });
                        // }

                        if (
                          deleteThis.type !== "admin" &&
                          club.sponsors.indexOf(deleteThis._id) === -1
                        ) {
                          return res.json({
                            success: false,
                            message: "Not authorized",
                          });
                        }

                        Club.deleteOne({ _id: clubId }, (err) => {
                          if (err) {
                            return res.json({
                              success: false,
                              message: "Error: Server Error",
                            });
                          }

                          School.findOne(
                            { _id: club.school },
                            (err, school) => {
                              if (err) {
                                return res.json({
                                  success: false,
                                  message: "Error: Server Error",
                                });
                              }

                              if (school) {
                                const index = school.clubs.indexOf(clubId);
                                if (index !== -1) {
                                  school.clubs.splice(index, 1);
                                }
                                school.save((err, school) => {
                                  if (err) {
                                    return res.json({
                                      success: false,
                                      message: "Error: Server Error",
                                    });
                                  }
                                });
                              }

                              Tag.deleteMany(
                                { _id: { $in: club.tags } },
                                (err) => {
                                  if (err) {
                                    return res.json({
                                      success: false,
                                      message: "Error: Server Error",
                                    });
                                  }

                                  User.updateMany(
                                    {},
                                    { $pull: { clubs: clubId } },
                                    (err) => {
                                      if (err) {
                                        return res.json({
                                          success: false,
                                          message: "Error: Server Error",
                                        });
                                      }

                                      User.find({}, (err, allUsers) => {
                                        if (err) {
                                          return res.json({
                                            success: false,
                                            message: "Error: Server Error",
                                          });
                                        }

                                        Announcement.deleteMany(
                                          {
                                            _id: { $in: club.announcements },
                                          },
                                          (err) => {
                                            if (err) {
                                              return res.json({
                                                success: false,
                                                message: "Error: Server Error",
                                              });
                                            }

                                            Meeting.deleteMany(
                                              { _id: { $in: club.meetings } },
                                              (err) => {
                                                if (err) {
                                                  return res.json({
                                                    success: false,
                                                    message:
                                                      "Error: Server Error",
                                                  });
                                                }
                                              }
                                            );
                                          }
                                        );
                                      });
                                    }
                                  );
                                }
                              );
                            }
                          );
                        });
                      });
                    } else if (club.sponsors.includes(deleteThis._id)) {
                      club.sponsors.splice(
                        club.sponsors.indexOf(deleteThis._id),
                        1
                      );
                    }
                  }

                  const foundDues = club.dues.find(
                    (dues) => dues.user.toString() == deleteThis._id.toString()
                  );
                  const foundDuesIndex = club.dues.indexOf(foundDues);

                  if (foundDuesIndex > -1) {
                    club.dues.splice(foundDuesIndex, 1);
                  }

                  return club.save();
                });

                Promise.all(promises)
                  .then((clubs) => {
                    return res.json({
                      success: true,
                      message: `${deleteThis.firstName} murdered`,
                    });
                  })
                  .catch((err) => {
                    return res.json({
                      success: false,
                      message: "server error",
                    });
                  });
              });
            });
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
