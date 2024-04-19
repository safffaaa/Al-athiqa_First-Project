const bcrypt = require("bcrypt")
const express = require('express')
const router = express.Router()
const { error } = require("console");
const usercontroller = require("../controller/usercontroller");
const cartcontroller = require("../controller/cartController");
const ordercontroller=require("../controller/orderController");
const walletcontroller=require("../controller/walletController")
const wishlistcontroller=require('../controller/whishlistController')
const {verifyUser} =require("../middleware/user");
const couponController = require("../controller/couponController");
const razorpayController = require("../controller/razorpayController");

router.route("/")
  .get(usercontroller.getLogin)

router.route('/signin')
  .get(usercontroller.login)
  .post(usercontroller.loginPost)


router.route('/logout')
  .get(verifyUser,usercontroller.logout)


router.route('/signup')
  .get(usercontroller.getSignup)
  .post(usercontroller.postSignup)

router.route('/forgot')
  .get(verifyUser,usercontroller.getForgotPwd)
  .post(usercontroller.postForgotPwd)

router.route('/otpverify')
  .get(usercontroller.getOTPverify)
  .post(usercontroller.postOTPverify)

router.route('/userPasswordChange')
  .get(verifyUser,usercontroller.getPwdchange)
  .post(usercontroller.postPwdchange)

router.route('/all-Product')
  .get(verifyUser,usercontroller.allProducts)
  .post(usercontroller.postFilter)


router.route('/product/:id')
  .get(verifyUser,usercontroller.showProduct)


router.route('/search')
  .get(verifyUser,usercontroller.searchProducts)

router.route('/ProductDetail/:id')
  .get(verifyUser,usercontroller.productDetails)



router.route('/userprofile')
  .get(verifyUser,usercontroller.Profile)



router.route('/address')
  .get(verifyUser,usercontroller.getAddress)



router.route('/addAddress')
  .get(verifyUser,usercontroller.getAddaddress)
  .post(usercontroller.postAddaddress)


router.route('/editAddress/:id')
  .get(verifyUser,usercontroller.geteditAddress)
  .post(usercontroller.posteditAddress)

router.route('/deleteAddress/:id')
  .get(verifyUser,usercontroller.deleteAddress)


router.route('/addressAddCheckout')
  .post(usercontroller.addressAddCheckout)

router.route('/addTocart/:id')
  .get(verifyUser,cartcontroller.addtoCart)


router.route('/getCart')
  .get(verifyUser,cartcontroller.getCart)

  
router.route('/removeCartitems/:id')
  .get(verifyUser,cartcontroller.removeCart)


router.route('/updateQuantity')
    .post(cartcontroller. quantityUpdation)

router.route('/checkoutpage')
    .get(verifyUser,cartcontroller.checkOut)
    .post(cartcontroller.checkOutPost)


router.route('/orderSuccess')
  .get(verifyUser,cartcontroller.orderSuccess)


router.route('/userOrder')
  .get(verifyUser,usercontroller.userOrder)

router.route('/userorderdetails/:id')
  .get(verifyUser,usercontroller.orderDetail)

router.route('/cancelOrder/:id')
  .get(verifyUser,ordercontroller.cancelorder)


//each item cancel//
router.route('/cancelItem/:orderId/:itemId')
  .get(verifyUser, ordercontroller.cancelItem);


router.route('/returnOrder/:id')
  .get(verifyUser,ordercontroller.getReturnorder)
  .post(ordercontroller.postReturnorder)


router.route('/walletPage')
  .get(verifyUser,walletcontroller.getWallet)


router.route('/wishlist')
   .get(verifyUser,wishlistcontroller.getWishlist)

router.route('/wishList/:id')
   .get(verifyUser,wishlistcontroller.addWishlist)

router.route('/deletewish/:id')
  .post(verifyUser,wishlistcontroller.removeWish)


// coupon //

router.route('/userCoupon')
  .get(verifyUser,couponController.usergetCoupon)

router.route('/applyCoupon')
  .post(cartcontroller.applyCoupon)

  
//RazorPay//

router.route('/create_payment')
  .get(razorpayController.createPayment)


router.route('/create_order')
  .post(razorpayController.createOrder)


router.route('/verify_Payment')
  .post(razorpayController.verifyPayment)

  
router.route('/payment_failed')
  .post(razorpayController.payment_failed)

  
router.route('/repay')
  .post(razorpayController.repay)

  
router.route('/repay_success')
  .post(razorpayController.repay_success)
  

router.route('/downloadInvoice/:id')
  .get(verifyUser,ordercontroller.downloadInvoice)


  //return//

router.route('/returnItems/:orderId/:productId')
  .get(verifyUser,ordercontroller.returnSingleProduct)
  .post(ordercontroller.postReturnItem)


module.exports = router