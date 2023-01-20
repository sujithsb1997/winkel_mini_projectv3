const User = require('../model/userModel')
const Product = require('../model/productModel')
const Order = require('../model/ordersModel')
const Category = require('../model/categoryModel')
const Offer = require('../model/offerModel')
const Banner = require('../model/bannerModel')
const bcrypt = require('bcrypt')
const path = require('path')
const multer = require('multer')
const excelJS = require('exceljs');

let isAdminLoggedin
isAdminLoggedin = false
let adminSession = false || {}
let orderType = 'all'

// let Storage = multer.diskStorage({
//     destination:"./public/admin/assets/uploads/",
//     filename:(req,file,cb)=>{
//         cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
//     }
// })
// let upload = multer({
//     storage:Storage
// }).single('sImage')

const loadAdminLogin = async (req, res) => {
    try {
      res.render('adminLogin');
    } catch (error) {
      console.log(error.message);
    }
  };


  const verifyAdminLogin = async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;

        const adminData = await User.findOne({email:email})
        
       
        if(adminData){
            const passwordMatch = await bcrypt.compare(password, adminData.password)
            console.log(passwordMatch)
            if(passwordMatch){
                if(adminData.is_admin === 1){
                        adminSession = req.session
                    isAdminLoggedin = true 
                    adminSession.adminId = adminData._id
                    res.redirect('/admin/dashboard')
                    console.log('Admin logged in');
                }else{
                  
                    res.render('adminLogin',{message:"Please redirect to user page"})
                    
                   
                }
        }else{
            res.render('adminLogin',{message:"Email and password is incorrect."})
        }
    } else {
        res.render('adminLogin', { message: 'Email and password is incorrect.' })
      }
    }   catch(error){
        console.log(error.message)
    }
}


const loadAddProduct = async (req,res)=>{
    const categoryData = await Category.find({isAvailable:1})
   try{ res.render('addProduct',{category:categoryData})
  }
  catch(error){
    console.log(error.message);
  }

}

const addProduct = async (req,res)=>{

    try{

        const images = req.files;
        
        const product = Product({
            name: req.body.sName,
            category: req.body.sCategory,
            price: req.body.sPrice,
            description: req.body.sDescription,
            quantity: req.body.sQuantity,
            rating: req.body.sRating,
            image: images.map((x)=>x.filename)
        })
        const productData = await product.save()
        const categoryData = await Category.find()
        if(productData){
            res.render('addProduct', {category:categoryData,message: "registration successfull."})
        }else{
            res.render('addProduct',{category:categoryData,message:"registration failed"})
        }
    }catch(error){
        console.log(error.message)
    }



}

const loadEditProduct = async(req,res)=>{
    try {
        const id = req.query.id
        const productData = await Product.findById({ _id:id })
        const categoryData = await Category.find({isAvailable:1}) 

        if(productData){
            res.render('editProduct',{ product:productData , category:categoryData})
        }
        else{
            res.redirect('/admin/adminProduct',{message:"Product doesn'nt exist"})
        }

    } catch (error) {
        console.log(error.message);
    }
}




const editProduct = async (req, res) => {
  try {
    const id = req.body.id
    const name = req.body.sName
    const category = req.body.sCategory
    const price = req.body.sPrice
    const quantity = req.body.sQuantity
    const rating = req.body.sRating
    const description = req.body.sDescription
    const files=req.files
    const image = files.map((x)=>x.filename)

    console.log(image);


    if (image.length==0) {
     
      await Product.updateOne(
        { _id:req.body.id },
        {
          $set: {
            name,
            category,
            description,
            price,
            quantity,
            rating,
          }
        }
      )


      
    } else {
       
      await Product.updateOne(
        { _id:req.body.id },
        { 
          $set: {
            name,
            category,
            price,
            description,
            quantity,
            rating,
            image,
          }
        }
      )

    }
   
    res.redirect('/admin/adminProduct')
  } catch (error) {
    console.log(error.message)
  }
}


const unlistProduct = async(req,res)=>{
    try {
        
        const id = req.query.id
        await Product.updateOne({ _id:id },{$set:{isAvailable:0}})
        res.redirect('/admin/adminProduct')

    } catch (error) {
        console.log(error.message);
    }
}

const listProduct = async(req,res)=>{
    try {
        
        const id = req.query.id
        await Product.updateOne({ _id:id },{$set:{isAvailable:1}})
        res.redirect('/admin/adminProduct')

    } catch (error) {
        console.log(error.message);
    }
}





