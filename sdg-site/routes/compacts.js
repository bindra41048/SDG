var request = require('request');
var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var base = new airtable({apiKey:process.env.AIRTABLE_KEY}).base('apppmNzTuAz1IThj2');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


router.get('/view',
  function(req, res, next) {
    compacts_struct = [];
    base('Compacts').select({
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            console.log(record.id);
            var id = record.id;
            var year = record.get('year');
            var name = record.get('name');
            compacts_struct.push({'id': id, 'year': year, 'name': name});
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

router.get('/new',
  function(req, res, next) {
    res.render('new_compact', {
      user: req.session.user
  });
});

router.post('/new',
  function(req, res, next) {
    base('Compacts').create({
      "year": req.body.year_field,
      "name": req.body.name_field
    }, function (err, record) {
      if (err) { console.error(err); return; } //need to make more robust
      //console.log(record.getId());
    });
    res.redirect('view');
    //TODO: validate lol
});

router.get('/:id',
  function(req, res, next) {
    var id = req.params.id;
    base('Compacts').find(id, function(err, record) {
      if (err) {console.error(err); return;} //need to make more robust
      res.render('one_compact', {
        compact: {'id': id, 'year': record.get('year'), 'name': record.get('name')},
        user: req.session.user,
        edit_url: "/compacts/edit/" + id
      });
    });
});

router.get('/edit/:id',
  function(req, res, next) {
    var id = req.params.id;
    base('Compacts').find(id, function(err, record) {
      if (err) {console.error(err); return;} //need to make more robust
      res.render('edit_compact', {
        compact: {'id': id, 'year': record.get('year'), 'name': record.get('name')},
        user: req.session.user
      });
    });
});

router.post('/edit/:id',
  function(req, res, next) {
    var id = req.params.id;
    base('Compacts').update(id, {
      "year": req.body.year_field,
      "name": req.body.name_field
    }, function (err, record) {
      if (err) { console.error(err); return; } //need to make more robust
    });
    res.redirect('/compacts/' + id);
    //TODO: validate lol
});

module.exports = router;
