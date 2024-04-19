const mongoose = require('mongoose');
const {Schema,ObjectId} = mongoose 
const productSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: true,
    uppercase:true
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },  
  discount: {
    type: Number,
  }, 
  offerprice:{
    type:Number,
    default:0
  },
  offerdiscount:{
    type:Number,
    default:0
  },
  tags: {
      type: Array,
  },
  images: {
    type: Array,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'category'
  },
    status: {
    type: Boolean,
  },
 
  UpdatedOn: {
    type: String
  },
  display: {
    type: String,
  },
 
  Specification1: {
    type: String
  },
  deletedAt: { 
    type: Date
  }, 
});

const product = mongoose.model("products", productSchema);

module.exports = product;