const loadDashboard = async (req, res) => {
    try {
      adminSession = req.session
      if (isAdminLoggedin) {
        const productData = await Product.find()
        const userData = await User.find({ is_admin: 0 })
        const adminData = await User.findOne({is_admin:1})
        const categoryData = await Category.find()
  
        const categoryArray = [];
        const orderCount = [];
        for(let key of categoryData){
          categoryArray.push(key.name)
          orderCount.push(0)
      }
      const completeorder = []
      const orderData =await Order.find()
      for(let key of orderData){
        const uppend = await key.populate('products.item.productId')
        completeorder.push(uppend)
    }
  
    const productName =[];
    const salesCount = [];
    const productNames = await Product.find();
    for(let key of productNames){
      productName.push(key.name);
      salesCount.push(key.sales)
    }
    for(let i=0;i<completeorder.length;i++){
      for(let j = 0;j<completeorder[i].products.item.length;j++){
         const cataData = completeorder[i].products.item[j].productId.category
         const isExisting = categoryArray.findIndex(category => {
          return category === cataData
         })
         orderCount[isExisting]++
  }}
  
    const showCount = await Order.find().count()
    const productCount = await Product.count()
    const usersCount = await User.count({is_admin:0})
    const totalCategory = await Category.count({isAvailable:1})
  
  console.log(categoryArray);
  console.log(orderCount);
  
      res.render('dashboard', {
        users: userData,
        admin: adminData,
        product: productData,
        category: categoryArray,
        count: orderCount,
        pname:productName,
        pcount:salesCount,
        showCount,
        productCount,
        usersCount,
        totalCategory
        
      });
        
      } else {
        res.redirect('/admin/adminLogin')
      }
    } catch (error) {
      console.log(error.message)
    }
  }

const loadAdminUser = async (req, res) => {
    try {

        const userData = await User.find({is_admin:0})
       // const adminData = await User.findOne({is_admin:1})

        res.render('adminUser',{users:userData})
        console.log(userData)
    }
    catch (error) {
        console.log(error.message)
    }
}

const loadAdminProduct = async (req, res) => {
    try {
        const productData = await Product.find()
        
        res.render('adminProduct',{ products: productData })
    }
    catch (error) {
        console.log(error.message)
    }
}



const blockUser = async(req,res)=>{
    console.log('1')
    try{
        console.log('2')
        const id = req.query.id
        const userData = await User.findById({_id:id})
        if(userData.isVerified){
            console.log('3')
            await User.findByIdAndUpdate({_id:id},{ $set:{isVerified:0}})
        }else{
            console.log('4')
            await User.findByIdAndUpdate({_id:id},{ $set:{isVerified:1}})
        }
        res.redirect('/admin/user')
    }catch{

    }
}

const adminProduct = async(req,res)=>{
    try{
        const productData = await Product.find()
        const categoryData = await Category.find()
    res.render('adminProduct', {products:productData,category:categoryData})
    }
    catch(error){
        console.log(error.message)
    }
    }
    

const loadCategory = async(req,res)=>{
    try{

        const categoryData = await Category.find()
        res.render('adminCategory',{category:categoryData})
    }
    catch(error){
        console.log(message.error)
    }
}

const unlistCategory = async (req,res)=>{
    try{
        const id = req.query.id
        await Category.updateOne({ _id:id },{$set:{isAvailable:0}})
        res.redirect('adminCategory')

    }
    catch(error){
        console.log(error.message)
    }
}

const listCategory = async (req,res)=>{
    try{
        const id = req.query.id
        await Category.updateOne({ _id:id },{$set:{isAvailable:1}})
        res.redirect('adminCategory')

    }
    catch(error){
        console.log(error.message)
    }
}



const addCategory = async(req,res)=>{
    try{
        const category = Category({name:req.body.category})
        await category.save()
        res.redirect('adminCategory')
    }
    catch(error){
        console.log(error.message)
    }
}

const adminLogout = async(req,res)=>{
    adminSession = req.session
    adminSession.adminId = false
    isAdminLoggedin = false
    console.log('Admin logged out');
    res.redirect('/admin')
}

