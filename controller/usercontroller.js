const use = require('../models/user');
const bcrypt = require("bcrypt")
const otpFunction = require('../utility/sendotp')
const product = require('../models/productSchema');
const category = require('../models/categorySchema')
const order = require('../models/orderSchema')
const OTP = require('../models/otpSchema')
const flash = require('express-session')
const { error } = require('console');



var _otp;
var _name;
var _email;
var _password;

module.exports = {

    //------------------------------------------signin root---------------------------------------//

    getLogin: async (req, res) => {
        try {
            const categories = await category.find({});
            // console.log(categories);
            res.render('./user/homepage', { req: req, categories: categories });
        } catch (error) {
            console.error(error);
            // Handle the error
            res.status(500).send("Internal Server Error");
        }
    },

    login: async (req, res) => {
        try {
            res.render("./login/signin")
        }
        catch (err) {
            console.log(err);
        }
    },

    loginPost: async (req, res) => {
        try {

            const { email, password } = req.body
            const user = await use.findOne({ email: email })
            if (user) {
                if (user.status === 'Active') {
                    const passwordVerify = await bcrypt.compare(password, user.password)
                    if (passwordVerify) {
                        req.session.login = true
                        req.session.userEmail = email
                        req.session.userId = user._id
                        console.log('User sign in successfully');
                        res.redirect('/')
                    } else {
                        console.log('Password is wrong');
                        return res.redirect('/signin')
                    }
                }
                else {
                    console.log('User has been Blocked by Admin');
                    res.redirect('/signin')
                }
            }
            else {
                console.log('Invalid credential');
                return res.render('./login/signin', { error: 'Invalid credential' })
            }

        } catch (error) {
            console.log(error);
        }
    },



    logout: (req, res) => {
        req.session.login = false
        res.redirect('/')
    },



    getSignup: (req, res) => {
        res.render('./login/signup')
    },


    postSignup: async (req, res) => {
        try {
            const { name, email, password, confirmPassword } = req.body
            console.log(req.body);
            _name = name
            _email = email
            _password = password
            if (password != confirmPassword) {
                console.log('Password doesnot match..!');
                return res.render('./login/signup', { error: 'Password doesnot match..!' })
            }
            else {
                const hashPassword = await bcrypt.hash(_password, 12)
                const user = await use.findOne({ email: email, password: hashPassword });
                if (user) {
                    console.log('User already exist');
                    return res.render('./login/signup', { error: 'User already exist' })
                }
                else {
                    _otp = await otpFunction.sendOTP(email)
                    res.redirect("/otpverify")
                }
                //
                // res.redirect('/signin');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            res.redirect('/signin')
        }
    },




    getForgotPwd: (req, res) => {
        try {
            res.render('./login/forgot');
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    postForgotPwd: async (req, res) => {
        try {
            const email = req.body.email
            const users = await use.findOne({ email: email })
            if (users) {
                const otpToBeSent = otpFunction.sendOTP();
                const result = otpFunction.sendOTP(email, otpToBeSent)
                req.session.user = users
                res.render("./login/otp")
            }
            else {
                // req.flash("error", "Email not registered with us")
                console.log('Email not registered with us');
                res.render('./login/forgot', { error: 'Email not registered with us' });
            }
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },



    getOTPverify: async (req, res) => {
        res.render('./login/otp')

    },
    postOTPverify: async (req, res) => {
        try {
            const { getotp } = req.body
            if (getotp == _otp) {
                const hashPassword = await bcrypt.hash(_password, 12)
                const newUser = await use.create({ name: _name, email: _email, password: hashPassword });
                console.log('User added successfully');
                res.redirect('/signin')
            }
            else {
                req.flash("error", "incorrect otp")
                res.redirect('/otpverify')
            }

        } catch (error) {
            console.log(error);
        }
    },

    //--------------------------------------------------------------------------------------------


    getPwdchange: (req, res) => {
        try {
            if (req.session.login) {
                res.render('./user/userPwdchange');
            }
            else {
                res.redirect('/signin')
            }
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }

    },


    postPwdchange: async (req, res) => {
        try {
            const { password, newpassword, confirmpassword } = req.body;
            const email = req.session.userEmail
            const user = await use.findOne({ email: email });

            if (!user) {
                res.status(404).render("error", { message: "User not found" });
            }
            const PasswordCorrect = await bcrypt.compare(password, user.password);
            if (!PasswordCorrect) {
                res.redirect("/userPasswordChange");
            }
            if (newpassword === confirmpassword && password !== newpassword) {
                const hashPassword = await bcrypt.hash(newpassword, 12);
                await use.findOneAndUpdate({ email: user.email }, { $set: { password: hashPassword } });
                console.log(newpassword);
                console.log(password);
                res.redirect("/userprofile");
            } else {

                return res.render("error", { message: "Passwords do not match or new password is the same as the old one" });
            }
        } catch (error) {

            console.log(error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    //-------------------------------------------------------------------------------------------------------



    allProducts: async (req, res) => {
        const products = await product.find({ status: true })
        const categories = await category.find({ status: 'Active' })
        res.render('./user/productsList', { products, categories, selectedCategories: [] })
    },

    postFilter: async (req, res) => {
        try {
            let query = { status: true };

            if (req.body.category && req.body.category.length > 0) {
                query.category = { $in: req.body.category };
            }

            if (req.body.price && req.body.price > 0) {
                const minPrice = 0;
                const maxPrice = req.body.price;
                query.price = { $gte: minPrice, $lte: maxPrice };
            }

            const filteredProducts = await product.find(query);

            const categories = await category.find({ status: 'Active' });

            // const selectedCategories = req.body.category
            // console.log(selectedCategories);

            res.render('./user/productsList', { products: filteredProducts, categories, selectedCategories: req.body.category || [] });
        } catch (error) {
            console.error('Error filtering products:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },


    showProduct: async (req, res) => {
        try {
            const selectedCategoryName = req.params.id;
            console.log(selectedCategoryName);

            const Categorys = await category.findOne({ _id: selectedCategoryName });
            console.log(Categorys);
            const categories = await category.find({ status: 'Active' })

            if (Categorys) {
                const products = await product.find({ category: Categorys, status: true });
                res.render('./user/productsList', { products, categories, selectedCategories: [] });
            } else {
             
                res.render('./user/productsList', { products: [] });
            }
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    },


    searchProducts: async (req, res) => {
        try {
            const query = req.query.query;
            const searchResults = await product.find({ name: { $regex: new RegExp(query, 'i') } });
            res.json(searchResults);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    productDetails: async (req, res) => {
        try {
            const id = req.params.id
            const products = await product.findOne({ _id: id }).populate('category')
            res.render('./user/productDetails', { products })
        } catch (error) {
            console.error('Error adding user:', error);
        }

    },



    Profile: async (req, res) => {
        try {
            const userEmail = req.session.userEmail
            const newuser = await use.findOne({ email: userEmail })
            res.render('./user/profile', { newuser })
        } catch (error) {

        }


    },

    getAddress: async (req, res) => {
        try {
            const email = req.session.userEmail
            const newuser = await use.findOne({ email: email })
            const addresses = newuser.address

            res.render('./user/userAddress', { addresses })
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }

    },

    getAddaddress: async (req, res) => {
        res.render('./user/userAddaddresses')
    },


    postAddaddress: async (req, res) => {
        try {
            const email = req.session.userEmail
            const addressData = {
                name: req.body.name,
                addressLane: req.body.houseName,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                mobile: req.body.mobile,
                altMobile: req.body.altMobile
            };
            const user = await use.findOne({ email: email })
            if (user) {
                user.address.push(addressData)
                await user.save();
                res.redirect('/address')
            }


        } catch (error) {
            console.log(error);
        }
    },

    geteditAddress: async (req, res) => {
        try {
            const { id } = req.params
            const email = req.session.userEmail
            const newuser = await use.findOne({ email: email })
            const addresses = newuser.address.id(id)
            res.render('./user/userEditaddress', { addresses })
        } catch (error) {
            console.log(error);
        }
    },

    posteditAddress: async (req, res) => {
        try {
            const { id } = req.params
            const email = req.session.userEmail
            const newuser = await use.findOne({ email: email })
            const nweuserEdit = newuser.address.id(id)

            nweuserEdit.name = req.body.name
            nweuserEdit.addressLane = req.body.houseName,
                nweuserEdit.city = req.body.city,
                nweuserEdit.pincode = req.body.pincode,
                nweuserEdit.state = req.body.state,
                nweuserEdit.mobile = req.body.mobile,
                nweuserEdit.altMobile = req.body.altMobile

            await newuser.save()
            res.redirect('/address')
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    deleteAddress: async (req, res) => {
        try {
            const { id } = req.params
            const email = req.session.userEmail
            const newuser = await use.findOne({ email: email })
            const userId = newuser._id

            await use.findByIdAndUpdate({ _id: userId }, { $pull: { address: { _id: id } } })

            res.redirect('/address')
        } catch (error) {
            console.log(error);
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },

    addressAddCheckout: async (req, res) => {
        try {
            const email = req.session.userEmail
            console.log(email);
            const addressData = {
                name: req.body.name,
                addressLane: req.body.houseName,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                mobile: req.body.mobile,
                altMobile: req.body.altMobile
            };
            console.log(addressData);
            const user = await use.findOne({ email: email })
            if (user) {
                user.address.push(addressData)
                await user.save();
                res.redirect('/checkoutpage')
            }


        } catch (error) {
            console.log(error);
        }
    },

    userOrder: async (req, res) => {
        try {
            if (req.session.login) {
                const email = req.session.userEmail;
                const userData = await use.findOne({ email: email });
                if (!userData) {
                    return res.redirect('/');
                }
                const orderlist = await order.find({ userId: userData }).populate("address").sort({ orderDate: -1 });
                res.render('./user/userOrder', { orderlist })
            }
            else {
                return res.redirect('/signin')
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },

    orderDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const email = req.session.userEmail;
            const userData = await use.findOne({ email: email });
            if (!userData) {
                return res.redirect('/');
            }
            const myOrder = await order.findOne({ _id: id })
                .populate('address')
                .populate('items.productId');

            console.log(myOrder);
            res.render('./user/userorderview', { myOrder });
        } catch (error) {
            console.error('Error fetching order:', error);
            return res.status(500).render("error500", { message: "Internal Server Error" });
        }
    },
    

}






