import mongoose from "mongoose";  

import {DB_NAME} from "../constant.js";

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`DB connected successfully at ${connectionInstance.connection.host}:${connectionInstance.connection.port}`);
    }catch(error){
        console.log("Error occure from DB connection",error)
        process.exit(1)
    }
}

export default connectDB;