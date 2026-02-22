import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";


const commentRouter = express.Router();

commentRouter.use(isAuth);

commentRouter.post("/:videoId", addComment);
commentRouter.get("/:videoId", getVideoComments);

commentRouter.patch("/c/:commentId", updateComment);
commentRouter.delete("/c/:commentId", deleteComment);

export default commentRouter;
