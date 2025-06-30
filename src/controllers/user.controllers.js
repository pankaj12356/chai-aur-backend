import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/AError.js";
import { APIResponse } from "../utils/Apiresponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"



const generateAccessTokenandRefreshToken = async(userId) => {
  try {
    const user =  await User.findById(userId)

     if (!user) {
      throw new APIError(400, "User not found while generating tokens");
    }


    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
     
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})
   
    return {accessToken,refreshToken}

  } catch (error) {
    throw new APIError(500,'something went wrong while generating refrsh and access')
  }
}



const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, email, password } = req.body;

  // Validate required fields
  if ([userName, fullName, email, password].some(field => typeof field !== "string" || field.trim() === "")) {
    throw new APIError(400, "All fields are required");
  }

  const username = userName.trim().toLowerCase();

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    const conflictField = existedUser.email === email ? "email" : "username";
    throw new APIError(409, `User with this ${conflictField} already exists`);
  }

  // Get file paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar is required");
  }

  if (!coverImageLocalPath) {
    throw new APIError(400, "Cover image is required");
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar?.url) {
    throw new APIError(400, "Avatar upload failed");
  }

  if (!coverImage?.url) {
    throw new APIError(400, "Cover image upload failed");
  }

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url,
    password,
    email,
    username
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new APIError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new APIResponse(201, createdUser, "User created successfully")
  );
});

const logInUser= asyncHandler(async(req,res)=>{
  //req body -> data
  //username or  email
  //find the user
  //password check
  //access and refresh oken
  //send cookie

  const {email,username,password} = req.body

  if(!username && !email){
    throw new APIError(400,"username or email is require")
  }
  
  const user = await User.findOne({
    $or :[{username},{email}]
  })
  if(!user){
    throw new APIError(404,"user not existe")
  }
  
  const isPasswordValid = await user.isPasswordCorrect(password)
  

  if(!isPasswordValid){
    throw new APIError(401,"user not existe")
  }

 const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

 
  const option = {
    httpOnly:true,
    secure:true,
    sameSite:"strict"
  }
  return res.status(200)
  .cookie("accessToken",accessToken,option)
  .cookie("refreshToken",refreshToken,option)
  .json(
    new APIResponse(
      200,{
        user:loggedInUser,
        accessToken,
        refreshToken
      },"User LogedIng SuccessfullY"
    )
  )









})



// const logOutUser = asyncHandler(async(req,res)=>{
//   // User.findByIdAndUpdate(
//   //   $set:{
//   //     refreshToken:undefined,
//   //   },
//   //   {
//   //     new:true,
//   //   }
//   // );
//   await User.findByIdAndUpdate(
//     req.user._id,
//     { $set: { refreshToken: undefined } },
//     { new: true }
//   );

//   const option = {
//     httpOnly:true,
//     secure:true
//   }
//   return res
//   .status(200)
//   .clearCookie("accessToken",option)
//   .clearCookie("refreshToken",option)
//   .json(new APIResponse(200,{},"User Logout"))
// }

// )

const logOutUser = asyncHandler(async (req, res) => {
  // Clear refresh token from the database
  await User.findByIdAndUpdate(
    req.user._id,
    { 
      $set: { 
        refreshToken: undefined
       } 
      },
    {
       new: true 
    }
  );

  // Cookie options
  const options = {
    httpOnly: true,
    secure: true, // set to true in production with HTTPS
    sameSite: "strict"
  };

  // Clear cookies and respond
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged out successfully"));
});


const refreshAccesstoken = asyncHandler(async(res,req)=>{
    
   const incomingRefreshYoken = req.cookie.refreshToken || req.body.refreshToken
   
   if(incomingRefreshYoken){
    throw new APIError(401,"unauthorized request")
   }
   
   try {
    const decodedToken = jwt.verify(incomingRefreshYoken,
     process.env.REFRESH_TOKEN_SECRET
    )
    const user  = await User.findById(decodedToken?._id)
   if(!user){
     throw new APIError(401,"Invalid refresh request")
   }
   if(incomingRefreshYoken !==user?.refreshToken){
     throw new APIError(401,"Refresh token is expired or used")
   }
 
 
   const option ={
     httpOnly:true,
     secure:true
 
   }
   const {accessToken,newRefreshToken} = await generateAccessTokenandRefreshToken(user._id)
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",newRefreshToken,option)
   .json(
     new APIResponse(
       200,{accessToken,refreshAccesstoken:newRefreshToken},
       "Access token refreshed"
     )
   )
   } catch (error) {
      throw new APIError(401,error?.message || "Invalid refresh tokrn")

   }

})






export { 
         registerUser ,
         logInUser,
         logOutUser,
         refreshAccesstoken
};














































