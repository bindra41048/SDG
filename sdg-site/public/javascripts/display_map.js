/* this doesn't work in a separate js file yet */
var map = L.map('map').setView([{{lat}}, {{lng}}], 11);

L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var base = 'shapefiles/cb_2017_us_county_5m.zip';
var shpfile = new L.Shapefile(base);
shpfile.addTo(map);

//L.geoJson(us_counties).addTo(map);
