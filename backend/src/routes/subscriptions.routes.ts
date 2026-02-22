import express from "express";
import { isAuth } from "../middlewares/isAuth";
import { getsubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller";


const subscriptionRouter = express.Router();

subscriptionRouter.use(isAuth);

subscriptionRouter.post("/c/:channelId", toggleSubscription);
subscriptionRouter.get("/u/:subscriberId", getsubscribedChannels);

subscriptionRouter.get("/c/:channelId", getUserChannelSubscribers );

export default subscriptionRouter;
