const most_recent_year = 2016;
const oldest_year = 2010;

var map;

function displayMap(lat, lng, tag, chartOptions, getColor) {
  if (map) {
    map.remove();
  }
  map = L.map('map').setView([lat, lng], 11);

  L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  var info = L.control();
  var geojson;
  /*
   * Original county boundaries - commenting out for now to use SJ neighborhood boundaries
  var base = 'shapefiles/cb_2017_us_county_5m.zip';
  var shpfile = new L.Shapefile(base);
  shpfile.addTo(map);
  */


  // NOTE: most of code below is taken from/ adapted from Leaflet tutorial on geojson.
  // See here: https://leafletjs.com/examples/choropleth/

  // sets style of map
  function style(feature) {
    return {
      fillColor: getColor(feature["properties"]["metric"][most_recent_year]),
      weight: 2,
      opacity: 0.5,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.4
    };
  }

  // highlights neighborhood when selected on map.
  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties);
  }

  //undoes highlight
  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  function updateChart(props) {
    if (!props) {
      return;
    }
    years = [];
    metric_level = [];
    national_metric_level = [];
    county_metric_level = [];
    for (var year in props["metric"]) {
      years.push(year);
      metric_level.push(props["metric"][year]);
      national_metric_level.push(props["national_metric"][year]);
      county_metric_level.push(props["county_metric"][year]);
    }
    new Chart(document.getElementById("myChart"), {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            data: metric_level,
            label: props.NGBRHD2,
            fill: false,
            borderColor: "red",
          },
          {
            data: county_metric_level,
            label: "Santa Clara County",
            fill: false,
            borderColor: "blue"
          },
          {
            data: national_metric_level,
            label: "US",
            fill: false,
            borderColor: "green"
          },
        ]
      },
      options: chartOptions
    });
  }

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
    if (props) {
      this._div.innerHTML = "<h4>" + props.NGBRHD2 + "</h4>";
      updateChart(props);
    }
  };

  info.addTo(map);

  /*
   * HTTP request to get poverty metric.
   * TODO: generalize this to work for any metric
   */
  xhr = new XMLHttpRequest();
  xhr.onreadystatechange = xhrHandler;
  xhr.open("GET", "/census/sjhistory?start_year=" + oldest_year.toString() +
    "&end_year=" + most_recent_year.toString() + "&tag=" + tag);
  xhr.send();

  // handles HTTP responses
  function xhrHandler() {
    if (this.readyState != 4) { // states response received
      return;
    }
    if (this.status != 200) { // error condition
      return;
    }
    var neighborhood_metrics = JSON.parse(this.responseText);
    geojson = L.geoJson(
      neighborhood_metrics,
      {
        style:style,
        onEachFeature: onEachFeature
      }
    ).addTo(map);
  }
}

function displayPoverty(lat, lng) {
  document.getElementById("metricName").innerHTML = "Poverty";
  var chartOptions = {
    title: {
      display: true,
      text: 'Poverty rate over time'
    },
    scales: {
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: "% under Poverty Line"
        }
      }]
    }
  };
  function colorThresholds(d) {
      return d > 40 ? '#800026' :
            d > 30  ? '#BD0026' :
            d > 20  ? '#E31A1C' :
            d > 15  ? '#FC4E2A' :
            d > 10   ? '#FD8D3C' :
            d > 5   ? '#FEB24C' :
            d > 0   ? '#FED976' :
                      '#FFEDA0';
  };
  displayMap(lat, lng, "B17021_002E", chartOptions, colorThresholds);
}

function displayCommute(lat, lng) {
  document.getElementById("metricName").innerHTML = "Commute";
  var chartOptions = {
    title: {
      display: true,
      text: 'Commute mode over time'
    },
    scales: {
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: "% of population driving to work alone"
        }
      }]
    }
  };
  function colorThresholds(d) {
      return d > 50 ? '#800026' :
            d > 46  ? '#BD0026' :
            d > 42  ? '#E31A1C' :
            d > 38  ? '#FC4E2A' :
            d > 34   ? '#FD8D3C' :
            d > 30   ? '#FEB24C' :
            d > 26   ? '#FED976' :
                      '#FFEDA0';
  };
  displayMap(lat, lng, "B08301_003E", chartOptions, colorThresholds,)
}

//county comparison: https://api.census.gov/data/2016/acs/acs5?get=NAME,B17021_002E&for=county:085&in=state:06
