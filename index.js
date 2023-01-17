require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5001;
const VERSION = require("./config/keys").version;

const users = require("./routes/users");
const schools = require("./routes/schools");
const clubs = require("./routes/clubs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

const db = require("./config/keys").mongoURI;
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use(`/api/users`, users);
app.use(`/api/schools`, schools);
app.use(`/api/clubs`, clubs);

app.get("/", (req, res) => res.send("Clubverse API v" + VERSION));

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
