const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const config = require("./config/database");
const mongoose = require("mongoose");
const session = require("express-session");
const expressValidator = require("express-validator");
const fileUpload = require("express-fileupload");
var passport = require('passport');


mongoose.connect(
  "mongodb://localhost:27017/config",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("DB connected");
    }
  }
);

// .then(()=>{console.log("db Connected");});
mongoose.connection.on("error", (err) => {
  console.log(`DB connection error:${err.message}`);
});
const app = express();

//view engine set-up
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//set public folder
app.use(express.static(path.join(__dirname, "public")));

//setting global errors variable
app.locals.errors = null;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//get page model
var Page = require("./models/page");

//get all pages to pass through pages.ejs
Page.find({})
  .sort({ sorting: 1 })
  .exec(function (err, pages) {
    if (err) {
      console.log(err);
    } else {
      app.locals.pages = pages;
    }
  });

  //get category model
var Category = require("./models/category");

  //get all categories to pass through pages.ejs
Category.find(function (err, categories) {
  if (err) {
    console.log(err);
  } else {
    app.locals.categories = categories;
  }
});

//setting file upload to use
app.use(fileUpload());

//express session middleware
app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
     cookie: { secure: true }
  })
);
//express validator middleware
app.use(
  expressValidator({
    errorFormatter: function (param, msg, value) {
      var namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value,
      };
    },
    customValidators: {
      isImage: function (value, filename) {
        var extension = path.extname(filename).toLowerCase();
        switch (extension) {
          case ".jpg":
            return ".jpg";
          case ".jpeg":
            return ".jpeg";
          case ".png":
            return ".png";
          case "":
            return ".jpg";
          default:
            return false;
        }
      },
    },
  })
);

//express messages middleware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.use("*",function(req,res,next){
  // console.log(req.user);
  
  res.locals.cart = req.session.cart;
  res.locals.users = req.user || null;
  next();
});

const pages = require("./routes/pages.js");
const products = require("./routes/products.js");
const cart = require("./routes/cart.js");
const users = require("./routes/users.js");
const adminPages = require("./routes/admin_pages.js");
const adminCategories = require("./routes/admin_categories.js");
const adminProducts = require("./routes/admin_products.js");

/*use router for different js pages as we have to run the whole code using app.js so all the
 different sections js pages have to be connected here*/
app.use("/admin/pages", adminPages);
app.use("/products", products);
app.use("/admin/categories", adminCategories);
app.use("/cart", cart);
app.use("/users", users);
app.use("/admin/products", adminProducts);
app.use("/", pages);

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
