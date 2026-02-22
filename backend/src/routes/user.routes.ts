import express from "express";
import { upload } from "../middlewares/multer";
import { changeCurrentPassword, clearWatchHistory, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, registerUser, updateAccountDetails, updateUserAvatarImage, updateUserCoverImage } from "../controllers/user.controller";
import { isAuth } from "../middlewares/isAuth";

 const userRouter = express.Router()

userRouter.post('/register',upload.fields([
{
    name:'avatarImage',
    maxCount:1
},{
    name:'coverImage',
    maxCount:1
}

]), registerUser)

userRouter.post('/login',loginUser)
userRouter.get('/logout', isAuth ,logoutUser)
userRouter.get('/getCurrentUser', isAuth ,getCurrentUser)
userRouter.post('/change-password', isAuth ,changeCurrentPassword)
userRouter.patch('/update-account', isAuth ,updateAccountDetails)
userRouter.patch('/avatarImage', isAuth , upload.single("avatarImage"), updateUserAvatarImage)
userRouter.patch('/coverImage', isAuth , upload.single("coverImage"), updateUserCoverImage)

userRouter.get('/c/:userName', isAuth ,getUserChannelProfile)
userRouter.get('/history', isAuth ,getWatchHistory)
userRouter.delete('/clear-history', isAuth ,clearWatchHistory)



export default userRouter