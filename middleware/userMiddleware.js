const session = require("express-session");
const { findById } = require("../model/productModel");
const User = require('../model/userModel');

let userSession = false || {};
let isLoggedin;

const isLogin = async (req, res, next) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      userData = await User.findById({ _id : userSession.userId})
      if(userData.isVerified){
      console.log(userData)
      next();
    }else{
      userSession.userId = null;
      res.redirect("/login")
      
    }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isVerified = async  (req, res, next) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId })
    if(userData.isVerified){
      next();
    } else {
      isLoggedin = false;
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
}


const isLogout = async (req, res, next) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      isLoggedin = false;
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

// const isLogin = async (req, res, next) => {
//   console.log(req.session.isLoggedIn)
//   try {
//       console.log('try')
//       if (req.session.isLoggedIn) {
//           console.log(req.session.isLoggedIn)
//           next()
//       } else {
//           console.log('catch')
//           res.render('login')
//       }
//   } catch (error) {
//       console.log(error.message)
//   }
// }

// const isLogout = async (req, res, next) => {
//   try {
//       if (req.session.isLoggedIn) {
//           res.render('/')
//       }
//       next()
//   } catch (error) {
//       console.log(error.message)
//   }
// }

module.exports = {
  isLogin,
  isLogout,
  isVerified,
  isLoggedin,
  userSession
};

// module.exports = {
//   isLogin,
//   isLogout
// }
