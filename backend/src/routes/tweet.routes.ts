import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js"


const tweetRouter = express.Router()

tweetRouter.use(isAuth)

tweetRouter.post("/create", createTweet)
tweetRouter.patch("/update/:tweetId", updateTweet)
tweetRouter.get("/user/:userId", getUserTweets)
tweetRouter.delete("/delete/:tweetId", deleteTweet)

export default tweetRouter


