import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Mount API version 1 routes
app.use("/api/v1", apiRouter);

// Central error-handling middleware
app.use(errorHandler);

export default app;
