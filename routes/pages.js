var express = require("express");
var router = express.Router();

// Get Page model
var Page = require("../models/page");
var Category = require("../models/category");
/*
 * GET /
 */
router.get("/", function (req, res) {
  Page.findOne({ slug: "home" }, function (err, page) {
    if (err) console.log(err);
    Category.find(function (err, categories) {
      if (err) return console.log(err);
      // console.log(res.locals.user);
      
      res.render("index", {
        title: page.title,
        content: page.content,
        user: req.user,
        categories: categories,
      });
    });
  });
});

/*
 * GET a page
 */
router.get("/:slug", function (req, res) {
  var slug = req.params.slug;

  Page.findOne({ slug: slug }, function (err, page) {
    if (err) console.log(err);

    if (!page) {
      res.redirect("/");
    } else {
      console.log(res.locals.user);

      res.render("index", {
        title: page.title,
        content: page.content,
        user: res.locals.user
      });
    }
  });
});

// Exports
module.exports = router;
