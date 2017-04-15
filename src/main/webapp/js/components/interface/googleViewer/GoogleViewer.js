define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/googleViewer/GoogleViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');

	var GoogleMapsLoader = require('google-maps');
	var googleViewerComponent = React.createClass({

		// getInitialState: function () {
        //     return {}
		// },

		shouldComponentUpdate() {
			return false;
		},

		componentDidMount: function () {
			GoogleMapsLoader.KEY = 'AIzaSyAtAf8S4uU54ZogtLqbzc8pvQI6phGDL1Q';

			var _this = this;			

			GoogleMapsLoader.load(function(google) {

				var container = document.getElementById(_this.props.id + "_component");

				var map = new google.maps.Map(container, {
					center: {lat: 0, lng: 0},
					zoom: 1,
					streetViewControl: false,
					mapTypeControlOptions: {
					mapTypeIds: ['hm']
					}
				});

				var centreLat = 66.70383915858723;
    			var centreLon = -48.1640625;

				var imageMapType = new google.maps.ImageMapType({
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

					// getTileUrl: function(coord, zoom) {
					// 	var normalizedCoord = this.getNormalizedCoord(coord, zoom);
					// 	if (!normalizedCoord) {
					// 	return null;
					// 	}
					// 	var bound = Math.pow(2, zoom);
					// 	return '//mw1.google.com/mw-planetary/lunar/lunarmaps_v1/clem_bw' +
					// 		'/' + zoom + '/' + normalizedCoord.x + '/' +
					// 		(bound - normalizedCoord.y - 1) + '.jpg';
					// },
					getTileUrl: function(a, b) {
						// pervent wrap around
						if (a.y < 0 || a.y >= (1 << b)) {
							return null;
						}
						if (a.x < 0 || a.x >= (1 << b)) {
							return null;
						}
						var c = Math.pow(2, b);
						var d = a.x;
						var e = a.y;
						var f = "t";
						for (var g = 0; g < b; g++) {
							c = c / 2;
							if (e < c) {
								if (d < c) { f += "q" }
								else { f += "r"; d -= c }
							} else {
								if (d < c) { f += "t"; e -= c }
								else { f += "s"; d -= c; e -= c }
							}
						}
						subdirs = 3;
						tmp = "";
						if (f.length >= subdirs) { // subdivide into sub-directories
							for (i = 0; i < subdirs; i++) {
								tmp += f.charAt(i) + "/";
							}
						}
						tmp += f;
						return _this.props.path + "/" + tmp + ".jpg";
					},
					center: new google.maps.LatLng(50, 50),
					tileSize: new google.maps.Size(256, 256),
					isPng: false,
					maxZoom: 11,
					minZoom: 0,
					radius: 1738000
					// name: 'HM'
				});

				map.mapTypes.set('imageMapType', imageMapType);
				map.setMapTypeId('imageMapType');

			});

			GoogleMapsLoader.onLoad(function(google) {
				//console.log('I just loaded google maps api');
			});
		},

		render: function () {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="googleViewer">
				</div>
			)
		}
	});
	return googleViewerComponent;
});
