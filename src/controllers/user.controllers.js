import {asyncHandler} from "../utils/asyncHandler.js";
import {APIError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { APIResponse } from "../utils/Apiresponse.js";
const registerUser = asyncHandler(async (req, res) => {
     // get user detail from frontend   --user full avata pass 
     // validation - not empty
     //chech if already exists:user ,email
     //cheack imagea and avatar

     //upload them to cloudnary ,avatar
     //create user object - create entry in db
     //remove password and refresh token field from responce
     // check for user crwation /rturn res

   const {username,fullName,email,password} = req.body
   
   // if(fullName==""){
   //    throw new APIError(400,"Fullname is required")
   // }
    if(
      [!fullName,email,username,password].some((field)=>field?.trim() === "")
    ) {
         throw new APIError (400,"all fields are required")
    }

    const existedUser = await User.findOne({
      $or:[{username},{email}]
    })
    if(existedUser){
      throw new APIError(409,"User with eamil.and username existed")
    }
   const avatarLocalPath =  req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath){
    throw new APIError(400,"Avatar is required")
   }

   if(!coverImageLocalPath){
    throw new APIError(400,"Cover image is required")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
  if(!avatar){
    throw new APIError(400,"Avatar is required")
   }
  if(!coverImage){
    throw new APIError(400,"coverImage is required")
   }

  const user = await User.create(
    {
      fullName,
      avatar:avatar.url,
      coverImage:coverImage.url || "",
      password,
      email,
      username:username.toLowerCase()
    }
  )
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  )
  if(!createdUser){
    throw new APIError(500,'something gone wrong when registering user')
  }

 return res.status(201).json(
  new APIResponse(200, createdUser, "User created successfully"));

  })



export {registerUser}