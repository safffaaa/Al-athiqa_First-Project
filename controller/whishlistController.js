const order=require('../models/orderSchema')
const wallet=require('../models/walletSchema')
const product=require('../models/productSchema')
const wishlist=require('../models/wishlistSchema')
const users=require('../models/user')
const { log } = require('console')


module.exports={
  
    getWishlist: async (req, res) => {
        try {
            const email = req.session.userEmail;
            const user = await users.findOne({ email: email });
            if (!user) {
                throw new Error("User not found");
            }
            const showproduct = await wishlist.findOne({ userId: user._id }).populate('products');
            if (!showproduct) {
                throw new Error("Wishlist not found");
            }
    
            console.log(showproduct);
            res.render('./user/wishlist', { showproduct });
            // console.log(showproduct ,'okkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
        } catch (error) {
            console.error(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },
    
    addWishlist: async (req, res) => {
        try {
            
            const { id } = req.params;
            const userId = req.session.userId;
            console.log(id,userId,"i am here");
    
            const addtoWishlist = await wishlist.findOne({ userId:userId });
            if (!addtoWishlist) {
                await wishlist.create({
                    userId: userId,
                    products: [id]
                });
            } else {
                if (addtoWishlist.products.includes(id)) {
                    req.flash("error", "Product already in the wishlist");
                    return res.redirect(`/ProductDetail/${id}`);
                }
               addtoWishlist.products.push(id);
                await addtoWishlist.save();
            }

            res.redirect("/wishlist");
        } catch (error) {
            console.error(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    removeWish: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.session.userId;
    
            const userWishlist = await wishlist.findOne({ userId: userId });
        
            if (!userWishlist) {
                throw new Error("Wishlist not found");
            }
    
            userWishlist.products.pull(id);
            await userWishlist.save();
    
            res.redirect("/wishlist");
        } catch (error) {
            console.error(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

   
        
}

