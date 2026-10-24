import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./errors/AppError.js";

const app = express();

// Hardening: Helmet sets secure HTTP response headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Hardening: Rate limiting to protect endpoints against brute force and denial of service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Generous limit of 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes.",
      code: "TOO_MANY_REQUESTS",
    },
  },
});
app.use("/api", limiter);

// Hardening: CORS allows configured frontend origin as well as local development ports
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, tests, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Hardening: JSON body parsing with strict 100kb size limit to prevent memory exhaustion
app.use(express.json({ limit: "100kb" }));

// Mount API version 1 routes
app.use("/api/v1", apiRouter);

// Unknown routes return a JSON 404
app.use((req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
});

// Central error-handling middleware
app.use(errorHandler);

export default app;
