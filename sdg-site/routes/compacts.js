var request = require('request');
var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var base = new airtable({apiKey:process.env.AIRTABLE_KEY}).base('apppmNzTuAz1IThj2');

router.get('/compacts',
  function(req, res, next) {
    compacts_struct = {};
    base('Compacts').select({
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            var id = record.get('id');
            var year = record.get('year');
            var name = record.get('name');
            compacts_struct[id] = {'year': year, 'name': name};
        });
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
    });
    /* BIG TODO: actually display the compacts on the page!!!!! */
    res.render('compacts', {
      //title: 'SDG Site',
      //lat: 37.3382,
      //lng: -121.8863,
      //key: 'pk.eyJ1Ijoic3RhbmZvcmRzdXMiLCJhIjoiY2pmcjhtenJ5MGh4ZzMycDd0ajkxMHZobiJ9.JU52RKwVG17CJx1Cyj9Siw',
      user: req.session.user
    })
  }
);

module.exports = router;
