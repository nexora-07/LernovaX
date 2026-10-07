const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


const authRoutes = require("./src/routes/authRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const enrollmentRoutes = require("./src/routes/enrollmentRoutes");
const errorHandler = require("./src/middleware/error");
const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const frontendOrigin = process.env.FRONTEND_URL
  ? new URL(process.env.FRONTEND_URL).origin
  : null;
const allowedOrigins = [frontendOrigin, "http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));

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
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);


app.use(errorHandler);

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message:
      statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message,
  });
});

module.exports = app;
