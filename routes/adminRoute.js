const express = require("express");
const adminRoute = express();
const adminMiddleware = require('../middleware/adminMiddleware')
const adminController = require('../controllers/adminController')
const multer = require('../util/multer')


adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/Admin");

// const bodyParser = require("body-parser");
// adminRoute.use(bodyParser.json());
// adminRoute.use(bodyParser.urlencoded({ extended: true }));




// adminRoute.use('/',express.static('public/admin'))

adminRoute.get("/addProduct",adminMiddleware.isLogin,adminController.loadAddProduct);

adminRoute.get("/dashboard",adminMiddleware.isLogin,adminController.loadDashboard);



adminRoute.get("/",adminController.loadDashboard);

adminRoute.get("/adminLogin",adminController.loadAdminLogin);



adminRoute.get("/user",adminMiddleware.isLogin,adminController.loadAdminUser);

adminRoute.get("/adminProduct",adminMiddleware.isLogin,adminController.adminProduct);

adminRoute.get('/blockUser',adminMiddleware.isLogin,adminController.blockUser)

adminRoute.get('/adminProduct',adminMiddleware.isLogin,adminController.adminProduct)

adminRoute.get("/editProduct",adminMiddleware.isLogin,adminController.loadEditProduct)

adminRoute.get("/unlistProduct",adminMiddleware.isLogin,adminController.unlistProduct)

adminRoute.get("/listProduct",adminMiddleware.isLogin,adminController.listProduct)

adminRoute.get("/adminCategory",adminMiddleware.isLogin,adminController.loadCategory)

adminRoute.get("/unlistCategory",adminMiddleware.isLogin,adminController.unlistCategory)

adminRoute.get("/listCategory",adminMiddleware.isLogin,adminController.listCategory)

adminRoute.get("/adminLogout",adminMiddleware.isLogin,adminController.adminLogout)

adminRoute.get("/offer", adminMiddleware.isLogin, adminController.loadOffer)

adminRoute.get('/deleteOffer', adminMiddleware.isLogin, adminController.deleteOffer)

adminRoute.get('/loadBanner', adminMiddleware.isLogin, adminController.loadBanner)

adminRoute.get('/currentBanner',adminMiddleware.isLogin,adminController.activeBanner)

adminRoute.get('/orderReport',adminMiddleware.isLogin,adminController.adminViewOrder);

adminRoute.get('/stockReport',adminMiddleware.isLogin,adminController.stockReport)

adminRoute.get('/adminOrderDetails',adminMiddleware.isLogin,adminController.adminOrderDetails)


adminRoute.get('/adminCancelOrder',adminMiddleware.isLogin, adminController.cancelOrder);

adminRoute.get('/confirmOrder',adminMiddleware.isLogin, adminController.confirmOrder);

adminRoute.get('/adminDeliveredOrder',adminMiddleware.isLogin,adminController.adminDeliveredOrder);

adminRoute.get('/download',adminMiddleware.isLogin,adminController.adminDownload);



// adminRoute.post("/",adminController.verifyAdminLogin);

adminRoute.post("/login",adminController.verifyAdminLogin)

adminRoute.post("/addProduct",multer.upload.array('sImage'), adminController.addProduct);

adminRoute.post("/editProduct",multer.upload.array('sImage'),adminController.editProduct)

adminRoute.post("/adminCategory",adminMiddleware.isLogin,adminController.addCategory)

adminRoute.post('/offers', adminController.addOffer)

adminRoute.post('/loadBanner',multer.upload.array('bannerImage',3),adminController.addBanner)


adminRoute.use((req, res, next) => {
    res.render('admin404')
  })

module.exports = adminRoute;



