const { log } = require('console')
const orders = require('../models/orderSchema')
const user = require('../models/user')
const flsh = require("express-session")
const category = require('../models/categorySchema')


Credential = {
    email: "admin123@gmail.com",
    password: "123",
}

module.exports = {
    admin: (req, res) => {
        try {
            res.render("./login/adminLogin")
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    adminLogin: (req, res) => {
        if (!req.body) {
            return res.status(400).send('Bad Request: Request body is missing or invalid.');
        }

        const { email, password } = req.body;
        if (Credential.email == email && Credential.password == password) {
            req.session.adminlogin = true
            res.redirect('/dashboard')
        }
        else {
            req.session.adminlogin = false
            req.flash("error", "incorrect username or password!!....")
            res.redirect('/admin')
        }
    },


    adminLogout: (req, res) => {
        try {
            req.session.adminlogin = false
            res.redirect('/admin')
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },


    dashboard: async (req, res) => {
        try {
            const topSellOrder = await orders.aggregate([
                {
                    $match: {
                        status: 'Delivered',
                        paymentStatus: 'Paid'
                    }
                },
                {
                    $unwind: '$items'
                },
                {
                    $group: {
                        _id: '$items.productId',
                        totalSold: { $sum: '$items.quantity' }
                    }
                },
                {
                    $sort: {
                        totalSold: -1
                    }
                },
                {
                    $limit: 5
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        _id: '$product._id',
                        name: '$product.name',
                        category: '$product.category',
                        price: '$product.price',
                        image: { $arrayElemAt: ['$product.images', 0] },
                        totalSold: 1
                    }
                }
            ]);
            const cat = await orders.aggregate([
                {
                    $match: {
                        status: 'Delivered',
                        paymentStatus: 'Paid'
                    }
                },
                {
                    $unwind: '$items'
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: '$product.category',
                        totalQuantitySold: { $sum: '$items.quantity' }
                    }
                },
                {
                    $sort: {
                        totalQuantitySold: -1
                    }
                },
                {
                    $limit: 1
                }
            ])
            const topSellCategory = await category.find({_id: cat})
            console.log(topSellCategory);
            res.render('./admin/dashboard', { topSellOrder, topSellCategory })
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    getCustomers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = 8;
            const skip = (page - 1) * perPage;
            const users = await user.find().skip(skip).limit(perPage);
            const totalCount = await user.countDocuments();
            res.render('admin/customers', {
                users,
                currentPage: page,
                perPage,
                totalCount,
                totalPages: Math.ceil(totalCount / perPage),
            });
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },




    blockUser: async (req, res) => {
        try {
            const { id } = req.params;
            const userData = await user.findOne({ _id: id });
            if (userData.status === "Active") {
                await user.findByIdAndUpdate(id, { status: "Blocked" }, { new: true });
            } else if (userData.status === "Blocked") {
                await user.findByIdAndUpdate(id, { status: "Active" }, { new: true });
            }

            res.redirect("/customers");
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

}