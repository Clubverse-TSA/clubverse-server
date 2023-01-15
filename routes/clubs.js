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

router.post("/create", (req, res) => {
  const { name, description, sponsorId, room } = req.body;

  User.findOne({ _id: sponsorId }, (err, user) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (user.type !== "sponsor") {
      return res.json({
        success: false,
        message: "Not a sponsor",
      });
    }

    const newClub = new Club({
      name,
      description,
      room,
      sponsors: [user._id],
      school: user.school,
    });

    newClub.save((err, club) => {
      if (err) {
        return res.json({
          success: false,
          message: "Error: Server Error",
        });
      }

      user.clubs.push(club._id);
      user.save((err, user1) => {
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

          school.clubs.push(club._id);
          school.save((err, school1) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            return res.json({
              success: true,
              club: club,
              school: school1,
              user: user1,
            });
          });
        });
      });
    });
  });
});

router.post("/approve", (req, res) => {
  const { adminId, clubId, decision } = req.body;

  User.findOne({ _id: adminId }, (err, user) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (user.type !== "admin") {
      return res.json({
        success: false,
        message: "Not admin",
      });
    }

    Club.findOne({ _id: clubId }, (err, club) => {
      if (err) {
        return res.json({
          success: false,
          message: "Error: Server Error",
        });
      }

      club.pending = !decision;

      if (club.pending === true) {
        let promises = [];
        promises = club.sponsors.map(async (sponsor) => {
          let user = await User.findOne({ _id: sponsor });
          user.clubs.splice(user.clubs.indexOf(club._id), 1);
          return user.save();
        });
        Promise.all(promises).then((users) => {
          Club.deleteOne({ _id: clubId }, (err) => {
            return res.json({
              success: true,
              message: "Declined Club",
            });
          });
        });
      } else {
        club.save((err, club1) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Approved",
            club: club1,
          });
        });
      }
    });
  });
});

router.post("/delete", (req, res) => {
  const { clubId, userId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
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

        School.findOne({ _id: club.school }, (err, school) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          if (school) {
            school.clubs = school.clubs.filter((club) => club !== clubId);
            school.save((err, school) => {
              if (err) {
                return res.json({
                  success: false,
                  message: "Error: Server Error",
                });
              }
            });
          }

          // update sponsors, members,
          // delete announcements, meetings

          User.find({}, (err, allUsers) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            let users = [];

            users = allUsers.filter((user1) => user1.clubs.includes(club._id));
            users = users.map((user1) => {
              user1.clubs.splice(user1.clubs.indexOf(club._id), 1);
              return user.save();
            });

            Promise.all(users).then((response) => {
              Announcement.deleteMany({ club: club._id }, (err) => {
                if (err) {
                  return res.json({
                    success: false,
                    message: "Error: Server Error",
                  });
                }

                Meeting.deleteMany({ club: club._id }, (err) => {
                  if (err) {
                    return res.json({
                      success: false,
                      message: "Error: Server Error",
                    });
                  }

                  return res.json({
                    success: true,
                    message: "club deleted",
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

router.post("/edit", (req, res) => {
  const { clubId, userId, name, description, importantDates, room } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      club.name = name;
      club.description = description;
      club.importantDates = importantDates;
      club.room = room;
      club.save((err, club) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        return res.json({
          success: true,
          message: "Club edited",
          club,
        });
      });
    });
  });
});

router.post("/updateDues", (req, res) => {
  const { clubId, userId, updateId, paidStatus } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        const member = club.members.find((member) => member.user == userId);
        if (!member || member.role !== "officer") {
          return res.json({
            success: false,
            message: "Not authorized",
          });
        }
      }

      const update = club.dues.find((update) => update.user == updateId);
      if (update) {
        update.paid = paidStatus;
        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Dues updated",
            club,
          });
        });
      }
    });
  });
});

router.post("/join", (req, res) => {
  const { clubId, userId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (
        club.members.findIndex((member) => member.user == userId) !== -1 ||
        club.requests.indexOf(user._id) !== -1
      ) {
        return res.json({
          success: false,
          message: "User already in club or has requested to join",
        });
      }

      club.requests.push(user._id);
      club.save((err, club) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        return res.json({
          success: true,
          message: "User requested to join",
          club,
        });
      });
    });
  });
});

router.post("/members/approveDeny", (req, res) => {
  const { clubId, userId, requestUserId, decision } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      User.findOne({ _id: requestUserId }, (err, user1) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!user1) {
          return res.json({
            success: false,
            message: "User doesn't exist",
          });
        }

        if (decision) {
          club.members.push({
            user: user1._id,
            role: "member",
          });
          user1.clubs.push(clubId);
        }

        const index = club.requests.indexOf(requestUserId);
        if (index !== -1) {
          club.requests.splice(index, 1);
        }

        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          user1.save((err, user2) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            return res.json({
              success: true,
              message: "Request accepted/declined",
              club,
              user: user2,
            });
          });
        });
      });
    });
  });
});

