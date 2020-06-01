var express = require("express");
var router = express.Router();
var mkdirp = require("mkdirp");
var fs = require("fs-extra");
var resizeImg = require("resize-img");
var path = require("path");
// Get Product model
var Product = require("../models/product");

// Get Category model
var Category = require("../models/category");

/*
 * GET products index
 */
router.get("/", function (req, res) {
  var count;

  Product.count(function (err, c) {
    count = c;
  });

  Product.find(function (err, products) {
    res.render("admin/products", {
      products: products,
      count: count,
    });
  });
});

/*
 * GET add product
 */
router.get("/add-product", function (req, res) {
  var title = "";
  var desc = "";
  var price = "";

  Category.find(function (err, categories) {
    res.render("admin/add_product", {
      title: title,
      desc: desc,
      categories: categories,
      price: price,
    });
  });
});

/*
 * POST add product
 */
router.post("/add-product", function (req, res) {
  if (!req.files) {
    imageFile = "";
  }
  if (req.files) {
    var imageFile =
      typeof req.files.image !== "undefined" ? req.files.image.name : "";
  }

  req.checkBody("title", "Title must have a value.").notEmpty();
  req.checkBody("desc", "Description must have a value.").notEmpty();
  req.checkBody("price", "Price must have a value.").isDecimal();
  req.checkBody("image", "You must upload an image").isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, "-").toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;

  var errors = req.validationErrors();

  if (errors) {
    Category.find(function (err, categories) {
      res.render("admin/add_product", {
        errors: errors,
        title: title,
        desc: desc,
        categories: categories,
        price: price,
      });
    });
  } else {
    Product.findOne({ slug: slug }, function (err, product) {
      if (product) {
        req.flash("danger", "Product title exists, choose another.");
        Category.find(function (err, categories) {
          res.render("admin/add_product", {
            title: title,
            desc: desc,
            categories: categories,
            price: price,
          });
        });
      } else {
        var price2 = parseFloat(price).toFixed(2);

        var product = new Product({
          title: title,
          slug: slug,
          desc: desc,
          price: price2,
          category: category,
          image: imageFile,
        });
        product.save(function (err) {
          if (err) return console.log(err);

          console.log("creating dir");
          const address =
            __dirname + "/../public/product_images/" + product._id;
          fs.mkdir(address, { recursive: true }, (err) => {
            if (err) {
              console.log(err);
            } else {
              if (imageFile != "") {
                var productImage = req.files.image;
                var imagePath = path.join(address, imageFile);

                fs.appendFile(imagePath, productImage.data, function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("picture saved");
                  }
                });
              }
            }
          });
          req.flash("success", "Product added!");
          res.redirect("/admin/products");
        });
      }
    });
  }
});

/*
 * GET edit product
 */
router.get("/edit-product/:id", function (req, res) {
  var errors;

  if (req.session.errors) errors = req.session.errors;
  req.session.errors = null;

  Category.find({}, function (err, categories) {
    Product.findById(req.params.id, function (err, p) {
      if (err) {
        console.log(err);
        res.redirect("/admin/products");
      } else {
        var galleryDir = __dirname + "/../public/product_images/" + p._id;
        var galleryImages = null;

        fs.readdir(galleryDir, function (err, files) {
          if (err) {
            console.log(err);
          } else {
            galleryImages = files;
            res.render("admin/edit_product", {
              title: p.title,
              errors: errors,
              desc: p.desc,
              categories: categories,
              category: p.category.replace(/\s+/g, "-").toLowerCase(),
              price: parseFloat(p.price).toFixed(2),
              image: p.image,
              galleryImages: galleryImages,
              id: p._id,
            });
          }
        });
      }
    });
  });
});

/*
 * POST edit product
 */
router.post("/edit-product/:id", function (req, res) {
  if (!req.files) {
    imageFile = "";
  }
  if (req.files) {
    var imageFile =
      typeof req.files.image !== "undefined" ? req.files.image.name : "";
  }

  req.checkBody("title", "Title must have a value.").notEmpty();
  req.checkBody("desc", "Description must have a value.").notEmpty();
  req.checkBody("price", "Price must have a value.").isDecimal();
  req.checkBody("image", "You must upload an image").isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, "-").toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;
  var pimage = req.body.pimage;
  var id = req.params.id;

  var errors = req.validationErrors();

  if (errors) {
    req.session.errors = errors;
    res.redirect("/admin/products/edit-product/" + id);
  } else {
    Product.findOne({ slug: slug, _id: { $ne: id } }, function (err, p) {
      if (err) console.log(err);

      if (p) {
        req.flash("danger", "Product title exists, choose another.");
        res.redirect("/admin/products/edit-product/" + id);
      } else {
        Product.findById(id, function (err, p) {
          if (err) console.log(err);

          p.title = title;
          p.slug = slug;
          p.desc = desc;
          p.price = parseFloat(price).toFixed(2);
          p.category = category;
          if (imageFile != "") {
            p.image = imageFile;
          }

          p.save(function (err) {
            if (err) console.log(err);
            const address = `${__dirname}/../public/product_images/${p._id}`;
           

              if (imageFile != "") {
                if (pimage != "") {
                fs.unlink(
                  `${__dirname}/../public/product_images/${id}/${pimage}`,
                  function (err) {
                    if (err) console.log(err);
                })
              }
              
              fs.mkdir(address, { recursive: true }, (err) => {
                if (err) {
                  console.log(err);
                } else {
                  if (imageFile != "") {
                    var productImage = req.files.image;
                    var imagePath = path.join(address, imageFile);

                    fs.appendFile(imagePath, productImage.data, function (err) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log("picture saved");
                      }
                    });
                  }
                }
              });
            }

            req.flash("success", "Product edited!");
            res.redirect("/admin/products/");
          });
        });
      }
    });
  }
});

/*
 * POST product gallery
 */
router.post("/product-gallery/:id", function (req, res) {
  var productImage = req.files.file;
  var id = req.params.id;

  var imagePath = `${__dirname}/../public/product_images/${id}/${productImage.name}`;

  fs.appendFile(imagePath, productImage.data, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("picture saved");
    }
  });

  res.sendStatus(200);
});

/*
 * GET delete image
 */
router.get("/delete-image/:image", function (req, res) {
  var originalImage = `${__dirname}/../public/product_images/${req.query.id}/${req.params.image}`;

  fs.unlink(originalImage, function (err) {
    if (err) {
      console.log(err);
    } else {
      req.flash("success", "Image deleted!");
      res.redirect("/admin/products/edit-product/" + req.query.id);
    }
  });
});

/*
 * GET delete product
 */
router.get("/delete-product/:id", function (req, res) {
  var id = req.params.id;
  var path = `${__dirname}/../public/product_images/${id}`;

  fs.unlink(path, function (err) {
    if (err) {
      console.log(err);
    } else {
      Product.findByIdAndRemove(id, function (err) {
        console.log(err);
      });

      req.flash("success", "Product deleted!");
      res.redirect("/admin/products");
    }
  });
});

// Exports
module.exports = router;
