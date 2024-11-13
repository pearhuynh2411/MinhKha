import express from 'express';
import { getVideos, getTypes, getVideosTypeId, getVideoById } from '../controllers/videoControllers.js';
import { middlewareToken } from '../config/jwt.js';
import { tryCatch } from '../config/tryCatch.js';

const videoRoutes = express.Router();

//define API get list videos
videoRoutes.get("/get-videos", tryCatch(getVideos));
//define API get type videos
videoRoutes.get("/get-types", /* middlewareToken, */ tryCatch(getTypes));
//define API get list videos by video type
videoRoutes.get("/get-videos/:typeId", tryCatch(getVideosTypeId) );
//define API get videos details
videoRoutes.get("/get-video/:videoId", tryCatch(getVideoById) )

export default videoRoutes;