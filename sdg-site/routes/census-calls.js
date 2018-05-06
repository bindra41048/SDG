var request = require('request');
var express = require('express');
var router = express.Router();
const base = require('airtable').base('apppmNzTuAz1IThj2');
const ca_fips = "06";
const santa_clara_fips = "085";
const neighborhood_tag = "NGBRHD2";
const block_group_tag = "spatial_id";
const population_tag = "B01001_001E";

//indices refer to block_group_stats, a 2D array where each array contains data on a given block group of the form
// ["NAME","Metric", "Population","state","county","tract","block group"],
const metric_index = 1;
const population_index = 2;
const tract_index = 5;
const bg_index = 6;
const neighborhood_geojson_path = "./../public/javascripts/neighborhood.json";

var neighborhood_geojson = require(neighborhood_geojson_path);


function is_pos_int(str) {
  return parseInt(str) && parseInt(str) > 0
}

function valid_parameters(state_fips, county_fips, year) {
  return is_pos_int(state_fips) && is_pos_int(county_fips) &&
    is_pos_int(year);
}

function add_record_to_mapping(nb_to_bg, record) {
  var neighborhood = record.get(neighborhood_tag);
  var block_group = record.get(block_group_tag).substring(5);
  if (!nb_to_bg.hasOwnProperty(neighborhood)) {
    nb_to_bg[neighborhood] = []
  }
  nb_to_bg[neighborhood].push(block_group);
}

/*
 * Calculate metric at the neighborhood level (each neighborhood is an aggregation
 * of Census block groups). To do so, we assume that the metric is a raw count, and
 * compute the rate of incidence of the metric as the sum of counts of block groups in
 * the neighborhood divided by their total population.
*/
function populate_neighborhood_metrics(nb_to_bg, neighborhood_metrics, bg_to_metric) {
  for (var neighborhood in nb_to_bg) {
    var block_groups = nb_to_bg[neighborhood];
    var metric_aggregate = 0;
    var population_aggregate = 0;
    for (var i = 0; i < block_groups.length; i++) {
      var block = block_groups[i];
      var metric = bg_to_metric[block]["metric"];
      var population = bg_to_metric[block]["population"];
      metric_aggregate += metric;
      population_aggregate += population;
    }
    neighborhood_metrics[neighborhood] = metric_aggregate / population_aggregate;
  }
}

function populate_metric_mapping(block_group_stats, bg_to_metric) {
  //block_group_stats is a 2D array where each array contains data on a given block group of the form
  // ["NAME","Metric", "Population","state","county","tract","block group"],
  for (var i = 1; i < block_group_stats.length; i++) {
    var bg_metric = block_group_stats[i][metric_index];
    var population = block_group_stats[i][population_index];
    var tract = block_group_stats[i][tract_index];
    var block_group_num = block_group_stats[i][bg_index];
    var block_group_id = tract + block_group_num;
    bg_to_metric[block_group_id] = {};
    bg_to_metric[block_group_id]["population"] = Number(population);
    bg_to_metric[block_group_id]["metric"] = 100 * Number(bg_metric);
  }
}

function update_geojson(geojson, metrics) {
  for (var i = 0; i < geojson.features.length; i++) {
    var neighborhood = geojson.features[i]["properties"]["NGBRHD2"];
    var matching_metric = metrics[neighborhood];
    geojson.features[i]["properties"]["metric"] = matching_metric;
  }
}


/*
 * Extract metric for all neighborhoods in SJ county as weighted average of block group level metrics.
 * Based on neighborhood to block group mapping provided by Santa Clara.
 * Example curl request: curl "http://localhost:3000/census/sjneighborhoods?year=2016&tag=B17021_002E"
 * where metric is number under poverty
 */
router.get('/sjneighborhoods', function(req, res,next) {
  var neighborhood_geometry = Object.assign({}, neighborhood_geojson);
  var year = req.query.year;
  var tag = req.query.tag;
  var nb_to_bg = {};
  var neighborhood_metrics = {}
  // sanity check - make sure year passed in and tag are valid
  if (is_pos_int(year) && tag) {
    var url = "https://api.census.gov/data/" + year +
      "/acs/acs5?get=NAME," + tag + "," + population_tag + "&for=block%20group:*&in=state:" + ca_fips +
      "%20county:" + santa_clara_fips;
    request(url, function(error, response, body) {
      if (error) {
        res.status(404).end(error);
      } else {
        var block_group_stats = JSON.parse(body);
        var bg_to_metric = {};
        populate_metric_mapping(block_group_stats, bg_to_metric);

        // extract full list of records of block group to neighborhood
        base('Neighborhoods').select({
          view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach(function(record) {
            add_record_to_mapping(nb_to_bg, record);
          });
          // retrieves next page of records until no records remain
          fetchNextPage();
        }, function done(err) {
          if (err) {
            res.status(404).end(err);
          } else {
            populate_neighborhood_metrics(nb_to_bg, neighborhood_metrics, bg_to_metric);
            update_geojson(neighborhood_geometry, neighborhood_metrics);
            res.status(200).end(JSON.stringify(neighborhood_geometry));
          }
        });
      }
    });
  } else {
    res.status(400).end("Invalid year and tag parameters passed");
  }
});



/*
Extract population for each census tract and block level group in a given
county. Example curl request: curl "http://localhost:3000/census/block?state=06&county=061&year=2016&tag=tag=B17021_002E"
*/
router.get('/block', function(req, res, next) {
  var state_fips = req.query.state;
  var county_fips = req.query.county;
  var year = req.query.year;
  var tag = req.query.tag;
  if(valid_parameters(state_fips, county_fips, year)) {
    var url = "https://api.census.gov/data/" + year +
    "/acs/acs5?get=NAME," + tag + "&for=block%20group:*&in=state:" + state_fips +
    "%20county:" + county_fips;
    request(url, function(error, response, body) {
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
