import { Router } from "express";
import  verifyjwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishAVideo, getVideoById  } from "../controllers/video.controllers.js";


const router = Router()

router.route("/publishvideo").post(verifyjwt,
    upload.fields([
        {
            name : "video",
            maxCount : 1
        },
        {
            name : "thumbNail",
            maxCount : 1
        }
    ]),
    publishAVideo
    )

    router.route("/:videoid").get(verifyjwt,getVideoById)

    export default router
