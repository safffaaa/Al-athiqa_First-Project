const mongoose=require('mongoose')


const users=new mongoose.Schema({
    name:{
     type:String,
     unique: true,
     required:true
    },
    email:{
     type:String,
     unique: true,
     required:true
    },
    password:{
     type:String,
     required:true
    },
    status: {
     type: String,
    default:"Active"
    },
    
    address: [{
        name: {
            type: String, uppercase: true
        },
        addressLane: {
            type: String, uppercase: true
        },
        city: {
            type: String, uppercase: true
        },
        pincode: {
            type: Number
        },
        state: {
            type: String, uppercase: true
        },
        mobile: {
            type: Number
        },
        altMobile: {
            type: Number
        }
    }],
 })
 

 const collection= new mongoose.model('users',users);
 module.exports=collection
 