const product = require('../models/productSchema')
const category=require('../models/categorySchema')
const sharp=require("sharp")
const path = require('path');


// const { category } = require('./category')

module.exports={

    products:async (req,res)=>{
        try {
            const page = parseInt(req.query.page) || 1; 
            const perPage = 5;
            const skip = (page - 1) * perPage;
            const totalCount = await product.countDocuments();
            const totalPages = Math.ceil(totalCount / perPage);
            const products = await product.find().populate('category').skip(skip).limit(perPage);
         
            res.render('./admin/products',{
                products,
                currentPage: page,
                perPage,
                totalCount,
                totalPages,
            });
          
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },
    


    productdetail: async(req, res) =>{
        try {
            const { id } = req.params
            const products = await product.findOne({ _id: id }).populate('category')
            res.render("./admin/productDetail", { products })
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },


    addproducts:async(req,res)=>{
        try {
            const categories = await category.find({}).sort({ name: 1 })
            res.render('./admin/productAdd', {categories})
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }

    },

    addproductPost: async (req, res) => {
        try {
            const name = req.body.name
            const description = req.body.description
            const newcategory = await category.findOne({_id: req.body.category})
            const price = req.body.price
            const stock=req.body.stock
            const images = [];

            console.log(newcategory);
        
            for (let file of req.files) {
                try {
                    const croppedImageBuffer = await sharp(file.path) 
                        .resize({ width: 200, height: 200, fit: 'cover' })
                        .toBuffer();
                    const filename = `${file.fieldname}-${Date.now()}.jpg`; 
                    images.push(filename);
                    await sharp(croppedImageBuffer).toFile(path.join(__dirname, '..', 'public', 'uploads', filename));
                } catch (sharpError) {
                    console.error('Sharp error:', sharpError);
                    continue;
                }
            }
            console.log(images);
            //--------------------
            let status
            let display
            if (req.body.stock <= 0) {
                status = "Out of Stock";
            } else {
                status = "In Stock";
            }

           //--------------------

            if (!name || !description || !price || !newcategory || !images.length || !stock === 0) {
                return res.status(400).send("All fields are required.");
            }
    

            const existingProduct = await product.findOne({ name });
            if (existingProduct) {
                return res.status(400).send("Product already exists.");
            }
    
            const newProduct = new product({
                name: name,
                description: description,
                price: price,
                category: newcategory._id,
                images: images,
                stock:stock,
                status: true
            });
    
       
            await newProduct.save();
    
        
            res.redirect("/product");
        } catch (error) {
            console.error(error,'last error');
            res.status(500).send("Internal Server Error");
        }
    },


    //=========================EDIT PRODUCT======================//

    editProduct:async (req,res)=>{
        try {
            const {id} = req.params
            const categories = await category.find()
            const products = await product.findOne({_id: id}).populate('category')
            res.render('./admin/productEdit', {categories, products})
        } catch (error) {
            console.log(error)
            res.status(500).render("error500", { message: "Internal Server Error" })
        }
    },
    
    editProductPost: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, category, price ,stock} = req.body;
            const images = [];
    
           
            if (req.files) {
                for (let i = 0; i < 2; i++) { 
                    const fieldName = `images${i + 1}`;
                    if (req.files[fieldName] && req.files[fieldName][0]) {
                        images.push(req.files[fieldName][0].filename);
                        await product.findByIdAndUpdate({ _id: id }, { $set: { [`images.${i}`]: images[i] } });
                    }
                }
            }
    
            const updatedProduct = await product.findByIdAndUpdate(id, {
                name,
                description,
                category,
                price,
                stock,

            }, { new: true }); 

            if (images && images.length > 0) {
                updatedProduct.images = images
                await updatedProduct.save()
            }
    
            res.redirect("/product"); 
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    },  
    



    removeProduct:async (req,res)=>{
    
        try {
            const id=req.params.id
            console.log(id);
            const pro=await product.findByIdAndDelete(id)
            res.json({ success: true, message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    
    },
}    