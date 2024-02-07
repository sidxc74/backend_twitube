import { Router } from "express";
import { 
    changeCurrentUserPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getUserWatchedHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountInformation, 
    updateUserAvatar, 
    updateUserCoverImage } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import  verifyjwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    
    registerUser);

router.route("/login").post(loginUser)

//secured routes -- user login hona chaiye

router.route("/logout").post(verifyjwt,logoutUser)
router.route("/refreshtoken").post(refreshAccessToken)
router.route("/change-password").post(verifyjwt,changeCurrentUserPassword)
router.route("/currentuser").get(verifyjwt,getCurrentUser)
router.route("/update-user").post(verifyjwt,updateAccountInformation)
router.route("/updateavatar").patch(verifyjwt,upload.single("avatar"),updateUserAvatar)
router.route("/updateCoverImage").patch(verifyjwt,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyjwt,getUserChannelProfile)
router.route("/history").get(verifyjwt, getUserWatchedHistory)

//get to get where we are not sedning any data or passing data using params so like in getting channel history currentuser
//post where we want to send data 
//patch where we want to just update particular field not post whole data
//put for updating whole data


export default router;