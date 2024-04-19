const productdb = require('../models/productSchema');
const orderdb = require('../models/orderSchema');
const wallet = require('../models/walletSchema');
const categorydb = require('../models/categorySchema');
const userdb = require('../models/user');
const offerdb = require('../models/offerSchema');
const coupondb = require('../models/coupenSchema');
const flash = require('express-flash');

module.exports = {
    getOffer: async (req, res) => {
        try {
            const sendoffer = await offerdb.find({}).sort({ categoryName: 1 });
            const totalCount = await offerdb.countDocuments();
            res.render("./admin/categoryoffer", {
                sendoffer,
                totalCount,
            });
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    getaddOffer: async (req, res) => {
        try {
            const selectCategory = await categorydb.find({});
            res.render('./admin/addCategoryoffer', { selectCategory });
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    postaddOffeer: async (req, res) => {
        try {
            const name = req.body.name;
            const newoffers = await offerdb.findOne({ categoryName: name });
            if (newoffers) {
                req.flash('error', "Offer already exists in category..");
                res.redirect('/addOffer');
            } else {
                const categoryoffer = new offerdb({
                    categoryName: req.body.name,
                    discount: req.body.discount,
                    valid_from: req.body.valid_from,
                    valid_to: req.body.valid_to,
                    status: "Active"
                });
                await categoryoffer.save();
                const newcategory = await categorydb.findOne({ name: name });
                const categoryId = newcategory._id;
                const updateproduct = await productdb.find({ category: categoryId });
                const newdiscount = (req.body.discount) / 100;
                for (x of updateproduct) {
                    const dbofferprice = x.offerprice;
                    x.offerprice = (x.price - x.discount) - (x.price - x.discount) * newdiscount;
                    const updateofferprice = await productdb.findByIdAndUpdate(
                        x._id,
                        { $set: { offerprice: x.offerprice, offerdiscount: req.body.discount } },
                        { new: true }
                    );
                }
                res.redirect("/categoryoffer");
            }
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    blockOffer: async (req, res) => {
        try {
            const { id } = req.params;
            const updateoffer = await offerdb.findOneAndUpdate({ _id: id });
            if (updateoffer.status === 'Active') {
                const newoffer = await offerdb.findByIdAndUpdate({ _id: id }, { status: "Block" });
                const category = await categorydb.findOne({ name: newoffer.categoryName });
                const newproducts = await productdb.find({ category: category._id }).populate('category');

                for (const product of newproducts) {
                    let offerprice = 0;
                    let offerdiscount = newoffer.discount;
                    const dis = newoffer.discount / 100;
                    offerprice = (product.price - product.discount) - ((product.price - product.discount) * dis);

                    if (!isNaN(offerprice)) {
                        await productdb.findByIdAndUpdate(product._id, { $set: { offerprice: offerprice, offerdiscount: offerdiscount } });
                    }
                }
                res.redirect("/categoryoffer");

            } else if (updateoffer.status === 'Block') {
                const newoffer = await offerdb.findByIdAndUpdate({ _id: id }, { status: "Active" });
                const category = await categorydb.findOne({ name: newoffer.categoryName });
                const newproducts = await productdb.find({ category: category._id }).populate('category');
                for (const product of newproducts) {

                }
                res.redirect("/categoryoffer");
            }
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    deleteOffer: async (req, res) => {
        try {
            const { id } = req.params;
            const offers = await offerdb.findOne({ _id: id });
            const category = offers.categoryName;
            const newcategory = await categorydb.findOne({ name: category });
            const catId = newcategory._id;
            const editproduct = await productdb.find({ category: catId });
            for (x of editproduct) {
                const updateprice = await productdb.findByIdAndUpdate(
                    x._id,
                    { $set: { offerprice: 0, offerdiscount: 0 } },
                    { new: true }
                );
            }
            const deleteoffer = await offerdb.findByIdAndDelete({ _id: id });
            res.redirect("/categoryoffer");
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    }
};
