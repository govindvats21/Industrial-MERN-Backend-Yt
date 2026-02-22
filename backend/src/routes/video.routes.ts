import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.js";



const videoRouter = express.Router();

// Sabhi routes par authentication lagane ke liye
videoRouter.use(isAuth); 

// 1. Saari videos fetch karna
videoRouter.get("/", getAllVideos);

// 2. Nayi video upload karna (Video aur Thumbnail ke saath)
videoRouter.post("/publish-video", isAuth, upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo);

// // 3. Ek specific video dekhna
videoRouter.get("/v/:videoId", getVideoById);

// // // 4. Video ki details update karna
videoRouter.patch("/update-video/:videoId", isAuth, upload.single("thumbnail"), updateVideo);

// // // 5. Video delete karna
videoRouter.delete("/delete-video/:videoId", deleteVideo);

// // // 6. Video ko public/private toggle karna
videoRouter.patch("/toggle-publish/:videoId", togglePublishStatus);

export default videoRouter;