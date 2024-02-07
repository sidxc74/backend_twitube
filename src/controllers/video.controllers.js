import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadonCloudinary } from "../utils/fileUpload.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query



    
        
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!(title && description)) throw new ApiError(401,"enter title and description")

    const user = await User.findById(req.user?._id)

    if(!user) throw new ApiError("unauthhorized access")
    
    const videoLocalPath = req.files?.video[0]?.path
    const thumbNailPath = req.files?.thumbNail[0]?.path


    if(!(videoLocalPath && thumbNailPath)) throw new ApiError("thumbnail and video are required")

    const cloudinaryVideo = await uploadonCloudinary(videoLocalPath)
    const cloudinarythumbNail = await uploadonCloudinary(thumbNailPath)
    console.log(cloudinaryVideo)

    if(!(cloudinaryVideo && cloudinarythumbNail)) throw new ApiError(401,"unable to upload video and thumbNail on cloudinary")

    const video = await Video.create({
        title,
        description,
        videoFile : cloudinaryVideo.url,
        thumbNail : cloudinarythumbNail.url,
        owner : user._id,
        duration : cloudinaryVideo.duration,
        views : 0,
        isPublished : true,




    })

    if(!video) throw new ApiError(500,"something went wrong while updaing")

    return res.status(200).json(new ApiResponse(200,video,"video uploaded succesfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoid } = req.params
    console.log(videoid)
    
    if(!isValidObjectId(videoid)) throw new ApiError("bad request send some id yaaaa!!!!..... you lil nigga")

    const video = await Video.findById({
        _id : videoid
    })

    if( !video || ( !video?.isPublished &&  !(video?.owner.toString() === req.user?._id.toString()) ) ){
        throw new ApiError(404,"Video not found")
    }

    return res.status(200).json(new ApiResponse(200,video,"video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoid } = req.params

    console.log(videoid)
    
    if(!isValidObjectId(videoid)) throw new ApiError("bad request send some id yaaaa!!!!..... you lil nigga")

    const videoLocalPath = req.files?.video[0]?.path

    if(!videoLocalPath) throw new ApiError("give some new video to update")
    const cloudinaryVideo = await uploadonCloudinary(videoLocalPath)
    if(!cloudinaryVideo) throw new ApiError(401,"error while uploading try again")


    const video = await Video.findByIdAndUpdate(videoid,
        {
            $set : {

                videoFile : cloudinaryVideo,

            }
        })
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
})









export {
    publishAVideo,
    getVideoById
}

