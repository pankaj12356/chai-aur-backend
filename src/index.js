//require('dotenv').config(path:'./env);
import dotenv from "dotenv"
import connectDB from "./db/index.js";
// import mongoose from 'mongoose';
// import {DB_NAME} from "./constant`";
// import express from "express";


dotenv.config({
    path:'./env'
})

connectDB ()
.then(()=>{
     app.listen(process.env.PORT || 3000,()=>{
        console.log(`App is listening on port ${process.env.PORT || 3000}`);
     })
})
.catch((error)=>{
    console.log("Error occurred from DB connection",error)
})





















/*
const app = express();
;( async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",()=>{
        console.log("Error from app connection")
        throw error
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listening port ${process.env.PORT}`)

       })
    }
    catch(error){
         console.log("Error occure from DB connection",error)
    }
})()*/