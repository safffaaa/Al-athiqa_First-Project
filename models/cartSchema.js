const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;
const product=require("../models/productSchema")

const cartSchema = new Schema({
  userId:
   { type: Schema.Types.ObjectId,
    ref:"users" },
  items: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: "products",
      },
      quantity: {
        type: Number,
      },
    },
  ],
  totalAmount: {
    type: Number,
  }
});

const cart = mongoose.model("cart", cartSchema);
module.exports = cart;
