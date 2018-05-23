var request = require('request');
var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var base = new airtable({apiKey:process.env.AIRTABLE_KEY}).base('apppmNzTuAz1IThj2');

router.get('/view',
  function(req, res, next) {
    compacts_struct = [];
    base('Compacts').select({
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            var id = record.get('id');
            console.log(id);
            var year = record.get('year');
            console.log(year);
            var name = record.get('name');
            console.log(name);
            compacts_struct.push({'id': id, 'year': year, 'name': name});
            console.log(compacts_struct);
        });
        fetchNextPage();

    }, function done(err) {
        if (err) {console.error(err); return; }
        res.render('compacts', {
          compacts: compacts_struct,
          //title: 'SDG Site',
          //lat: 37.3382,
          //lng: -121.8863,
          //key: 'pk.eyJ1Ijoic3RhbmZvcmRzdXMiLCJhIjoiY2pmcjhtenJ5MGh4ZzMycDd0ajkxMHZobiJ9.JU52RKwVG17CJx1Cyj9Siw',
          user: req.session.user
        });
    });
    //compacts_struct.push({'id': 0, 'year': 2010, 'name': 'sample'});
  }
);

module.exports = router;
