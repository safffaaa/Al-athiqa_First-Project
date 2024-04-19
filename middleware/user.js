
const verifyUser = (req,res,next)=>{

    if (!req.session.login) {
        res.redirect('/');

    } else {
        next()
    }
}


module.exports={
    verifyUser
}