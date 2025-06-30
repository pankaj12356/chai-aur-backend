// import { APIError } from "../utils/AError.js"
// import { asyncHandler } from "../utils/asyncHandler.js"
// // import jwt from "jsonwebtoken"
// import jwt from "jsonwebtoken";
// const { verify } = jwt;

// import {User} from "../models/user.model.js" 
// export const  verifyJWT = asyncHandler(async(req,res,_,
//     next) => {
//    try {
//     const token = req.cookies?.accessToken  || req.header
//     ("Authorization")?.replace("Bearer","")
//     if(!token){
//      throw new APIError(401,"Unauthorized hogya bahi")
//     }
    
// const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);    
// // const decodedToken = jwt.verify(token, "chai-aur-code");
// const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     
//     if(!user){
//      throw new APIError(401,"Invalid Access Token")
//  }
//  console.log("🔑 ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
//  console.log("🔑 ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
//  console.log("🍪 Cookies:", req.cookies);
// console.log("🔐 Authorization Header:", req.headers.authorization);
// console.log("🧾 Token used for verification:", token);
//  req.user = user;
//  next()
 
 
//    } catch (error) {
//     throw new APIError(401,"Incvalid access token")
//    }

// })

import { APIError } from "../utils/AError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "").trim();

    // console.log("🍪 Cookies:", req.cookies);
    // console.log("🔐 Authorization Header:", req.headers.authorization);
    // console.log("🧾 Token used for verification:", token);
    // console.log("🔑 ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);

    if (!token) {
      throw new APIError(401, "Access token missing");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("✅ Decoded Token:", decodedToken);
    } catch (err) {
      console.error("❌ JWT Verification Error:", err.message);
      throw new APIError(401, "Token verification failed: " + err.message);
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.error("❌ No user found with ID:", decodedToken._id);
      throw new APIError(401, "User not found for this token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Middleware Error:", error.message);
    throw new APIError(401, "Invalid access token");
  }
});