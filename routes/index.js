var express = require('express');
var router = express.Router();
var conString = "";
var obj = "1";


var appName = "Find Your Home";

router.get('/', function(req, res, next) {
    res.render('index', { title: appName});
});

module.exports = router;
