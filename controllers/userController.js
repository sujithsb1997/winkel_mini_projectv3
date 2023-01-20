const User = require("../model/userModel");
const Product = require("../model/productModel");
const Address = require("../model/addressModel");
const Order = require("../model/ordersModel");
const Offer = require("../model/offerModel");
const Category = require("../model/categoryModel");
const Banner = require("../model/bannerModel");
const { findOne } = require("../model/userModel");
const { loadDashboard } = require("./adminController");

const { ObjectID } = require('bson')

const cors = require("cors");
const Razorpay = require("razorpay");
const bcrypt = require("bcrypt");
const fast2sms = require("fast-two-sms");

let isLoggedin;
isLoggedin = false;
let userSession = false || {};

let newUser;
let newOtp;

let offer = {
  name: "None",
  type: "None",
  discount: 0,
  usedBy: false,
};
let couponTotal = 0;
let nocoupon;

const sendMessage = function (mobile, res) {
  let randomOTP = Math.floor(Math.random() * 10000);
  var options = {
    authorization:
      process.env.API_KEY,
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  };
  //send this message
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
};

const loadHome = async (req, res) => {
  try {
    userSession = req.session;
    userSession.couponTotal = couponTotal;
    userSession.nocoupon = nocoupon;
    userSession.offer = offer;
    const banner = await Banner.findOne({ is_active: 1 });
    const productData = await Product.find();
    console.log(banner);
    res.render("home", {
      isLoggedin: false,
      products: productData,
      id: userSession.userId,
      banners: banner,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const email = req.body.email;
    const isEamil = await User.findOne({ email: email });
    if (isEamil) {
      res.render("registration", { message: "Email already Exists" });
    } else {
      const spassword = await securePassword(req.body.password);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mno,
        password: spassword,
        is_admin: 0,
      });

      const userData = await user.save();
      newUser = userData._id;

      if (userData) {
        res.redirect("/verifyOtp");
      } else {
        res.render("registration", { message: "registration failed" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtp = async (req, res) => {
  const userData = await User.findById({ _id: newUser });
  const otp = sendMessage(userData.mobile, res);
  newOtp = otp;
  console.log("otp:", otp);
  res.render("verifyOtp", { otp: otp, user: newUser });
};

const verifyOtp = async (req, res) => {
  try {
    const otp = newOtp;
    const userData = await User.findById({ _id: req.body.user });
    if (otp == req.body.otp) {
      userData.isVerified = 1;
      const user = await userData.save();
      if (user) {
        res.redirect("/login");
      }
    } else {
      res.render("verifyOtp", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyUserLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.isVerified === 0) {
          res.render("login", { message: "your account has been devactivated please contact the Customer Care for more information" });
        } else {
          if (userData.is_admin === 1) {
            res.render("login", { message: "Not user" });
          } else {
            userSession = req.session;
            userSession.userId = userData._id;
            isLoggedin = true;
            res.redirect("/home");
            console.log("log in");
          }
        }
      } else {
        res.render("login", { message: "email or password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserRegistration = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const loadShop = async (req, res) => {
  try {
    userSession = req.session;

    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 6;
    const productData = await Product.find({
      isAvailable: 1,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Product.find({
      isAvailable: 1,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    const categoryData = await Category.find({ isAvailable: 1 });
    const ID = req.query.id;
    // console.log(categoryData)

    const data = await Category.findOne({ _id: ID });

    if (data) {
      const productData = await Product.find({ category: data.name });
      console.log(productData);
      res.render("shop", {
        products: productData,
        isLoggedin,
        id: userSession.userId,
        cat: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1,
        // wishCount,
        // cartCount,
      });
    } else {
      // const productData = await Product.find()
      res.render("shop", {
        isLoggedin,
        cat: categoryData,
        products: productData,
        id: userSession.userId,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const productDetails = async (req, res) => {
  try {
    userSession = req.session;
    const id = req.query.id;
    const products = await Product.find();
    const productData = await Product.findById({ _id: id });
    if (productData) {
      res.render("singleProduct", {
        isLoggedin,
        id: userSession.userId,
        product: productData,
        products: products,
      });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  userSession = req.session;
  userSession.userId = null;
  isLoggedin = false;
  console.log("logged out");
  res.redirect("/");
};

const loadCart = async (req, res) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("cart.item.productId");

    res.render("cart", {
      isLoggedin,
      id: userSession.userId,
      cartProducts: completeUser.cart,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadWishlist = async (req, res) => {
  try {
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("wishlist.item.productId");
    console.log(completeUser);
    res.render("wishlist", {
      isLoggedin,
      id: userSession.userId,
      wishlistProducts: completeUser.wishlist,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    userData.addToCart(productData);
    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
};

const editCart = async (req, res) => {
  try {
  
    const id = req.query.id;

    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const foundProduct = userData.cart.item.findIndex(
      (objInItems) => objInItems.productId == id
    );
    const qty = {a: parseInt(req.body.qty)}
  
    userData.cart.item[foundProduct].qty = qty.a
    
    userData.cart.totalPrice = 0;
    const price =userData.cart.item[foundProduct].price
    const totalPrice = userData.cart.item.reduce((acc, curr) => {
      return acc + curr.price * curr.qty;
    }, 0);
    userData.cart.totalPrice = totalPrice;
    await userData.save();
    // res.redirect("/cart");
    res.json({totalPrice,price})
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCart = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    await userData.removefromCart(productId);
    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    userData.addToWishlist(productData);
    console.log(productData);
    res.redirect("/shop");
  } catch (error) {
    console.log(error.messsage);
  }
};

const addCartDeleteWishlist = async (req, res) => {
  try {
    userSession = req.session;
    const productId = req.query.id;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    const add = await userData.addToCart(productData);
    if (add) {
      await userData.removefromWishlist(productId);
    }
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    await userData.removefromWishlist(productId);
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
  }
};

const loadCheckout = async (req, res) => {
  try {
    userSession = req.session;
    const id = req.query.addressid;
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("cart.item.productId");
    if (userSession.userId && completeUser.cart.totalPrice) {
      const addressData = await Address.find({ userId: userSession.userId });
      const selectAddress = await Address.findOne({ _id: id });
      const offer = await Offer.findOne({ _id: userSession.userId });
      console.log(userSession.offer);
      console.log(completeUser);
      console.log(completeUser.cart.totalPrice);

      if (userSession.couponTotal == 0) {
        //update coupon

        userSession.couponTotal = userData.cart.totalPrice;
      }

      res.render("checkout", {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        offer: userSession.offer,
        couponTotal: userSession.couponTotal,
        nocoupon,
        qty: completeUser.cart.item.qty,
        addSelect: selectAddress,
        userAddress: addressData,
      });

      nocoupon = false;
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    userSession = req.session;
    const addressData = Address({
      userId: userSession.userId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      address: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.mno,
    });
    await addressData.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const dashboard = async (req, res) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const orderData = await Order.find({ userId: userSession.userId }).sort({createdAt :-1})
    const addressData = await Address.find({ userId: userSession.userId });
    console.log(orderData);
    console.log(addressData);
    res.render("userDashboard", {
      isLoggedin,
      user: userData,
      userAddress: addressData,
      userOrders: orderData,
      id: userSession.userId,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCoupon = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const offerData = await Offer.findOne({ name: req.body.offer });
      if (offerData) {
        if (offerData.usedBy.includes(userSession.userId)) {
          nocoupon = true;
          res.redirect("/checkout");
        } else {
          userSession.offer.name = offerData.name;
          userSession.offer.type = offerData.type;
          userSession.offer.discount = offerData.discount;
          let updatedTotal =
            userData.cart.totalPrice -
            (userData.cart.totalPrice * userSession.offer.discount) / 100;
          userSession.couponTotal = updatedTotal;
          res.redirect("/checkout");
        }
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/loadCart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const storeOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      // console.log('CompleteUser: ', completeUser)
      userData.cart.totalPrice = userSession.couponTotal;
      const updatedTotal = await userData.save();

      if (completeUser.cart.totalPrice > 0) {
        const order = Order({
          userId: userSession.userId,
          payment: req.body.payment,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          phone: req.body.phone,
          products: completeUser.cart,
          offer: userSession.offer,
          discount: userSession.offer.discount,
        });
        const orderProductStatus = [];
        for (const key of order.products.item) {
          orderProductStatus.push(0);
        }
        order.productReturned = orderProductStatus;

        const orderData = await order.save();
        // console.log(orderData)
        userSession.currentOrder = orderData._id;

        req.session.currentOrder = order._id;

        const ordern = await Order.findById({ _id: userSession.currentOrder });
        const productDetails = await Product.find({ is_available: 1 });
        for (let i = 0; i < productDetails.length; i++) {
          for (let j = 0; j < ordern.products.item.length; j++) {
            if (
              productDetails[i]._id.equals(ordern.products.item[j].productId)
            ) {
              productDetails[i].sales += ordern.products.item[j].qty;
            }
          }
          productDetails[i].save();
        }

        const offerUpdate = await Offer.updateOne(
          { name: userSession.offer.name },
          { $push: { usedBy: userSession.userId } }
        );

        if (req.body.payment == "cod") {
          res.redirect("/orderSuccess");
        } else if (req.body.payment == "RazorPay") {
          res.render("razorpay", {
            isLoggedin,
            userId: userSession.userId,
            total: completeUser.cart.totalPrice,
          });
        } else {
          res.redirect("/checkout");
        }
      } else {
        res.redirect("/shop");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadSuccess = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await Product.find();
      for (const key of userData.cart.item) {
        console.log(key.productId, " + ", key.qty);
        for (const prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.quantity = prod.quantity - key.qty;
            await prod.save();
          }
        }
      }
      await Order.find({
        userId: userSession.userId,
      });
      await Order.updateOne(
        { userId: userSession.userId, _id: userSession.currentOrder },
        { $set: { status: "Build" } }
      );
      await User.updateOne(
        { _id: userSession.userId },
        {
          $set: {
            "cart.item": [],
            "cart.totalPrice": "0",
          },
        },
        { multi: true }
      );
      console.log("Order Built and Cart is Empty.");
    }
    userSession.couponTotal = 0;
    res.render("orderSuccess", {
      orderId: userSession.currentOrder,
      id:userSession.userId,
      isLoggedin,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.id;
      await Order.deleteOne({ _id: id });
      res.redirect("/dashboard");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};



const viewOrder = async (req, res) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const id = req.query.id;
      userSession.currentOrder = id;
      const orderData = await Order.findById({ _id: id });
      const userData = await User.findById({ _id: userSession.userId });
      // const userData = await User.find({ id: userSession.userId })
      console.log(userData);
      await orderData.populate("products.item.productId");
      res.render("viewOrder", {
        isLoggedin,
        order: orderData,
        user: userData,
        id:userSession.userId
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const returnProduct = async (req, res) => {
  try {
    userSession = req.session;
    if ((userSession = req.session)) {
      const id = req.query.id;

      const productOrderData = await Order.findById({
        _id: ObjectID(userSession.currentOrder),
      });
      const productData = await Product.findById({ _id: id });
      if (productOrderData) {
        for (let i = 0; i < productOrderData.products.item.length; i++) {
          if (
            new String(productOrderData.products.item[i].productId).trim() ===
            new String(id).trim()
          ) {
            productData.quantity += productOrderData.products.item[i].qty;
            productOrderData.productReturned[i] = 1;
            await productData.save().then(() => {
              console.log("productData saved");
            });

            await Order.updateOne(
              { userId: userSession.userId, _id: userSession.currentOrder },
              { $set: { status: "Returned" } }
            );
            

            await productOrderData.save().then(() => {
              console.log("productOrderData saved");
              console.log(productOrderData);
            });
          } else {
          }
        }
        res.redirect("/dashboard");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const razorpayCheckout = async (req, res) => {
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const completeUser = await userData.populate("cart.item.productId");
  var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });
  console.log(req.body);
  console.log(completeUser.cart.totalPrice);
  let order = await instance.orders.create({
    amount: completeUser.cart.totalPrice * 100,
    currency: "INR",
    receipt: "receipt#1",
  });
  res.status(201).json({
    success: true,
    order,
  });
};

const forgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword", {
      email: true,
      enterOtp: false,
      changePassword: false,
      success: false,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgotPasswordEmail = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    console.log(userData)
    const otp = sendMessage(userData.mobile, res);
    newOtp = otp;
    console.log("otp:", otp);
    res.render("forgotPassword", {
      email: false,
      enterOtp: true,
      changePassword: false,
      otp: newOtp,
      user: email,
      success: false,
    });
  } catch {}
};

const forgotPasswordOtp = async (req, res) => {
  try {
    const otp = newOtp;
    console.log("OTP: " + otp);
    const userData = req.body.user;
    const otpBody = req.body.otp;
    console.log("otpBody:" + otpBody);
    if (otp == req.body.otp) {
      res.render("forgotPassword", {
        email: false,
        enterOtp: false,
        changePassword: true,
        user: userData,
        success: false,
      });
    } else {
      res.render("verifyOtp", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const password1 = req.body.password1;
    const password2 = req.body.password2;
    const user = req.body.user;
    console.log("user id:" + user);
    const userData = await User.find({ email: user });

    if (userData) {
      if (password1 == password2) {
        const spassword = await securePassword(req.body.password2);

        await User.findOneAndUpdate(
          { email: user },
          {
            $set: {
              password: spassword,
            },
          }
        );
        res.render("forgotPassword", {
          email: false,
          enterOtp: false,
          changePassword: false,
          user: userData,
          success: true,
        });
      }
    }
  } catch (error) {}
};


const editUser = async (req, res) => {
  try {
    userSession = req.session;
    const password1 = req.body.password1
    const password2 = req.body.password2
    const password3 = req.body.password3
    const userData = await User.findById({_id : userSession.userId})
    if (userData) {
      const passwordMatch = await bcrypt.compare(password1, userData.password)
      if (passwordMatch) {
        if(password2 === password3){
        const spassword = await securePassword(req.body.password2)
      await User.findByIdAndUpdate(
        { _id: userSession.userId },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: spassword
          },
        }
      );
      res.redirect('/dashboard');
    }}}
  } catch (error) {
    console.log(error.message);
  }
};






module.exports = {
  loadHome,
  loadUserLogin,
  loadUserRegistration,
  insertUser,
  verifyUserLogin,
  productDetails,
  userLogout,
  loadCart,
  loadWishlist,
  loadShop,
  addToCart,
  editCart,
  deleteCart,
  addToWishlist,
  addCartDeleteWishlist,
  deleteWishlist,
  loadCheckout,
  verifyOtp,
  loadOtp,
  sendMessage,
  addAddress,
  dashboard,
  addCoupon,
  storeOrder,
  loadSuccess,
  cancelOrder,
  viewOrder,
  returnProduct,
  editUser,
  razorpayCheckout,
  forgotPassword,
  forgotPasswordEmail,
  forgotPasswordOtp,
  changePassword,
};
