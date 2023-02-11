const config = require("../config/keys");

const sendEmail = async (user, subject, text) => {
  const options = {
    user: config.email,
    pass: config.password,
    to: user.email,
    subject: subject,
    text: text,
  };

  const send = require("gmail-send")(options);
  send({}, (err, res, full) => {
    console.log("err:", err, "; res:", res, "; full:", full);
    if (err) {
      console.log(err);
      return err;
    } else {
      return res;
    }
  });
};

module.exports = { sendEmail };
