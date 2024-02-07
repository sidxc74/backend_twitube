import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



//method for refresh and acess token

const generateAccessAndRefreshToken = async(userId)=>{
    try{

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        //as we are not sending any fileds so as we dont need so thats why validateBeforeSave
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}


    } catch(error)
    {
        throw new ApiError(500,"something went wrong while generating token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //get user details from frontend
    //validation - not empty
    //check if user already exist - username and email
    // check for images check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db'
    //remove pass and refresh token from response
    //check for user creation
    //return res

    const {fullName,email,userName,password} = req.body
    console.log("email :" ,email);

    if(
        [fullName,email,userName,password].some((field) => {
            field?.trim() === ""
        })
    )
    {
        throw new ApiError(400,"All Fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{ userName },{ email }]
    })

    if(existedUser)
    {
        throw new ApiError(409,"user with email or username already exist")

    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) throw new ApiError(400,"Avatar required")

   const avatar = await uploadonCloudinary(avatarLocalPath) 
   const coverImage = await uploadonCloudinary(coverImageLocalPath)

if(!avatar)  throw new ApiError(400,"can upload avatar on cloudinary")

const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    userName : userName.toLowerCase()
})

const recheckUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!recheckUser) throw new ApiError(500,"something went wrong while registering user")

return res.status(201).json(
    new ApiResponse(200,recheckUser,"user registered")
)







    
});

const loginUser = asyncHandler(async (req, res) => {
    //req-body -> data
    // usrname or email 
    // find the user 
    // password check
    // access oken and refresh token
    //send cookies and login
    
    const {userName,email,password} = req.body;


    console.log(email,userName)
    if(!(userName || email)) throw new ApiError(400,"usernameee or email is required")

    const user = await User.findOne({
        $or : [{userName},{email}]
    })

    if(!user) throw new ApiError(404,"user dont exist")

   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid) throw new ApiError(404,"password is wrong")

   const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

   const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
        httpOnly : true,
        secure : true
   }

   return res.
   status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(200,{
        user : loggedinUser,
        accessToken,
        refreshToken
    },"user logged in successfully")
   )



    
})

const logoutUser = asyncHandler(async (req,res) => {
   await  User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1 //this remove field from document
            },
            
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .clearCookie("acessToken",options)
   .json(new ApiResponse(200,{},"User logged-out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) throw new ApiError (401,"unauthorized request")

   try {
     const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id)
     console.log(user)
 
     if(!user) throw new ApiError (401,"invalid refresh Token")
 
     if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401,"refreshtoken is expired or used")
 
     const options = {
         httpOnly : true,
         secure : true
     }
 
     const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options) 
     .json(new ApiResponse(200,{accessToken : accessToken,refreshToken : refreshToken},"token refreshed"))
   } catch (error) {
            throw new ApiError(401,error.message || "invalid accessToken")
   }

    
})


const changeCurrentUserPassword = asyncHandler(async ( req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400, "invalid old password")

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200).json(new ApiResponse(200,{},"password changed successully"))
})

const getCurrentUser = asyncHandler(async(req , res) => {
    return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountInformation = asyncHandler(async (req,res) => {
    const {fullName, email} = req.body

    if( !(fullName || email)) throw new ApiError(400,"send something to update")

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {
            new : true
        }
        ).select("-password")

        return res
               .status(200)
               .json(new ApiResponse(200,user,"account details updates successfully"))
})

const updateUserAvatar = asyncHandler( async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400,"avatar file is missing")

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400,"error while uploading on avatar")

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }).select("-password")

        return res
               .status(200)
               .json(new ApiResponse(200,user,"avatar  updated successfully"))


})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath ) throw new ApiError(400,"coverImage file is missing")

    const coverImage = await uploadonCloudinary(avatarLocalPath)

    if(!coverImage.url) throw new ApiError(400,"error while uploading on avatar")

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }).select("-password")

        return res
               .status(200)
               .json(new ApiResponse(200,user,"coverImage  updated successfully"))


})

//pipelines
const getUserChannelProfile = asyncHandler(async(req,res) => {
        const {username} = req.params  
        if(!username?.trim()) throw new ApiError(400,"username is missing")

        const channel = await User.aggregate([
            {
                $match : {
                    userName : username?.toLowerCase()
                }
            },
            {
                $lookup : {
                    from :  "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers"

                }
            },
            {
                $lookup : {
                    from :  "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            {
                $addFields : {
                    subscribersCount : {
                        $size : "$subscribers"

                    },
                    channelSubscribedToCount : {
                        $size : "$subscribedTo"
                    },
                    isSubscribed : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else :false

                    }
                }
            },
            {
                $project : {
                    fullName : 1,
                    userName : 1,
                    subscribersCount : 1,
                    channelSubscribedToCount : 1,
                    isSubscribed :1,
                    avatar : 1,
                    coverImage : 1,
                    email : 1

                    //this one is flag flag 1 for which we want to send and default is 0  this $project is used to get optional data according to need from full object
                }
            }
        ])

        if(!channel?.length) throw new ApiError(404, "error not found")

        return res.status(200)
                 .json(
                    new ApiResponse(200,channel[0],"user channel fetched successfully")
                 )
})

const getUserWatchedHistory = asyncHandler( async(req,res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from :  "videos",
                    localField : "watchHistory",
                    foreignField : "_id",
                    as : "watchHistory",
                    pipeline : [
                        {
                            $lookup : {
                                from :  "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner",
                                pipeline : [
                                    {
                                        $project : {
                                            fullName : 1,
                                            userName : 1,
                                            avatar : 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
            }

        }
    ])

    return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    user[0].watchHistory,
                    "watchHistory fetched successfully"
                )
            )
})



export { registerUser,
         loginUser,
         logoutUser,
         refreshAccessToken,
         changeCurrentUserPassword,
         getCurrentUser,
         updateAccountInformation,
         updateUserAvatar,
         updateUserCoverImage,
         getUserChannelProfile,
         getUserWatchedHistory
};

