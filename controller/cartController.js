const cart = require('../models/cartSchema')
const product = require('../models/productSchema')
const categories = require('../models/categorySchema')
const order = require('../models/orderSchema')
const wallet = require('../models/walletSchema')
const users = require('../models/user')
const flash = require("express-session")
const { findOne } = require('../models/otpSchema')
const { error } = require('console')
const Coupon = require('../models/coupenSchema')


module.exports = {

    addtoCart: async (req, res) => {
        const email = req.session.userEmail
        const user = await users.findOne({ email: email })
        let oldCart = await cart.findOne({ userId: user })

        if (user) {

            const productId = req.params.id
            const productInfo = await product.findById({_id: productId})
            if(productInfo && productInfo.stock > 0){
                const cartItem = {
                    productId: productId,
                    quantity: 1
                }
                if (!oldCart) {
                    oldCart = new cart({
                        userId: user,
                        items: [cartItem],
                        totalAmount: 0
                    })
                }
                else {
                    const existingItemIndex = oldCart.items.findIndex(item => item.productId.equals(productId));
                    if (existingItemIndex !== -1) {
                        req.flash("error",'Already in Cart');
                        return res.redirect(`/ProductDetail/${productId}`)
                    } else {
                        oldCart.items.push(cartItem);
                        console.log('new item pushed');
                    }
                }
    
                await oldCart.save()
                res.redirect('/getCart')
            }
            else{
                req.flash('error','Out of Stock')
                res.redirect(`/ProductDetail/${productId}`)
            }
        }
        else {
            console.log('user not fount');
            return res.redirect('/')
        }
    },


    getCart: async (req, res) => {
        try {
            if (req.session.login) {
                const email = req.session.userEmail;
                const user = await users.findOne({ email: email });
                const newcarts = await cart.findOne({ userId: user }).populate('items.productId');
                let totalAmount = 0;
                let totalQuantity = 0;

                if (newcarts) {
                    newcarts.items.forEach((x) => {
                        if (x.productId) {
                            totalAmount += x.quantity * x.productId.price;
                            totalQuantity += x.quantity;
                        }
                    });
                }
                req.session.grantTotal = totalAmount
                req.session.totalQuantity = totalQuantity
                // console.log(newcarts);
                return res.render('./user/userCart', { carts: newcarts, totalAmount, totalQuantity });
            } else {

                return res.redirect('/signin');
            }
        } catch (error) {
            console.log(error);
        }
    },





    removeCart: async (req, res) => {
        try {
            const productId = req.params.id;
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            if (!user) {
                console.log('User not found');
                return res.redirect('/');
            }

            const userCart = await cart.findOne({ userId: user._id });
            if (!userCart) {
                console.log('Cart not found');
                return res.redirect('/getCart');
            }

            const updatedCart = await cart.findOneAndUpdate(
                { userId: user._id },
                { $pull: { items: { productId: productId } } },
                { new: true }
            );

            res.redirect('/getCart');
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },


    quantityUpdation: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const userCart = await cart.findOne({ userId: user._id });
            if (!userCart) {
                return res.status(404).json({ message: "Cart not found" });
            }
            const updatedItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
            if (updatedItemIndex === -1) {
                return res.status(404).json({ message: "Item not found in cart" });
            }
            if (quantity <= 0) {
                return res.json({success: false})
            }
            const productInfo = await product.findOne({ _id: productId });
            console.log(productInfo)
            if (quantity > productInfo.stock) {
                return res.json({success: false})
            }

            userCart.items[updatedItemIndex].quantity = quantity;
            await userCart.save();

            const responseData = {
            success: true,
            message: "Quantity updated successfully",
            updatedCart: userCart
            
           };

        res.json(responseData);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },


    checkOut: async (req, res) => {
        try {
            const email = req.session.userEmail;
            const newuser = await users.findOne({ email: email });
            const newCoupons = await Coupon.find({});
            const addaddress = newuser.address;
            const grandTotal = req.session.grantTotal;
            const quantity = req.session.totalQuantity;
            const discount = req.session.discountPrice || 0;
            const appliedCoupon = req.session.appliedCoupon;
            const total = grandTotal - discount

            res.render('./user/checkout', { addaddress, grandTotal, quantity, newCoupons, discount, appliedCoupon, total });
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },


    checkOutPost: async (req, res) => {
        try {
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            const address = req.body.address;
            const payment = req.body.payment;
            const dbAddress = user.address;
            const shipAddress = dbAddress.find((item) => item._id.equals(address));
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
            if (!shipAddress || !payment) {
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

            if (total > 2000 && payment === "COD") {
                req.flash("error", "COD is not available for orders above Rs 1000");
                return res.redirect('/checkoutpage');
            }

            if (payment === "COD") {

                const newOrder = new order({
                    userId: user,
                    items: userCart.items,
                    paymentMethod: "COD",
                    orderDate: new Date(),
                    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    totalAmount: total,
                    totalQuantity: quantity,
                    address: add,
                    DeliveryCharge:DeliveryCharge
                });

                const currentOrder = await newOrder.save();

            }

            else if (payment === "walletPayment") {

                const userWallet = await wallet.find({userId: user})
                let userBalance = 0

                userWallet.forEach(balance => {
                    if(balance.status === 'Credit'){
                        userBalance += balance.totalAmount
                    }
                    else if(balance.status === 'Debit'){
                        userBalance -= balance.totalAmount
                    }
                })

                if (userBalance < total) {
                    req.flash("error", "Insufficient balance...! Use another payment method...!")
                    return res.redirect('/checkoutpage')
                }

                const newOrder = new order({
                    userId: user,
                    items: userCart.items,
                    paymentMethod: "Wallet",
                    orderDate: new Date(),
                    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    totalAmount: total,
                    totalQuantity: quantity,
                    paymentStatus: 'Paid',
                    address: add,
                    DeliveryCharge:DeliveryCharge
                });

                const currentOrder = await newOrder.save();
                const newWallet = new wallet({
                    userId: user,
                    orders: currentOrder,
                    totalAmount: total,
                    status: 'Debit'
                })
                await newWallet.save()
                
            }

            // Decrementing Product Stock after Creating Order...
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

            req.flash('success', 'Checkout successful!');
            res.redirect('/orderSuccess');
        } catch (error) {
            console.error('Error during checkout:', error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },



    orderSuccess: async (req, res) => {
        res.render('./user/ordersuccess')
    },

    applyCoupon: async (req, res) => {
        try {
        const couponId = req.body.coupon;
        const total = req.session.grantTotal;
        if (couponId) {
            const selectedCoupon = await Coupon.findOne({ _id: couponId });
            if (selectedCoupon && selectedCoupon.valid_to > new Date() && selectedCoupon.valid_from < new Date()) {
                req.session.appliedCoupon = selectedCoupon;
                discountPrice = (selectedCoupon.discount / 100) * total;
                req.session.discountPrice = discountPrice;
                req.flash('success', 'Coupon applied successfully');
            } else {
                console.log("Coupon not valid");
                req.flash("error", "Coupon not valid");
            }
        }
        res.redirect('/checkoutpage');
    } catch (error) {
        console.error('Error applying coupon:', error);
        req.flash("error", "Error applying coupon");
        res.redirect('/checkoutpage');
    }
    }
}

