import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/connection.js";
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import subscriptionRouter from "./routes/subscriptions.route.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import cors from "cors";

;

const app: Application = express();
// Environment variables configuration
dotenv.config({
  path: "./.env", 
})
// CORS Configuration (Updated for production)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists", playlistRouter);

// Health Check for Render
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "API is running perfectly on Render" });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running in TypeScript on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

export { app };