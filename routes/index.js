var express = require('express');
const fs = require('fs')
var cal = require("../jsmodules/createics")
var mainMods = require("../jsmodules/DCBBOOKINGS/mainjsmodules_For_DCBOOKINGS")
var router = express.Router();
var moment = require('moment');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Calendar ICS Subscription Service' });
});

router.get('/TestLink', function(req, res, next) {
    res.send("ICS Subscription Service Online");
});


module.exports = router;
