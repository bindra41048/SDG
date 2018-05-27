var async = require('async');
var request = require('request');
var express = require('express');
var router = express.Router();
var airtable = require('airtable');
var base = new airtable({apiKey:process.env.AIRTABLE_KEY}).base('apppmNzTuAz1IThj2');
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
function populate_neighborhood_metrics(nb_to_bg, neighborhood_metrics, bg_to_metric, year) {
  for (var neighborhood in nb_to_bg) {
    var block_groups = nb_to_bg[neighborhood];
    var metric_aggregate = 0;
    var population_aggregate = 0;
    for (var i = 0; i < block_groups.length; i++) {
      var block = block_groups[i];
      var metric = bg_to_metric[block]["metric"][year];
      var population = bg_to_metric[block]["population"];
      metric_aggregate += metric;
      population_aggregate += population;
    }
    if (!neighborhood_metrics.hasOwnProperty(neighborhood)) {
      neighborhood_metrics[neighborhood] = {};
    }
    neighborhood_metrics[neighborhood][year] = metric_aggregate / population_aggregate;
  }
}

function populate_metric_mapping(block_group_stats, bg_to_metric, year) {
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
    if (!bg_to_metric[block_group_id].hasOwnProperty["metric"]) {
      bg_to_metric[block_group_id]["metric"] = {};
    }
    bg_to_metric[block_group_id]["metric"][year] = 100 * Number(bg_metric);
  }
}

function update_geojson(santa_clara_percentage, national_percentage, geojson, metrics, year) {
  for (var i = 0; i < geojson.features.length; i++) {
    var neighborhood = geojson.features[i]["properties"]["NGBRHD2"];
    var matching_metric = metrics[neighborhood][year];
    if (!geojson.features[i]["properties"].hasOwnProperty("metric")) {
        geojson.features[i]["properties"]["metric"] = {};
    }
    if (!geojson.features[i]["properties"].hasOwnProperty("county_metric")) {
        geojson.features[i]["properties"]["county_metric"] = {};
    }
    if (!geojson.features[i]["properties"].hasOwnProperty("national_metric")) {
        geojson.features[i]["properties"]["national_metric"] = {};
    }
    geojson.features[i]["properties"]["metric"][year] = matching_metric;
    // note: it is redundant to add the national and county level metrics to each block group's data
    // but is done for simplicity of creating the chartJS charts.
    geojson.features[i]["properties"]["county_metric"][year] = santa_clara_percentage;
    geojson.features[i]["properties"]["national_metric"][year] = national_percentage;
  }
}

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

function get_metric_percentage(aggregated_stats) {
  var metric = aggregated_stats[1][metric_index];
  var population = aggregated_stats[1][population_index];
  return 100 * Number(metric) / Number(population);
}

function pull_yearly_data(year, callback, block_group_url, county_url, national_url, neighborhood_geometry) {
  request(block_group_url, function(error, block_resp, block_body) {
    if (error) {
      response.status(404).end(error);
    } else {
      request(county_url, function(county_error, county_resp, county_body) {
        if (county_error) {
          county_resp.status(404).end(county_error);
        } else {
          request(national_url, function(national_error, national_resp, national_body) {
            if (national_error) {
              national_resp.status(404).end(national_error);
            } else {
              var santa_clara_stats = JSON.parse(county_body);
              var national_stats = JSON.parse(national_body);
              var santa_clara_percentage = get_metric_percentage(santa_clara_stats);
              var national_percentage = get_metric_percentage(national_stats);
              var block_group_stats = JSON.parse(block_body);
              var bg_to_metric = {};
              var nb_to_bg = {};
              var neighborhood_metrics = {};
              populate_metric_mapping(block_group_stats, bg_to_metric, year);
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
                  populate_neighborhood_metrics(nb_to_bg, neighborhood_metrics, bg_to_metric, year);
                  update_geojson(santa_clara_percentage, national_percentage, neighborhood_geometry, neighborhood_metrics, year);
                  //signifies completion of computation for given year (required for async.each)
                  callback();
                }
              });
            }
          });
        }
      });
    }
  });
}

//example curl "http://localhost:3000/census/sjhistory?start_year=2015&end_year=2016&tag=B17021_002E"
router.get('/sjhistory', function(req, res, next) {
  var neighborhood_geometry = Object.assign({}, neighborhood_geojson);
  var start_year = req.query.start_year;
  var end_year = req.query.end_year;
  var tag = req.query.tag;
  if (!is_pos_int(start_year) || !is_pos_int(end_year) || !tag || Number(start_year) > Number(end_year)) {
    res.status(404).end("Invalid parameters passed");
    return;
  }
  var years = {};
  for (var i = Number(start_year); i <= Number(end_year); i++) {
    years[i.toString()] = {};
  }
  async.forEachOf(years, function(value, year, callback) {
    var block_group_url = "";
    county_url = "";
    national_url = "";
    if (Number(year) >= 2015) {
      block_group_url += "https://api.census.gov/data/" + year + "/acs/acs5?";
    } else {
      block_group_url += "https://api.census.gov/data/" + year + "/acs5?";
    }
    block_group_url += "get=NAME," + tag + "," + population_tag;
    county_url += block_group_url;
    national_url += block_group_url;
    block_group_url += "&for=block%20group:*&in=state:" + ca_fips + "%20county:" + santa_clara_fips;
    county_url += "&for=county:" + santa_clara_fips + "&in=state:" +
      ca_fips;
    national_url += "&for=us:*";
    pull_yearly_data(year, callback, block_group_url, county_url, national_url, neighborhood_geometry);
  }, function (err) {
    if (err) {
      res.status(404).end(err);
    } else {
      res.status(200).end(JSON.stringify(neighborhood_geometry));
    }
  });
});

module.exports = router;
