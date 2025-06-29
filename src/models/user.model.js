import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
   username:{
    type:String,
    required:true,
    lowercase:true,
    unique:true,
    trim:true,
    index:true
   },
   email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    
   },fullname:{
    type:String,
    required:true,
    trim:true,
    index:true
   },
   avatar:{
    type:String,
    required:true,
   },
   copyImage:{
    type:String,
    required:true,
   },
   avatar:{
    type:String,
    required:true,
   },
   watchHistory:[
     {
        type:mongoose.Schema.Types.ObjectId,

        ref:"Video"
     }
   ],
   password:{
    type:String,
    required:[true,"Password is required"],
   },
   refreshToken:{
    type:String,
    
   }


});


userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.paassword,10)
    next(); 
})

userSchema.method.isPasswordCorrect = async function (password){
    bcrypt.compare(password,this.paassword)
    
}
userSchema.method.generatAccessToken = function(){
jwt.sign({
  _id:this._id,
  email:this.email,
  username:this.username,
  fullname:this.fullname
},
process.env.ACCESS_TOKEN_SECRET,
{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
)

}
userSchema.method.generatRefreshToken = function(){
  jwt.sign({
  _id:this._id,

},
process.env.REFRESH_TOKEN_SECRET,
{ expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
)
}

export const User = mongoose.model("User", userSchema);