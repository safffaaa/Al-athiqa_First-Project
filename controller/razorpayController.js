const users = require('../models/user')
const cart = require('../models/cartSchema')
const order = require('../models/orderSchema')
const crypto = require("crypto")
const product = require('../models/productSchema')


const Razorpay = require('razorpay');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

module.exports = {

    createPayment: async (req, res) => {
        const email = req.session.userEmail;
        const user = await users.findOne({ email: email });
        let total = req.session.grantTotal || 0;

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let discountPrice = 0;
        const appliedCoupon = req.session.appliedCoupon;
        if (appliedCoupon) {
            discountPrice = (appliedCoupon.discount / 100) * total;
            total -= discountPrice;
        }

        try {
            const order = await razorpay.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: 'order_rcptid_11',
                payment_capture: 1
            });
            res.json({ order, user, order_id: order.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createOrder: async (req, res) => {
        try {

            const { addressID } = req.body
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            const dbAddress = user.address;
            const shipAddress = dbAddress.find((item) => item._id.equals(addressID));
            const userCart = await cart.findOne({ userId: user });
            let total = req.session.grantTotal || 0;
            const quantity = req.session.totalQuantity;
            let DeliveryCharge;

            if(total < 4000 ){
                DeliveryCharge = 40;
            }

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (!userCart) {
                return res.status(404).json({ message: "Cart not found" });
            }
            if (!shipAddress) {
                return res.status(400).json({ message: "Incomplete address or payment method" });
            }

            let discountPrice = 0;
            const appliedCoupon = req.session.appliedCoupon;
            if (appliedCoupon) {
                discountPrice = (appliedCoupon.discount / 100) * total;
                total -= discountPrice;
            }

            const add = {
                name: shipAddress.name,
                addressLane: shipAddress.addressLane,
                pincode: shipAddress.pincode,
                city: shipAddress.city,
                state: shipAddress.state,
                mobile: shipAddress.mobile,
                altMobile: shipAddress.altMobile
            };
            const newOrder = new order({
                userId: user,
                items: userCart.items,
                paymentMethod: "Razor Pay",
                orderDate: new Date(),
                deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                totalAmount: total,
                totalQuantity: quantity,
                paymentStatus: 'Paid',
                address: add,
                DeliveryCharge:DeliveryCharge
            });
            await newOrder.save();

            for (const item of userCart.items) {
                const cartProduct = item.productId
                const cartQuantity = item.quantity

                const productDec = await product.findById(cartProduct);
                
                if (!productDec) {
                    console.log(`Product with ID ${cartProduct} not found`);
                    continue;
                }
                productDec.stock -= cartQuantity;
                await productDec.save();
            }
            await cart.findByIdAndDelete({ _id: userCart._id });
            req.session.discountPrice = 0
            req.session.appliedCoupon = null;

            res.json({ success: true })
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


    verifyPayment: async (req, res) => {
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(
            req.body.payment.razorpay_order_id +
            "|" +
            req.body.payment.razorpay_payment_id
        );
        hmac = hmac.digest("hex");
        console.log(hmac, "--------------->", req.body.payment.razorpay_signature);
        if (hmac === req.body.payment.razorpay_signature) {      
            res.json({ success: true });
        } else {
            res.json({ failure: true });
        }
    },

    payment_failed: async (req, res) => {
        try {

            const { addressID } = req.body
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            const dbAddress = user.address;
            const shipAddress = dbAddress.find((item) => item._id.equals(addressID));
            const userCart = await cart.findOne({ userId: user });
            let total = req.session.grantTotal || 0;
            const quantity = req.session.totalQuantity;
            let DeliveryCharge;

            if(total < 4000 ){
                DeliveryCharge = 40;
            }

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (!userCart) {
                return res.status(404).json({ message: "Cart not found" });
            }
            if (!shipAddress) {
                return res.status(400).json({ message: "Incomplete address or payment method" });
            }

            let discountPrice = 0;
            const appliedCoupon = req.session.appliedCoupon;
            if (appliedCoupon) {
                discountPrice = (appliedCoupon.discount / 100) * total;
                total -= discountPrice;
            }

            const add = {
                name: shipAddress.name,
                addressLane: shipAddress.addressLane,
                pincode: shipAddress.pincode,
                city: shipAddress.city,
                state: shipAddress.state,
                mobile: shipAddress.mobile,
                altMobile: shipAddress.altMobile
            };
            const newOrder = new order({
                userId: user,
                items: userCart.items,
                paymentMethod: "Razor Pay",
                orderDate: new Date(),
                deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                totalAmount: total,
                totalQuantity: quantity,
                paymentStatus: 'Payment Failed',
                address: add,
                DeliveryCharge:DeliveryCharge
            });
            await newOrder.save();

            for (const item of userCart.items) {
                const cartProduct = item.productId
                const cartQuantity = item.quantity

                const productDec = await product.findById(cartProduct);
                
                if (!productDec) {
                    console.log(`Product with ID ${cartProduct} not found`);
                    continue;
                }
                productDec.stock -= cartQuantity;
                await productDec.save();
            }
            await cart.findByIdAndDelete({ _id: userCart._id });
            req.session.discountPrice = 0
            req.session.appliedCoupon = null;

            res.json({ success: true })
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    
    repay: async (req, res) => {
        const email = req.session.userEmail;
        const user = await users.findOne({ email: email });

        const { orderId } = req.body
        const orderInfo = await order.findById(orderId)
        console.log(orderId, "------>", orderInfo);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        let total = orderInfo.totalAmount
        if (total < 4000){
            total += 40
        }
        console.log(total);
    
        try {
            const order = await razorpay.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: 'order_rcptid_11',
                payment_capture: 1
            });
            console.log(order);
            res.json({ order, user, order_id: order.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    repay_success: async (req, res) => {
        const { orderId } = req.body
        const orderInfo = await order.findById(orderId)
        orderInfo.paymentStatus = 'Paid'
        await orderInfo.save()
        res.json({success: true})
    },

}
