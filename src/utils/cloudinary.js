import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";



    cloudinary.config({ 
        cloud_name: 'CLOUDINARY_CLOUD_NAME', // Click 'View API Keys' above to copy your cloud name
        api_key: 'CLOUDINARY_API_KEY', // Click 'View API Keys' above to copy your API key
        api_secret: 'CLOUDINARY_API_SECRET' // Click 'View API Keys' above to copy your API secret
    });




const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null
        const response =  await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        console.log("File uploaded successfully", response.url);
       return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the file if upload fails
        return null
    }  
}




export default uploadOnCloudinary;

    
cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
{ public_id: "Olympic_flag" },
function(error, result) { console.log(result); });