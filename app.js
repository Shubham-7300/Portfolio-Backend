import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors";
import { dbConnection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import timelineRouter from "./routes/timelineRouter.js";
import messageRouter from "./routes/messageRouter.js";
import skillRouter from "./routes/skillRouter.js";
import softwareApplicationRouter from "./routes/softwareApplicationRouter.js";
import projectRouter from "./routes/projectRouter.js";

const app = express();

// Load environment variables
dotenv.config({ path: "./config/config.env" });

// Configure CORS
const allowedOrigins = [process.env.PORTFOLIO_URL, process.env.DASHBOARD_URL];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,  // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup file upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // Make sure this is a valid path on your server
  })
);

// Define API routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/timeline", timelineRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/skill", skillRouter);
app.use("/api/v1/softwareapplication", softwareApplicationRouter);
app.use("/api/v1/project", projectRouter);

// Database connection
dbConnection();

// Error handling middleware
app.use(errorMiddleware);

export default app;
