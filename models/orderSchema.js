const mongoose=require('mongoose');
const { type } = require('os');


const { Schema } = mongoose;


const shippedAddressSchema = new Schema({
    name: { 
        type: String, 
        required: true },
    addressLane: { 
        type: String, 
        required: true },
    pincode: {
         type: Number,
          required: true },
    city: { 
        type: String, 
        required: true },
    state: { type: String,
         required: true },
    mobile: { 
        type: Number,
        required: true },
    altMobile: { 
        type: Number, 
        required: true },
});

const ordersSchema = new Schema({
    userId: { type: Schema.Types.ObjectId,
         ref: 'users' },//change 'User'//
    status: { type: String, 
        default: "Order Placed" },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: "products" },
        quantity: { type: Number },
        status: { type: String, default: "Order Placed" },
        reason: {type: String},
        returnDate: {type: Date},
        returnStatus: {type: String},
        paymentStatus: {type: String}
    }],
    paymentMethod: { type: String },
    orderDate: { type: Date },
    deliveryDate:{type:Date},
    totalAmount: { type: Number },
    totalQuantity:{type:Number},
    paymentStatus: { type: String,
    default: "Pending" },
    address: { type: shippedAddressSchema },
    userReason:{type:String,
    default:"Not Applicable"},
    returnDate:{type:Date,
    default:null},
    adminReason:{type:String,
    default:"Not Applicable"},
    approvedDate:{type:Date,
    default:null},
    rejectedDate:{type:Date,
    default:null},
    returnStatus:{type:String,
    default:"None"},
    DeliveryCharge:{type:Number , 
        default:0 }
});

ordersSchema.virtual('customOrderId').get(function () {
    return "ORD-" + this._id.toString().substring(0, 6); 
    
});

ordersSchema.virtual('customUserId').get(function () {
    if (this.userId) {
        return "USR-" + this.userId.toString().substring(0, 6);
    }
    return "";
});

const orders = mongoose.model('orders', ordersSchema);

module.exports = orders; 
