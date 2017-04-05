define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/highResViewer/HighResViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');
	
    // var GoogleMapLib = require('react-google-maps');
    // var GoogleMap = GoogleMapLib.GoogleMap;

	var GoogleMapsLoader = require('google-maps'); // only for common js environments 
 
	

	var highResViewerComponent = React.createClass({

		


		componentDidMount: function () {
			GoogleMapsLoader.KEY = 'AIzaSyAtAf8S4uU54ZogtLqbzc8pvQI6phGDL1Q';			

			GoogleMapsLoader.load(function(google) {

				var map = new google.maps.Map(document.getElementById('highResViewer'), {
					center: {lat: 0, lng: 0},
					zoom: 1,
					streetViewControl: false,
					mapTypeControlOptions: {
					mapTypeIds: ['moon']
					}
				});

				var moonMapType = new google.maps.ImageMapType({
					// Normalizes the coords that tiles repeat across the x axis (horizontally)
					// like the standard Google map tiles.
					getNormalizedCoord: function(coord, zoom) {
						var y = coord.y;
						var x = coord.x;

						// tile range in one direction range is dependent on zoom level
						// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
						var tileRange = 1 << zoom;

						// don't repeat across y-axis (vertically)
						if (y < 0 || y >= tileRange) {
							return null;
						}

						// repeat across x-axis
						if (x < 0 || x >= tileRange) {
							x = (x % tileRange + tileRange) % tileRange;
						}

						return {x: x, y: y};
					},

					getTileUrl: function(coord, zoom) {
						var normalizedCoord = this.getNormalizedCoord(coord, zoom);
						if (!normalizedCoord) {
						return null;
						}
						var bound = Math.pow(2, zoom);
						return '//mw1.google.com/mw-planetary/lunar/lunarmaps_v1/clem_bw' +
							'/' + zoom + '/' + normalizedCoord.x + '/' +
							(bound - normalizedCoord.y - 1) + '.jpg';
					},
					tileSize: new google.maps.Size(256, 256),
					maxZoom: 9,
					minZoom: 0,
					radius: 1738000,
					name: 'Moon'
				});

				map.mapTypes.set('moon', moonMapType);
				map.setMapTypeId('moon');

			});

			GoogleMapsLoader.onLoad(function(google) {
				console.log('I just loaded google maps api');
			});
		},

		render: function () {
			return (
				<div id="highResViewer">
				</div>
			)
		}
	});
	return highResViewerComponent;
});
