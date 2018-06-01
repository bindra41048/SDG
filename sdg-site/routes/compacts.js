var request = require('request');
var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var base = new airtable({apiKey:process.env.AIRTABLE_KEY}).base('apppmNzTuAz1IThj2');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


function packageRecord(record) {
  if (record === 0) {
    return {
      'id': '',
      'indicator': '',
      'metric': '',
      'location': '',
      'amount': '',
      'year': '',
      'milestones': '',
      'last_modified': '',
      'username': ''
    };
  }
  var id = record.id;
  var indicator = record.get('indicator');
  var metric = record.get('metric');
  var amount = record.get('amount');
  var year = record.get('year');
  var location = record.get('location');
  var milestones = record.get('milestones');
  var last_modified = record.get('last_modified');
  var username = record.get('username');
  return {
    'id': id,
    'indicator': indicator,
    'metric': metric,
    'location': location,
    'amount': amount,
    'year': year,
    'milestones': milestones,
    'last_modified': last_modified,
    'username': username
  };
}

router.get('/view',
  function(req, res, next) {
    compacts_struct = [];
    base('Compacts').select({
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            compacts_struct.push(packageRecord(record));
        });
        fetchNextPage();
    }, function done(err) {
        if (err) {console.error(err); return; }
        res.render('compacts', {
          compacts: compacts_struct,
          user: req.session.user
        });
    });
  }
);

router.get('/new',
  function(req, res, next) {
    res.render('new_compact', {
      compact: packageRecord(0),
      user: req.session.user,
      newCompact: true
  });
});

router.post('/new',
  function(req, res, next) {
    var now = new Date();
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var nowString = (days[now.getDay()]);
    nowString += ', ';
    nowString += (months[now.getMonth()]) + ' ' + (now.getDate()) + ', ' + (now.getFullYear());
    base('Compacts').create({
      "indicator": req.body.indicator,
      "metric": req.body.metric,
      "location": req.body.location,
      "amount": req.body.amount,
      "year": req.body.year,
      "milestones": req.body.milestones,
      "last_modified": nowString,
      "user": req.session.user.user_id,
      "username": req.session.user.displayName
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
      var packaged_record = packageRecord(record);
      res.render('one_compact', {
        compact: packaged_record,
        user: req.session.user,
        edit_url: "/compacts/edit/" + id,
        delete_url: "/compacts/delete/" + id,
        userCanEdit: record.get('user') === req.session.user.user_id
      });
    });
});

router.get('/edit/:id',
  function(req, res, next) {
    var id = req.params.id;
    base('Compacts').find(id, function(err, record) {
      if (err) {console.error(err); return;} //need to make more robust
      if (record.get('user') === req.session.user.user_id) {
        res.render('new_compact', {
          compact: packageRecord(record),
          user: req.session.user,
          editCompact: true
        });
      } else {
        res.redirect('/compacts/' + id);
      }
    });
});

router.post('/edit/:id',
  function(req, res, next) {
    var id = req.params.id;
    var now = new Date();
    base('Compacts').update(id, {
      "indicator": req.body.indicator,
      "metric": req.body.metric,
      "location": req.body.location,
      "milestones": req.body.milestones,
      "last_modified": now.toString(),
    }, function (err, record) {
      if (err) { console.error(err); return; } //need to make more robust
    });
    res.redirect('/compacts/' + id);
    //TODO: validate lol
});

router.get('/delete/:id', function(req, res, next) {
   var id = req.params.id;
   base('Compacts').find(id, function (err, record) {
     if (err) { console.error(err); return; } //make more robust
     if (record.get('user') === req.session.user.user_id) {
       base('Compacts').destroy(id, function(err, record) {
         if (err) { console.error(err); return; } //need to make more robust
       });
     }
   });
   res.redirect('/compacts/view');
});

module.exports = router;
