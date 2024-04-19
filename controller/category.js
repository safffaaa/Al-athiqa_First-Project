const { name } = require('ejs')
const category = require('../models/categorySchema')

module.exports = {
    category: async (req, res) => {
        try {
            const categories = await category.find()
            res.render('./admin/category',{categories})
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },
    
    
    addcategory_get: async (req, res) => {
        try {
            res.render('./admin/categoryAdd')
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },
    

    
    addcategory_post: async(req, res) => {
        try {
            const {catname}=req.body;
            const catimg=req.file.filename;
            console.log(req.file,'-----------')
            const cat = await category.findOne({name: catname})
            console.log(catname, catimg);
            
            if (!catname || !catimg) {
                console.log('no name and image');
                // req.flash("error", "Please provide both category name and image.");
                return res.redirect("/addCategory");
            }

            if(cat){
                console.log("category already in the db")
                // req.flash("error", "Category already exists")
                res.redirect("/addCategory")
            } else {
                const newCategory = new category({
                    name:catname,
                    images:catimg
                })
                console.log(newCategory);
                await newCategory.save()
            }
            console.log("category added")
            // req.flash("success", "Category added")
            res.redirect("/category")

        } catch (error) {
            console.log(error)
            // res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },



    editCategory:async (req,res)=>{
        try {
            const id=req.params.id
            const Category=await category.findById(id)
            res.render('admin/editcategory',{Category})

        } catch (error) {
            console.log(error)
           
        }
    },


    posteditCategory: async (req, res) => {
        try {
            const id = req.params.id;
            const newName = req.body.name;
            const existingCategory = await category.findOne({ name: newName });
            if (existingCategory && existingCategory._id != id) {

            req.flash("error", "category name alredy exists...!!")
            res.redirect(`/editcategory/${id}`)
            }
    
       
            if (req.file) {
                req.body.images = req.file.filename;
            }
            const Data = await category.findByIdAndUpdate(id, { $set: req.body }, { new: true });
            console.log(Data);
            res.redirect('/category');
        } catch (error) {
            console.log(error);
            res.render('admin/editcategory', { error: error.message, Category: req.body });
        }
    },
    


    removeCategory: async (req,res) => {
        try {
            const id=req.params.id
            console.log(id);
            const Category=await category.findByIdAndDelete(id)
            res.json({ success: true, message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }



}