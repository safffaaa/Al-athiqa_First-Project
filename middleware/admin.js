
const verifyAdmin = (req, res, next) => {
    if (!req.session.adminlogin) {
        res.redirect('/admin');
    } else {
        next()
    }
}

module.exports = {
    verifyAdmin,

}