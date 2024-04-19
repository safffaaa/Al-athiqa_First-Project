const mongoose=require("mongoose")

const catSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        uppercase:true
    },
    images: {
        type: Array,
        required: true,
    },
    status:{
        type:String,
        default:"Active"
    }
})


const category=mongoose.model("category",catSchema)
module.exports=category