// const diba = [// import {asyncHandler} from "../utils/asyncHandler.js";
// // import {APIError} from "../utils/ApiError.js";
// // import {User} from "../models/user.model.js";
// // import uploadOnCloudinary from "../utils/cloudinary.js";
// // import { APIResponse } from "../utils/Apiresponse.js";

// // const registerUser = asyncHandler(async (req, res) => {
// //   console.log("req.body:", req.body);
// // console.log("req.files:", req.files);

// //      // get user detail from frontend   --user full avata pass
// //      // validation - not empty
// //      //chech if already exists:user ,email
// //      //cheack imagea and avatar

// //      //upload them to cloudnary ,avatar
// //      //create user object - create entry in db
// //      //remove password and refresh token field from responce
// //      // check for user crwation /rturn res

// //    const {username,fullName,email,password} = req.body

// //    // if(fullName==""){
// //    //    throw new APIError(400,"Fullname is required")
// //    // }
// //  if ([fullName, email, username, password].some((field) => typeof field !== "string" || field.trim() === "")) {
// //   throw new APIError(400, "All fields are required");
// // }

// //     const existedUser = await User.findOne({
// //       $or:[{username},{email}]
// //     })
// //     if(existedUser){
// //       throw new APIError(409,"User with eamil.and username existed")
// //     }
// //    const avatarLocalPath = req.files?.avatar?.[0]?.path;
// //    const coverImageLocalPath = req.files?.coverImage[0]?.path
// // console.log("req.files:", req.files);
// // console.log("avatar file:", req.files?.avatar?.[0]);
// // console.log("avatarLocalPath:", avatarLocalPath);
// //    if (!avatarLocalPath) {
// //   console.log("Avatar file not found in req.files");
// //   throw new APIError(400, "Avatar is required");
// // }

// //    if(!coverImageLocalPath){
// //     throw new APIError(400,"Cover image is required")
// //    }
// //    const avatar = await uploadOnCloudinary(avatarLocalPath)
// //    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

// //   if(!avatar){
// //     throw new APIError(400,"Avatar is required")
// //    }
// //   if(!coverImage){
// //     throw new APIError(400,"coverImage is required")
// //    }

// //   const user = await User.create(
// //     {
// //       fullName,
// //       avatar:avatar.url,
// //       coverImage:coverImage.url || "",
// //       password,
// //       email,
// //       username:username.toLowerCase()
// //     }
// //   )
// //   const createdUser = await User.findById(user._id).select(
// //     "-password -refreshToken "
// //   )
// //   if(!createdUser){
// //     throw new APIError(500,'something gone wrong when registering user')
// //   }

// //  return res.status(201).json(
// //   new APIResponse(200, createdUser, "User created successfully"));

// //   })

// // export {registerUser}

// // import { asyncHandler } from "../utils/asyncHandler.js";
// // import { APIError } from "../utils/ApiError.js";
// // import { APIResponse } from "../utils/Apiresponse.js";
// // import { User } from "../models/user.model.js";
// // import uploadOnCloudinary from "../utils/cloudinary.js";
// // const registerUser = asyncHandler(async (req, res) => {
// //   console.log("req.body:", req.body);
// //   console.log("req.files:", req.files);
// //   const { username, fullName, email, password } = req.body;
// //   // Validate required fields if ([username, fullName, email, password].some(field => typeof field !== "string" || field.trim() === "")) { throw new APIError(400, "All fields are required"); }
// //   const userName = username.trim().toLowerCase();
// //   // Check if user already exists const existedUser = await User.findOne({ $or: [{ username }, { email }] });
// //   if (existedUser) {
// //     throw new APIError(409, "User with email or username already exists");
// //   }
// //   // Get file paths const avatarLocalPath = req.files?.avatar?.[0]?.path; const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
// //   if (!avatarLocalPath) {
// //     throw new APIError(400, "Avatar is required");
// //   }
// //   if (!coverImageLocalPath) {
// //     throw new APIError(400, "Cover image is required");
// //   }
// //   // Upload to Cloudinary const avatar = await uploadOnCloudinary(avatarLocalPath); const coverImage = await uploadOnCloudinary(coverImageLocalPath);
// //   if (!avatar?.url) {
// //     throw new APIError(400, "Avatar upload failed");
// //   }
// //   if (!coverImage?.url) {
// //     throw new APIError(400, "Cover image upload failed");
// //   }
// //   // Create user const user = await User.create({ fullName, avatar: avatar.url, coverImage: coverImage.url, password, email, username });
// //   const createdUser = await User.findById(user._id).select(
// //     "-password -refreshToken"
// //   );
// //   if (!createdUser) {
// //     throw new APIError(500, "Something went wrong while registering the user");
// //   }
// //   return res
// //     .status(201)
// //     .json(new APIResponse(201, createdUser, "User created successfully"));
// // });
// // export { registerUser };





