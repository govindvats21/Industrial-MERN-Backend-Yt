import express from "express";
import { isAuth } from "../middlewares/isAuth";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";

const playlistRouter = express.Router();

playlistRouter.use(isAuth);

playlistRouter.post("/", createPlaylist);
playlistRouter.patch("/:playlistId", updatePlaylist);
playlistRouter.delete("/:playlistId", deletePlaylist);
playlistRouter.get("/:playlistId", getPlaylistById);

playlistRouter.patch("/add/:videoId/:playlistId", addVideoToPlaylist);
playlistRouter.patch("/remove/:videoId/:playlistId", removeVideoFromPlaylist);
playlistRouter.get("/user/:userId", getUserPlaylists);





export default playlistRouter;
