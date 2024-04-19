const user=require('../models/user')
const order=require('../models/orderSchema')
const product=require('../models/productSchema')
const wallet=require('../models/walletSchema')

module.exports={

    getWallet: async (req, res) => {
        try {
            const userId = req.session.userId;
            const myWallet = await wallet.find({ userId: userId }).populate('orders');
            let  walletTotal = 0;
            myWallet.forEach(balance => {
                if(balance.status === 'Credit'){
                    walletTotal += balance.totalAmount
                }
                else if(balance.status === 'Debit'){
                    walletTotal -= balance.totalAmount
                }
            })
            const currentUser = await user.findOne({ _id: userId });
            req.session.walletAmount = walletTotal;
            res.render("./user/wallet", { myWallet, walletTotal, currentUser });
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    }
}