// // import { asyncHandler } from "../utils/asyncHandler.js";
// // import { APIError } from "../utils/ApiError.js";
// // import { APIResponse } from "../utils/Apiresponse.js";
// // import { User } from "../models/user.model.js";
// // import uploadOnCloudinary from "../utils/cloudinary.js";

// // const registerUser = asyncHandler(async (req, res) => {
// //   console.log("req.body:", req.body);
// //   console.log("req.files:", req.files);

// //   let { username, fullName, email, password } = req.body;

// //   // Validate required fields
// //   if ([username, fullName, email, password].some(field => typeof field !== "string" || field.trim() === "")) {
// //     throw new APIError(400, "All fields are required");
// //   }

// //   username = username.trim().toLowerCase();

// //   // Check if user already exists
// //   const existedUser = await User.findOne({
// //     $or: [{ username }, { email }]
// //   });

// //   if (existedUser) {
// //     throw new APIError(409, "User with email or username already exists");
// //   }

// //   // Get file paths
// //   const avatarLocalPath = req.files?.avatar?.[0]?.path;
// //   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

// //   if (!avatarLocalPath) {
// //     throw new APIError(400, "Avatar is required");
// //   }

// //   if (!coverImageLocalPath) {
// //     throw new APIError(400, "Cover image is required");
// //   }

// //   // Upload to Cloudinary
// //   const avatar = await uploadOnCloudinary(avatarLocalPath);
// //   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

// //   if (!avatar?.url) {
// //     throw new APIError(400, "Avatar upload failed");
// //   }

// //   if (!coverImage?.url) {
// //     throw new APIError(400, "Cover image upload failed");
// //   }

// //   // Create user
// //   const user = await User.create({
// //     fullName,
// //     avatar: avatar.url,
// //     coverImage: coverImage.url,
// //     password,
// //     email,
// //     username
// //   });

// //   const createdUser = await User.findById(user._id).select("-password -refreshToken");

// //   if (!createdUser) {
// //     throw new APIError(500, "Something went wrong while registering the user");
// //   }

// //   return res.status(201).json(
// //     new APIResponse(201, createdUser, "User created successfully")
// //   );
// // });

// // export { registerUser };




// // import { asyncHandler } from "../utils/asyncHandler.js";
// // import { APIError } from "../utils/ApiError.js";
// // import { APIResponse } from "../utils/Apiresponse.js";
// // import { User } from "../models/user.model.js";
// // import uploadOnCloudinary from "../utils/cloudinary.js";

// // const registerUser = asyncHandler(async (req, res) => {
// //   console.log("req.body:", req.body);
// //   console.log("req.files:", req.files);

// //   const { userName, fullName, email, password } = req.body;

// //   // Validate required fields
// //   if ([userName, fullName, email, password].some(field => typeof field !== "string" || field.trim() === "")) {
// //     throw new APIError(400, "All fields are required");
// //   }

// //   const username = userName.trim().toLowerCase();

// //   // Check if user already exists
// //   const existedUser = await User.findOne({
// //     $or: [{ username }, { email }]
// //   });

// //   if (existedUser) {
// //     const conflictField = existedUser.email === email ? "email" : "username";
// //     throw new APIError(409, `User with this ${conflictField} already exists`);
// //   }

// //   // Get file paths
// //   const avatarLocalPath = req.files?.avatar?.[0]?.path;
// //   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

// //   if (!avatarLocalPath) {
// //     throw new APIError(400, "Avatar is required");
// //   }

// //   if (!coverImageLocalPath) {
// //     throw new APIError(400, "Cover image is required");
// //   }

// //   // Upload to Cloudinary
// //   const avatar = await uploadOnCloudinary(avatarLocalPath);
// //   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

// //   if (!avatar?.url) {
// //     throw new APIError(400, "Avatar upload failed");
// //   }

// //   if (!coverImage?.url) {
// //     throw new APIError(400, "Cover image upload failed");
// //   }

// //   // Create user
// //   const user = await User.create({
// //     fullName,
// //     avatar: avatar.url,
// //     coverImage: coverImage.url,
// //     password,
// //     email,
// //     username
// //   });

// //   const createdUser = await User.findById(user._id).select("-password -refreshToken");

// //   if (!createdUser) {
// //     throw new APIError(500, "Something went wrong while registering the user");
// //   }

// //   return res.status(201).json(
// //     new APIResponse(201, createdUser, "User created successfully")
// //   );
// // });

// // export { registerUser };
// ]



