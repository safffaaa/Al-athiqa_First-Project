const express = require('express')
const router = express.Router();
const user = require("../models/user")
const admincontroller = require('../controller/admincontroller')
const categorycontroller = require('../controller/category')
const mongoose = require("mongoose");
const session = require('express-session');
const uploadMulter = require("../middleware/multer");
const {verifyAdmin} =require("../middleware/admin")
const productsController = require('../controller/productsController');
const ordercontroller = require('../controller/orderController')
const couponcontroller=require('../controller/couponController');
const couponController = require('../controller/couponController');
const dashboardController = require('../controller/dashboardController')
const offercontroller = require('../controller/offerController')
const { generateSalesPDF } =require('../utility/downloadSalesReport')

// ---------------Admin------------------------//

router.route("/admin")
    .get(admincontroller.admin)
    .post(admincontroller.adminLogin)

router.route('/dashboard')
    .get(verifyAdmin,admincontroller.dashboard)

router.route('/adminLogout')
    .get(verifyAdmin,admincontroller.adminLogout)

//---------------catergory-------------------//

router.route('/category')
    .get(verifyAdmin,categorycontroller.category)

router.route('/addCategory')
    .get(verifyAdmin,categorycontroller.addcategory_get)
    .post(uploadMulter.single('catimg'), categorycontroller.addcategory_post)


//---------------catergory Edit and Remove-------------------//

router.route('/editcategory/:id')
    .get(verifyAdmin,categorycontroller.editCategory)
    .post(uploadMulter.single('catimg'), categorycontroller.posteditCategory)


router.route('/removeCategory/:id')
    .delete(verifyAdmin,categorycontroller.removeCategory)

//---------------------------List User---------------------------------//

router.route('/customers')
    .get(verifyAdmin,admincontroller.getCustomers)




//---------------------------block User----------------------//

router.route('/blockUnblock/:id')
    .post(admincontroller.blockUser);



//---------------------------Products---------------------------//

router.route('/product')
    .get(verifyAdmin,productsController.products)

router.route('/product-detail/:id')
    .get(verifyAdmin,productsController.productdetail)

router.route('/productEdit/:id')
    .get(verifyAdmin,productsController.editProduct)
    .post(uploadMulter.fields([{ name: 'images1', maxCount: 1 }, { name: 'images2', maxCount: 1 }]), productsController.editProductPost)

router.route('/product-delete/:id')
    .delete(verifyAdmin,productsController.removeProduct)


//--------------------------Add Products--------------------------//

router.route('/addproduct')
    .get(verifyAdmin,productsController.addproducts)
    .post(uploadMulter.any(), productsController.addproductPost)



//---------------------------Edit Products-----------------------//


//--------------------------ORDERLIST--------------------------------------


router.route('/orderlist')
    .get(verifyAdmin,ordercontroller.getOrder)


router.route('/returnOrders')
    .get(verifyAdmin,ordercontroller.returnOrders)


router.route('/returnOrderView/:orderId')
    .get(verifyAdmin,ordercontroller.returnOrderView)


router.route('/adminorderDetails/:id')
    .get(verifyAdmin,ordercontroller.oderDetailview)


router.route('/updateOrder')
    .post(verifyAdmin,ordercontroller.updateOrders)


//----------------coupon-----------------------//


router.route('/adminCoupon')
    .get(verifyAdmin,couponcontroller.getadminCoupon)

router.route("/addCoupon")
    .get(verifyAdmin,couponcontroller.getAddCoupon)
    .post(couponcontroller.postAddCoupon)

router.route('/blockcoupon/:id')
    .get(verifyAdmin,couponcontroller.blockCoupon)

router.route('/deletecoupon/:id')
    .get(verifyAdmin,couponController.deleteCopon)

router.route("/editcoupon/:id")
    .get(verifyAdmin,couponcontroller.geteditCopon)
    .post(verifyAdmin,couponController.postEditCoupon)


//------------------Sales--------------------//



router.route("/countByday")
    .get(verifyAdmin,dashboardController.getSalesCount)

//
router.route("/countBymonth")
    .get(verifyAdmin,dashboardController.getSalesCount)

//
router.route("/countByyear")
    .get(verifyAdmin,dashboardController.getSalesCount)



//-------------offer---------------------//

router.route('/categoryOffer')
    .get(verifyAdmin,offercontroller.getOffer)

router.route('/addOffer')
    .get(verifyAdmin,offercontroller.getaddOffer)
    .post(verifyAdmin,offercontroller.postaddOffeer)

router.route('/blockoffer/:id')
    .get(verifyAdmin,offercontroller.blockOffer)

router.route('/deleteoffer/:id')
    .get(verifyAdmin,offercontroller.deleteOffer)


// salesReport//
router.route("/salesReportDownload")
    .post(dashboardController.salesReportdownload)


module.exports = router