router.post("/leave", (req, res) => {
  const { clubId, userId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type == "admin" || club.sponsors.indexOf(user._id) !== -1) {
        return res.json({
          success: false,
          message: "Admins and sponsors cannot leave",
        });
      }

      if (club.members.findIndex((member) => member.user == userId) === -1) {
        return res.json({
          success: false,
          message: "User not in club",
        });
      }

      const index = club.members.findIndex((member) => member.user == user._id);
      if (index !== -1) {
        club.members.splice(index, 1);
      }

      const index1 = user.clubs.indexOf(clubId);
      if (index1 !== -1) {
        user.clubs.splice(index1, 1);
      }

      club.save((err, club) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        user.save((err, user) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "User left club",
            club,
            user,
          });
        });
      });
    });
  });
});

router.post("/members/remove", (req, res) => {
  const { clubId, userId, removeUserId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      User.findOne({ _id: removeUserId }, (err, user1) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!user1) {
          return res.json({
            success: false,
            message: "User doesn't exist",
          });
        }

        const index = club.members.findIndex((member) => {
          return member.user == removeUserId;
        });

        if (index !== -1) {
          club.members.splice(index, 1);
        }

        const index1 = user1.clubs.indexOf(clubId);
        if (index1 !== -1) {
          user1.clubs.splice(index1, 1);
        }

        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          user1.save((err, user1) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            return res.json({
              success: true,
              message: "User removed from club",
              club,
              user1,
            });
          });
        });
      });
    });
  });
});

router.post("/members/promoteDemote", (req, res) => {
  const { clubId, userId, promoteDemoteUserId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      User.findOne({ _id: promoteDemoteUserId }, (err, user1) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!user1) {
          return res.json({
            success: false,
            message: "User doesn't exist",
          });
        }

        if (user1.type === "admin") {
          return res.json({
            success: false,
            message: "Cannot promote/demote admin",
          });
        }

        if (user1.type === "sponsor") {
          return res.json({
            success: false,
            message: "Cannot promote/demote sponsor",
          });
        }

        const member = club.members.find(
          (member) => member.user == promoteDemoteUserId
        );

        if (member.role === "officer") {
          member.role = "member";
        } else {
          member.role = "officer";
        }

        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "User promoted/demoted",
            club,
          });
        });
      });
    });
  });
});

router.post("/meetings/new", (req, res) => {
  const { clubId, userId, date } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        const member = club.members.find((member) => member.user == userId);
        if (!member || member.role !== "officer") {
          return res.json({
            success: false,
            message: "Not authorized",
          });
        }
      }

      const newMeeting = new Meeting({
        date,
        club: clubId,
        attendance: [],
      });

      club.members.forEach((member) => {
        newMeeting.attendance.push({
          user: member.user,
          status: "neutral",
        });
      });

      club.sponsors.forEach((sponsor) => {
        newMeeting.attendance.push({
          user: sponsor._id,
          status: "neutral",
        });
      });

      newMeeting.save((err, meeting) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        club.meetings.push(meeting._id);
        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Meeting created",
            meeting,
            club,
          });
        });
      });
    });
  });
});

router.post("/meetings/edit", (req, res) => {
  const { userId, meetingId, studentId, status } = req.body;

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
        message: "User doesn't exist",
      });
    }

    if (user.type !== "sponsor") {
      return res.json({
        success: false,
        message: "Not authorized",
      });
    }

    Meeting.findOne({ _id: meetingId }, (err, meeting) => {
      if (err) {
        return res.json({
          success: false,
          message: "Error: Server Error",
        });
      }

      if (!meeting) {
        return res.json({
          success: false,
          message: "Meeting doesn't exist",
        });
      }

      const member = meeting.attendance.find(
        (member) => member.user == studentId
      );

      // const memberIndex = meeting.members.indexOf();

      if (!member) {
        return res.json({
          success: false,
          message: "User not in meeting",
        });
      }

      member.status = status;
      meeting.save((err, member) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        return res.json({
          success: true,
          message: "Attendance updated",
          member,
          meeting,
        });
      });
    });
  });
});

router.post("/meetings/delete", (req, res) => {
  const { clubId, userId, meetingId } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        const member = club.members.find((member) => member.user == userId);
        if (!member || member.role !== "officer") {
          return res.json({
            success: false,
            message: "Not authorized",
          });
        }
      }

      Meeting.findOne({ _id: meetingId }, (err, meeting) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        if (!meeting) {
          return res.json({
            success: false,
            message: "Meeting doesn't exist",
          });
        }
        //Fix remove
        Meeting.deleteOne({ _id: meetingId }, (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          let meeting = club.meetings.find(
            (meeting) => meeting._id == meetingId
          );

          club.meetings.splice(club.meetings.indexOf(meeting), 1);
          club.save((err, club) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            return res.json({
              success: true,
              message: "Meeting deleted",
              club,
            });
          });
        });
      });
    });
  });
});

