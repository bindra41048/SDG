var request = require('request');
var express = require('express');
var router = express.Router();

function is_pos_int(str) {
  return parseInt(str) && parseInt(str) > 0
}

function valid_poverty_parameters(state_fips, county_fips, year) {
  return is_pos_int(state_fips) && is_pos_int(county_fips) &&
    is_pos_int(year);
}

/*
Extract population for each census tract and block level group in a given
county. Example curl request: curl "http://localhost:3000/census/population?state=06&county=061&year=2016" 
*/
router.get('/population', function(req, res, next) {
  var state_fips = req.query.state;
  var county_fips = req.query.county;
  var year = req.query.year;
  if (valid_poverty_parameters(state_fips, county_fips, year)) {
    var url = "https://api.census.gov/data/" + year +
    "/acs/acs5?get=NAME,B01001_001E&for=block%20group:*&in=state:" + state_fips +
    "%20county:" + county_fips;
    request(url, function (error, response, body) {
      if (error) {
        res.status(404).end(err);
      } else {
        // TODO: add processing later to extract fields of interest
        res.status(200).end(body);
      }
    });
  } else {
    res.status(404).end("Invalid parameters passed");
  }
});

module.exports = router;
