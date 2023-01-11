const express = require("express");
const user_route = express();
const userController = require("../controllers/userController");
const userMiddleware = require('../middleware/userMiddleware')

// user_route.set("view engine", "ejs");
// user_route.set("views", "./views/user");

user_route.use(express.json())
user_route.use(express.urlencoded({ extended: true }))

// user_route.use('/',express.static('public'));

// app.set('view engine', 'ejs')
// adminRoute.set('views', './views/admin')
// userRoute.set('views', './views/users')


user_route.get("/",userController.loadHome);

user_route.get('/home', userController.loadHome);

// user_route.get("/login", auth.isLogout, userController.loginLoad);

user_route.get('/login',userMiddleware.isLogout,userController.loadUserLogin);

user_route.get('/productDetails',userController.productDetails)

user_route.get('/registration',userMiddleware.isLogout,userController.loadUserRegistration);

user_route.get('/home',userController.loadHome)

user_route.get('/userLogout',userMiddleware.isLogin,userController.userLogout)

user_route.get('/addToCart',userMiddleware.isLogin, userController.addToCart)

user_route.get('/cart',userMiddleware.isLogin,userController.loadCart)

user_route.get('/wishlist',userMiddleware.isLogin,userController.loadWishlist)

user_route.get('/addToWishlist', userMiddleware.isLogin, userController.addToWishlist)

user_route.get('/deleteWishlist', userController.deleteWishlist)

user_route.get('/shop',userController.loadShop)

user_route.post('/razorpay', userController.razorpayCheckout)

user_route.get('/deleteCart', userController.deleteCart)

user_route.get('/addToCartDeleteWishlist', userController.addCartDeleteWishlist)

user_route.get('/checkout',userController.loadCheckout)

user_route.get('/orderSuccess', userMiddleware.isLogin, userController.loadSuccess)

user_route.get('/cancelOrder', userMiddleware.isLogin, userController.cancelOrder)

user_route.get('/returnProduct', userMiddleware.isLogin, userController.returnProduct)

user_route.get('/viewOrder', userMiddleware.isLogin, userController.viewOrder)

user_route.get('/verifyOtp', userController.loadOtp)

user_route.get('/dashboard',userMiddleware.isLogin,userController.dashboard)

user_route.post('/verifyOtp', userController.verifyOtp)



user_route.get('/forgotPassword',userController.forgotPassword)

user_route.post('/forgotPassword',userController.forgotPasswordEmail)

user_route.post('/forgotPasswordOtp',userController.forgotPasswordOtp)

user_route.post('/forgotPasswordChangePassword',userController.changePassword)



user_route.post('/addAddress',userMiddleware.isLogin,userController.addAddress)


user_route.post('/editCart',userController.editCart)

user_route.post('/register', userController.insertUser)

user_route.post('/login',userController.verifyUserLogin);

user_route.post('/addCoupon',userMiddleware.isLogin,userController.addCoupon)

user_route.post('/checkout',userController.storeOrder)

user_route.use((req, res, next) => {
    res.render('user404')
  })

module.exports = user_route;