router.post("/announcements/new", (req, res) => {
  const { clubId, userId, message, tags, date, image } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        const member = club.members.find((member) => member.user == userId);
        if (!member || member.role !== "officer") {
          return res.json({
            success: false,
            message: "Not authorized",
          });
        }
      }

      const newAnnouncement = new Announcement();
      newAnnouncement.club = clubId;
      newAnnouncement.user = userId;
      newAnnouncement.message = message;

      if (tags) newAnnouncement.tags = tags;
      if (date) newAnnouncement.dateReminder = date;
      if (image) newAnnouncement.image = image;

      newAnnouncement.save((err, announcement) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        club.announcements.push(announcement._id);
        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Announcement created",
            club,
            announcement,
          });
        });
      });
    });
  });
});

router.post("/announcements/edit", (req, res) => {
  const { announcementId, userId, message, tags, date, image } = req.body;

  Announcement.findOne({ _id: announcementId }, (err, announcement) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!announcement) {
      return res.json({
        success: false,
        message: "Server error",
      });
    }

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
          message: "User doesn't exist",
        });
      }

      if (announcement.user !== userId) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      announcement.message = message;
      // tags should be an array of id's from frontend by default
      announcement.tags = tags;
      announcement.dateReminder = date;
      announcement.image = image;

      announcement.save((err, announcement) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        return res.json({
          success: true,
          message: "Announcement edited",
          announcement,
        });
      });
    });
  });
});

router.post("/announcements/delete", (req, res) => {
  const { announcementId, userId } = req.body;

  Announcement.findOne({ _id: announcementId }, (err, announcement) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!announcement) {
      return res.json({
        success: false,
        message: "Server error",
      });
    }

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
          message: "User doesn't exist",
        });
      }

      if (announcement.user !== userId) {
        return res.json({
          success: false,
          message: "Not authorized",
        });
      }

      Club.findOne({ _id: announcement.club }, (err, club) => {
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

        Announcement.deleteOne({ _id: announcementId }, (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          club.announcements = club.announcements.filter(
            (msg) => msg._id !== announcement._id
          );

          club.save((err, club1) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            return res.json({
              success: true,
              club: club1,
            });
          });
        });
      });
    });
  });
});

router.post("/tags/new", (req, res) => {
  const { clubId, userId, name, color } = req.body;

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
          message: "User doesn't exist",
        });
      }

      if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
        const member = club.members.find((member) => member.user == userId);
        if (!member || member.role !== "officer") {
          return res.json({
            success: false,
            message: "Not authorized",
          });
        }
      }

      const newTag = new Tag();
      newTag.club = clubId;
      newTag.name = name;
      newTag.color = color;

      newTag.save((err, tag) => {
        if (err) {
          return res.json({
            success: false,
            message: "Error: Server Error",
          });
        }

        club.tags.push(tag._id);
        club.save((err, club) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Tag created",
            club,
            tag,
          });
        });
      });
    });
  });
});

router.post("/tags/edit", (req, res) => {
  const { tagId, userId, name, color } = req.body;

  Tag.findOne({ _id: tagId }, (err, tag) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!tag) {
      return res.json({
        success: false,
        message: "Tag doesn't exist",
      });
    }

    Club.findOne({ _id: tag.club }, (err, club) => {
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
            message: "User doesn't exist",
          });
        }

        if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
          const member = club.members.find((member) => member.user == userId);
          if (!member || member.role !== "officer") {
            return res.json({
              success: false,
              message: "Not authorized",
            });
          }
        }

        tag.name = name;
        tag.color = color;

        tag.save((err, tag) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          return res.json({
            success: true,
            message: "Tag edited",
            tag,
          });
        });
      });
    });
  });
});

router.post("/tags/delete", (req, res) => {
  const { tagId, userId } = req.body;

  Tag.findOne({ _id: tagId }, (err, tag) => {
    if (err) {
      return res.json({
        success: false,
        message: "Error: Server Error",
      });
    }

    if (!tag) {
      return res.json({
        success: false,
        message: "Tag doesn't exist",
      });
    }

    Club.findOne({ _id: tag.club }, (err, club) => {
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
            message: "User doesn't exist",
          });
        }

        if (user.type !== "admin" && club.sponsors.indexOf(user._id) === -1) {
          const member = club.members.find((member) => member.user == userId);
          if (!member || member.role !== "officer") {
            return res.json({
              success: false,
              message: "Not authorized",
            });
          }
        }

        Tag.deleteOne({ _id: tagId }, (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Error: Server Error",
            });
          }

          club.tags = club.tags.filter((tag) => tag !== tagId);
          club.save((err, club) => {
            if (err) {
              return res.json({
                success: false,
                message: "Error: Server Error",
              });
            }

            Announcement.updateMany(
              { club: club._id },
              { $pull: { tags: tagId } },
              (err) => {
                if (err) {
                  return res.json({
                    success: false,
                    message: "Error: Server Error",
                  });
                }

                return res.json({
                  success: true,
                  message: "Tag deleted",
                  club,
                });
              }
            );
          });
        });
      });
    });
  });
});

module.exports = router;
