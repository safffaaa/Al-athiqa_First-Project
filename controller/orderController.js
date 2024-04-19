const product = require('../models/productSchema')
const order = require('../models/orderSchema')
const category = require('../models/categorySchema')
const cart = require('../models/cartSchema')
const user = require('../models/user')
const wallet = require('../models/walletSchema')
const { generateInvoicePDF } = require('../utility/downloadInvoice')
const orders = require('../models/orderSchema')
const { render } = require('ejs')


module.exports = {


    getOrder: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = 8;
            const skip = (page - 1) * perPage;
            const totalCount = await order.countDocuments();
            const totalPages = Math.ceil(totalCount / perPage);
            const orderlist = await order.find().populate("address").sort({ orderDate: -1 }).skip(skip).limit(perPage);

            res.render('./admin/orderlist', {
                orderlist,
                currentPage: page,
                perPage,
                totalCount,
                totalPages,
            });
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },



    oderDetailview: async (req, res) => {
        try {
            const { id } = req.params;
            const myOrder = await order.findOne({ _id: id }).populate('address').populate('items.productId');
            res.render('./admin/orderviewlist', { myOrder });
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    cancelorder: async (req, res) => {
        try {
            const { id } = req.params

            const myOrder = await order.findOne({ _id: id })
            if (myOrder.paymentStatus === 'Pending') {
                myOrder.paymentStatus = 'N/A'
                myOrder.status = 'Cancelled'
            }
            else if (myOrder.paymentStatus === 'Paid') {
                myOrder.paymentStatus = 'Returned'
                myOrder.status = 'Cancelled'
                myOrder.returnDate = new Date()
                const userWallet = new wallet({
                    userId: myOrder.userId,
                    orders: myOrder,
                    totalAmount: myOrder.totalAmount
                })
                await userWallet.save()
            }
            await myOrder.save()

            req.flash('error', 'Order cancelled successfully...!')

            res.redirect('/userOrder')
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },


    cancelItem: async (req, res) => {
        try {
            const { orderId, itemId } = req.params;

            const myOrder = await order.findOne({ _id: orderId });
            if (!myOrder) {
                return res.status(404).send("Order not found");
            }
            const itemToCancel = myOrder.items.find(item => item._id.toString() === itemId);
            if (!itemToCancel) {
                return res.status(404).send("Item not found in the order");
            }

            itemToCancel.status = 'Cancelled';

            await myOrder.save();

            req.flash('success', 'Item cancelled successfully.');
            return res.redirect('/userOrder');
        } catch (error) {
            console.error('Error cancelling item:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },



    getReturnorder: async (req, res) => {
        try {
            const { id } = req.params
            const myOrder = await order.findOne({ _id: id }).populate("items.productId").populate("address")
            res.render('./user/userorderreturn', { myOrder });
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    postReturnorder: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const returnedOrder = await order.findById(id);
            if (!returnedOrder) {
                return res.status(404).json({ message: "Order not found" });
            }
            returnedOrder.status = "Return Pending";
            returnedOrder.userReason = reason;
            returnedOrder.returnDate = new Date();
            await returnedOrder.save();

            return res.redirect('/userOrder');
        } catch (error) {
            console.log(error);
        }
    },


    returnSingleProduct: async (req, res) => {
        try {
            res.render("./user/returnReason")
        } catch (error) {
            console.log(error);
        }
    },

    postReturnItem: async (req, res) => {
        try {
            const { orderId, productId } = req.params;
            const { reason } = req.body
            const userMail = req.session.userEmail;
            const userInfo = await user.find({ email: userMail })

            if (!userInfo) {
                req.flash("error", "User not found")
                return res.redirect("/userOrder")
            }
            if (!reason) {
                req.flash("error", "Add the reson for returning product")
                return res.redirect("/userOrder")
            }
            const orderInfo = await order.findById(orderId);
            if (!orderInfo) {
                req.flash("error", "No related order found")
                return res.redirect("/userOrder")
            }
            const item = orderInfo.items.find(item => item.productId.toString() === productId);
            if (!item) {
                req.flash("error", "No related item found")
                return res.redirect("/userOrder")
            }
            item.reason = reason
            item.status = "Return Requested"
            item.returnStatus = "Pending"
            orderInfo.status = "Return Item Pending"
            await orderInfo.save()

            console.log("---------->", orderInfo);
            return res.redirect('/userOrder')
        } catch (error) {
            console.log(error);
        }
    },

    // Admin Order Update.

    returnOrders: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = 8;
            const skip = (page - 1) * perPage;
            const totalCount = await order.countDocuments();
            const totalPages = Math.ceil(totalCount / perPage);
            const orderlist = await orders.find({
                $or: [
                    { status: "Return Pending" },
                    { "items.status": "Return Requested" }
                ]
            }).populate("address").sort({ orderDate: -1 }).skip(skip).limit(perPage);
            const context = {
                orderlist,
                currentPage: page,
                perPage,
                totalCount,
                totalPages,
            }
            return res.render('./admin/returnOrderList', context)

        } catch (error) {
            console.log(error);
        }
    },

    
    returnOrderView: async (req, res) => {
        try {
            const { orderId } = req.params;
            const myOrder = await order.findOne({ _id: orderId }).populate('address').populate('items.productId');
            return res.render('./admin/returnOrderView', { myOrder })
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },



    updateOrders: async (req, res) => {
        try {
            const { id, status } = req.body;
            const orderToUpdate = await order.findById(id);

            if (!orderToUpdate) {
                return res.status(404).json({ message: "Order not found" });
            }

            if (status === 'Shipped') {
                orderToUpdate.status = 'Shipped';

            } else if (status === 'Out for Delivery') {
                orderToUpdate.status = 'Out for Delivery';

            } else if (status === 'Delivered') {
                orderToUpdate.status = 'Delivered';
                orderToUpdate.items.forEach(data => {
                    data.status = 'Delivered'
                })
                orderToUpdate.deliveryDate = new Date()
                orderToUpdate.paymentStatus = 'Paid'
            } 

            if (orderToUpdate.status === 'Return Pending'){
                
                if (status === 'Return Accept') {
                    orderToUpdate.status = 'Return Accept';
                    orderToUpdate.paymentStatus = 'Refund';
                    orderToUpdate.approvedDate = new Date();
                    orderToUpdate.items.forEach(data => {
                        data.status = 'Return Accept'
                    })
    
                } else if (status === 'Return Reject') {
                    orderToUpdate.status = 'Return Reject';
                    orderToUpdate.adminReason = "Not Acceptable";
                    orderToUpdate.rejectedDate = new Date();
                    orderToUpdate.items.forEach(data => {
                        data.status = 'Return Reject'
                    })
                }
            }

            else if (orderToUpdate.status === 'Return Item Pending') {
                orderToUpdate.items.forEach(item => {
                    if (item.status === 'Return Requested' && status === 'Return Accept') {
                        item.status = 'Return Accept';
                        item.paymentStatus = 'Refund';
                        item.returnDate = new Date();
                    }
                    else if (item.status === 'Return Requested' && status === 'Return Reject') {
                        item.status = 'Return Reject';
                    }
                })
                orderToUpdate.status = "Delivered"
            }
            

            await orderToUpdate.save();

            let walletUpdate
            if (orderToUpdate.status === 'Return Accept') {
                walletUpdate = new wallet({
                    userId: orderToUpdate.userId,
                    orders: orderToUpdate._id,
                    totalAmount: orderToUpdate.totalAmount,
                })
            }
            else if (orderToUpdate.status === 'Delivered'){
                let amount
                orderToUpdate.items.forEach(item => {
                    if( item.status === 'Return Accept'){
                        amount += item.productId.price
                    }
                })
                if (amount){
                    walletUpdate = new wallet({
                        userId: orderToUpdate.userId,
                        orders: orderToUpdate._id,
                        totalAmount: parseInt(orderToUpdate.totalAmount - amount),
                    })
                }
            }
            if (walletUpdate){
                await walletUpdate.save()
            }

            res.redirect('/orderlist');
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },


    downloadInvoice: async (req, res) => {
        try {
            const { id } = req.params
            const orderDetails = await order.findOne({ _id: id }).populate("items.productId")
            const userData = await user.findOne({ _id: req.session.userId })
            let result = await generateInvoicePDF(orderDetails, userData);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=Invoice.pdf"
            );

            res.status(200).end(result);
            console.log(orderDetails.items[0], "orderssssssssssssssss");
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    }
}



