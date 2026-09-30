const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./src/routes/authRoutes");
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "successful",
    message: "Welcome to LernovaX backend",
  });
});

// API version
app.get("/api/v1", (req, res) => {
  res.status(200).json({
    status: "successful",
    message: "Welcome to LernovaX backend",
  });
});

// Auth routes
app.use("/api/v1/auth", authRoutes);

module.exports = app;