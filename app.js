const express = require('express')
const app = express()
const adminRoute = require('./routes/adminRoute')
const user_route = require('./routes/userRoute')


require('dotenv').config();

const mongoose = require("mongoose")
const DB = process.env.DBURL
mongoose.connect(DB,()=>{
    console.log("Database is connected.")
})

const session = require('express-session')
const config = require('./config/config')
 app.use(session({secret:config.sessionSecret}))

// adminRoute.set(session({ 
//     secret: config.sessionSecret,
        
// }));

// user_route.set(
//     session({
//       secret: config.sessionSecret,
     
//     })
//   );

app.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')
user_route.set('views', './views/user')

app.use('/', express.static('public'))
app.use('/', express.static('public/assets'))
app.use('/admin', express.static('public/admin'))


// const bcrypt = require('bcrypt')
// const path = require('path')






app.set('view-engine', 'ejs')


app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use('/admin', adminRoute)
app.use('/', user_route)



//for user routes
// const userRoute = require('./routes/userRoute')
// app.use('/', userRoute)

//for admin routes
// const adminRoute = require('./routes/adminRoute')
// app.use('/admin', adminRoute)


app.listen(4000, function(){
    console.log("server is running")
})
