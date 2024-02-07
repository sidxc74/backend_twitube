
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: 'backend-1', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadonCloudinary = async(localFilePath) => {
    try{
            if(!localFilePath) return null
            //upload
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type : "auto"
            })
            //file uploaded 
            // console.log("file uploaded",response.url)
            fs.unlinkSync(localFilePath )
            return response




    } catch (error) {
            fs.unlinkSync(localFilePath) //remove locally saved temp file as upload failed
            return null;
    }
}

export {uploadonCloudinary}