import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { getsubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";


const subscriptionRouter = express.Router();

subscriptionRouter.use(isAuth);

subscriptionRouter.post("/c/:channelId", toggleSubscription);
subscriptionRouter.get("/u/:subscriberId", getsubscribedChannels);

subscriptionRouter.get("/c/:channelId", getUserChannelSubscribers );

export default subscriptionRouter;
