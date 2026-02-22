import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js"



const likeRouter = express.Router()

likeRouter.use(isAuth)

likeRouter.post("/toggle/v/:videoId", isAuth, toggleVideoLike)
likeRouter.post("/toggle/c/:commentId", isAuth, toggleCommentLike)
likeRouter.post("/toggle/t/:tweetId", isAuth, toggleTweetLike)
likeRouter.get("/videos", getLikedVideos)


export default likeRouter


