const express = require("express");
const mongoose = require("mongoose");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const app = express();

mongoose.connect(
  "mongodb+srv://pajju2pg:mmNqjgtPJa5vSeOR@cluster0.mjmw0ji.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define mongoose schemas for User and Session
const userSchema = new mongoose.Schema({
  universityID: String,
  password: String,
});

const sessionSchema = new mongoose.Schema({
  studentName: String,
  sessionDate: String,
  selectedSlot: String,
  bookedBy: String,
});

const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", sessionSchema);

// Middleware for parsing JSON request bodies
app.use(express.json());

function generateUUID() {
  return uuid.v4(); // Generate a UUID
}

// Student Authentication
app.post("/api/auth/student", async (req, res) => {
  const { universityID, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ universityID });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password (you should also include error handling for bcrypt)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate a UUID token
  const uuidToken = generateUUID();

  // Create a new user document and insert it into the database
  User.create({
    universityID,
    password: hashedPassword,
    uuidToken, // Store the UUID token in the database
  })
    .then(() => {
      res.json({ uuidToken }); // Return the UUID token in the response
    })
    .catch((err) => {
      return res.status(500).json({ message: "Error creating user" });
    });
});

// Get Free Sessions (Assuming you have a predefined list of sessions)
const availableSessions = [
  { date: "Thursday 10 AM", slots: ["Slot 1", "Slot 2"] },
  { date: "Friday 10 AM", slots: ["Slot 1", "Slot 2"] },
];

app.get("/api/sessions/free", (req, res) => {
  res.json({ sessions: availableSessions });
});

// Book a Session
app.post("/api/sessions/book", async (req, res) => {
  const { studentName, sessionDate, selectedSlot, bookedBy} = req.body;

  // Check if the session slot is available
  const existingSession = await Session.findOne({ sessionDate, selectedSlot });

  if (existingSession) {
    return res.status(400).json({ message: "Session slot is already booked." });
  }

  Session.create({
    studentName,
    sessionDate,
    selectedSlot,
    bookedBy,
  })
    .then(() => {
      res.json({
        studentName,
        sessionDate,
        selectedSlot,
        bookedBy,
      });
    })
    .catch((err) => {
      return res.status(500).json({ message: "Error Booking the Slot" });
    });
});

// Dean Registration
app.post("/api/auth/dean/register", async (req, res) => {
  const { universityID, password } = req.body;

  // Check if the dean already exists
  const existingDean = await User.findOne({ universityID });
  if (existingDean) {
    return res.status(400).json({ message: "Dean already exists" });
  }

  // Hash the password (you should also include error handling for bcrypt)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate a UUID token for the dean
  const uuidToken = generateUUID();

  // Create a new dean user document and insert it into the database
  User.create({
    universityID,
    password: hashedPassword,
    uuidToken, // Store the UUID token in the database
  })
    .then((newDean) => {
      res.json({ uuidToken }); // Return the UUID token in the response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Error creating dean user" });
    });
});

// Get Pending Sessions for Dean
app.get("/api/sessions/pending/dean", (req, res) => {
  Session.find({ bookedBy: "dean123" })
    .then((sessions) => {
      res.json({ sessions });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Error fetching pending sessions" });
    });
});

app.get("/api/sessions/pending/dean-after-time-passed", async (req, res) => {
    try {
      const currentTime = new Date(); // Get the current time
  
      // Query the database for sessions where sessionDate is greater than the current date
      const sessions = await Session.find({
        bookedBy: "dean123",
        studentName: { $ne: "Student A" },
        sessionDate: { $gt: currentTime },
      });
  
      res.json({ sessions });
    } catch (err) {
      return res.status(500).json({ message: "Error fetching pending sessions" });
    }
  });
  
  

// Continue with other routes and logic as needed

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