const loadOffer = async(req, res)=>{
    try {
      const offerData = await Offer.find()
      res.render('offer',{offer:offerData})
    }catch(error){
      console.log(error.message)
    }
  }

  const addOffer = async (req, res) => {
    try {
      const offer = Offer({
        name: req.body.name,
        type: req.body.type,
        discount: req.body.discount
      })
      await offer.save()
      res.redirect('/admin/offer')
    } catch (error) {
      console.log(error.message)
    }
  }  

  const deleteOffer = async(req,res)=>{
    try {
      const id = req.query.id
      await Offer.deleteOne({_id:id})
      res.redirect('/admin/offer')
    } catch (error) {
      console.log(error.message)
    }
  }


  const addBanner = async(req,res)=>{
    try {
      const newBanner = req.body.banner
      console.log(newBanner);
      const a = req.files
      console.log(req.files)
      const banner = new Banner({
        banner:newBanner,
        bannerImage:a.map((x)=>x.filename)
      })
      const bannerData = await banner.save()
      if(bannerData){
        res.redirect('/admin/loadBanner')
      }
  
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadBanner = async(req,res)=>{
    try {
      const bannerData = await Banner.find()
      res.render('banner', {
        banners: bannerData
      })
  
    } catch (error) {
      console.log(error.message)
    }
  }

  const activeBanner = async(req,res)=>{
    try {
      const id = req.query.id
      await Banner.findOneAndUpdate({is_active:1},{$set:{is_active:0}})
      await Banner.findByIdAndUpdate({ _id: id },{$set:{is_active:1}})
      res.redirect('/admin/loadBanner')
    } catch (error) {
      console.log(error.message)
    }
  }

  const adminSalesReport = async(req,res)=>{
    try {
      const productData = await Product.find()
      res.render('salesReport',{
        product:productData,
        admin:true})
    } catch (error) {
      console.log(error.message);
    } 
  }

  const adminViewOrder = async(req,res)=>{
    try {
      const productData = await Product.find()
      const userData = await User.find({is_admin: 0})
      const orderData = await Order.find().sort({createdAt :-1})
      console.log(orderData)
      for(let key of orderData){
        await key.populate('products.item.productId');
        await key.populate('userId');
      }
      if (orderType == undefined) {
        res.render('orderReport', {
          users: userData,
          product: productData,
          order: orderData,
          
        });
      }else{
          id = req.query.id;
          res.render('orderReport', {
            users: userData,
            product: productData,
            order: orderData,
            id: id,
          });
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const cancelOrder = async(req,res)=>{
    try {
      const id = req.query.id;
      await Order.deleteOne({ _id: id });
      res.redirect('/admin/orderReport');
    } catch (error) {
      console.log(error.message)
    }
  }

  const adminDeliveredOrder = async(req,res)=>{
    try {
      const id = req.query.id;
      await Order.updateOne({ _id: id }, { $set: { status: 'Delivered' } });
      res.redirect('/admin/orderReport');
    } catch (error) {
      console.log(error.message)
    }
  }

  const confirmOrder = async(req,res)=>{
    try {
      const id = req.query.id;
      await Order.updateOne({ _id: id }, { $set: { status: 'confirmed' } });
      res.redirect('/admin/orderReport');
    } catch (error) {
      console.log(error.message)
    }
  }

  const stockReport = async(req,res)=>{
    try {
      const productData = await Product.find()
      res.render('stockReport',{
        product:productData,
        admin:true})
    } catch (error) {
      console.log(error.message);
    } 
  }

  const adminOrderDetails = async(req,res)=>{
    try {
        const id = req.query.id
        const userData = await User.find()
        const orderData = await Order.findById({_id:id});
        await orderData.populate('products.item.productId');

        await orderData.populate('userId')
   res.render('adminViewOrder',{
    order:orderData,users:userData
   
   })
    } catch (error) {
      console.log(error.message);
    }
  }

  const adminDownload = async(req,res)=>{
    try{

      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Stock Report")

      worksheet.columns = [
        {header:"Sl No.", key:"s_no"},
        {header:"Product", key:"name"},
        {header:"Category", key:"category"},
        {header:"Price", key:"price"},
        {header:"Quantity", key:"quantity"},
        {header:"Rating", key:"rating"},
        {header:"Sales", key:"sales"},
        {header:"isAvailable", key:"isAvailable"},

      ]
      let counter = 1

      const productData = await Product.find()

      productData.forEach((product) => {
        product.s_no = counter;
        worksheet.addRow(product)
        counter++;
      })

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = {bold:true}
      })

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
      )

      res.setHeader("Content-Disposition","attachment; filename=products.xlsx")

      return workbook.xlsx.write(res).then(()=>{
        res.status(200);
      })

    }catch(error){
      console.log(error.message);
    }
  }

  





module.exports = {
    loadDashboard,
    loadAdminUser,
    loadAdminProduct,
    loadAdminLogin,
    verifyAdminLogin,
    blockUser,
    loadAddProduct,
    addProduct,
    adminProduct,
    editProduct,
    loadEditProduct,
    unlistProduct,
    listProduct,
    loadCategory,
    unlistCategory,
    listCategory,
    addCategory,
    adminLogout,
    loadOffer,
    deleteOffer,
    addOffer,
    addBanner,
    loadBanner,
    activeBanner,
    adminViewOrder,
    cancelOrder,
    confirmOrder,
    adminSalesReport,
    adminDeliveredOrder,
    stockReport,
    adminOrderDetails,
    adminDownload
    
    
}