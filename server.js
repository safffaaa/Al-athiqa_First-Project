const express=require('express')
const session=require('express-session')
const path=require('path')
require('dotenv').config()
const mongoos=require('mongoose')
const adminrouter=require('./router/adminrouter')
const userrouter=require('./router/userrouter')
const db=require("./config/db")
const upload=require('./middleware/multer')
const flash=require('express-flash')
const { generateSalesPDF } = require('./utility/downloadSalesReport')
const sharp=require("sharp")


const app=express()



app.use(express.static("public"))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set(express.static(path.join(__dirname,'views')))
app.set('view engine',"ejs")


app.use(flash())

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}))


app.use('/',adminrouter)
app.use('/',userrouter)

// app.use((req, res, next) => {
//     res.status(404).render('errorpage'); 
// });


app.listen(process.env.PORT,()=>{
    console.log( `server statrted in http://localhost:${process.env.PORT}`)
})

