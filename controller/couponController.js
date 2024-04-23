const Coupon = require('../models/coupenSchema')
const coupon = require ('../models/coupenSchema')
const users =require('../models/user')
const flash =require('express-flash')

module.exports={

    getadminCoupon: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; 
            const perPage = 5;
            const skip = (page - 1) * perPage;
            const totalCount = await Coupon.countDocuments();
            const totalPages = Math.ceil(totalCount / perPage);
            const newCoupons = await Coupon.find({}).sort({ discount: 1 }).skip(skip).limit(perPage);
            console.log("newww");
            res.render("./admin/adminCoupon", {
                newCoupons ,
                currentPage: page,
                perPage,
                totalCount,
                totalPages,
            });
          
        
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    getAddCoupon:async (req,res)=>{
        try {
            res.render("./admin/addCoupon")
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    postAddCoupon: async (req, res) => {
        try {
            const { code, discount, valid_from, valid_to } = req.body;
    
     
            const maxDiscount = 50; 
    
            if (!code || !discount || !valid_from || !valid_to) {
                req.flash("error", "All fields are required.");
                return res.redirect("/addCoupon");
            }
    
            if (discount > maxDiscount) {
                req.flash("error", "Discount cannot exceed the maximum allowed.");
                return res.redirect("/addCoupon");
            }
    
            const parsedValidFrom = new Date(valid_from);
            const parsedValidTo = new Date(valid_to);
    
            if (isNaN(parsedValidFrom.getTime()) || isNaN(parsedValidTo.getTime())) {
                req.flash("error", "Invalid date format.");
                return res.redirect("/addCoupon");
            }
    
            const testCoupon = await coupon.findOne({ code });
            if (testCoupon) {
                req.flash("error", "Coupon Already Exists.");
                return res.redirect("/addCoupon");
            }
    
            const newCoupon = new coupon({
                code,
                discount,
                valid_from: parsedValidFrom,
                valid_to: parsedValidTo,
                status: "Active"
            });
    
            await newCoupon.save();
            req.flash("success", "Coupon added successfully.");
            res.redirect("/adminCoupon");
        } catch (error) {
            console.error(error);
            req.flash("error", "Failed to add coupon. Please try again.");
            res.redirect("/addCoupon");
        }
    },
    
    usergetCoupon:async (req,res)=>{
        try {
            const newCoupons = await coupon.find({}).sort({  discount: 1 })
            res.render("./user/coupon", { newCoupons });
        
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    blockCoupon:async (req,res)=>{
        try {
            const { id }=req.params
            const couponEdit = await Coupon.findOne({ _id:id })
            if (couponEdit.status === "Active") {
                const newCoupon = await coupon.findByIdAndUpdate({ _id: id }, { status: "Block" })
            } else if (couponEdit.status === "Block") {
                const newCoupon = await coupon.findByIdAndUpdate({ _id: id }, { status: "Active" })
            }
            res.redirect("/adminCoupon")

        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    deleteCopon: async (req,res)=>{
        try {
            const { id } = req.params;
            const couponDelete = await Coupon.findOne({ _id: id });
    
            if (!couponDelete) {
                req.flash("error", "Coupon not found.");
                return res.redirect("/adminCoupon");
            }

            const isUsed = await users.exists({ coupon: id });
            if (isUsed) {
                req.flash("error", "This coupon is already in use and cannot be deleted.");
                return res.redirect("/adminCoupon");
            }
            await Coupon.findByIdAndDelete(id);
            req.flash("success", "Coupon deleted successfully.");
            res.redirect("/adminCoupon");
        } catch (error) {
            console.log(error);
            req.flash("error", "Failed to delete coupon.");
            res.redirect("/adminCoupon");
        }
    },


    geteditCopon : async (req,res)=>{
        try {
            const {id} =req.params
            const couponDelete = await Coupon.findOne({ _id:id })
            res.render('./admin/editCoupon',{couponDelete})

        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

   postEditCoupon: async (req, res) => {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);

            if (!coupon) {
                req.flash("error", "Coupon not found.");
                return res.redirect("/adminCoupon");
            }
            await Coupon.findByIdAndUpdate(id, req.body);

            req.flash("success", "Coupon updated successfully.");
            res.redirect('/adminCoupon');
        } catch (error) {
            console.log(error);
            req.flash("error", "Failed to update coupon.");
            res.redirect("/adminCoupon");
        }
    },


}