define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/interface/googleViewer/GoogleViewer.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');

	var GoogleMapsLoader = require('google-maps');
	var googleViewerComponent = React.createClass({

		getInitialState: function () {
			var _this = this;
			var mapSettings = {
				center: { lat: 0, lng: 0 },
				zoom: 1,
				streetViewControl: false,
				mapTypeControl: false
			}

			var imageMapTypeSettings = {
				getTileUrl: function (coord, zoom) {
					var normalizedCoord = _this.getNormalizedCoord(coord, zoom);
					if (!normalizedCoord) {
						return null;
					}
					var bound = Math.pow(2, zoom);
					return  _this.state.path +
						'/' + zoom + '/' + normalizedCoord.x + '/' +
						(bound - normalizedCoord.y - 1) + '.jpg';
				},
				isPng: false,
				maxZoom: 11,
				minZoom: 0,
				radius: 1738000
			}

			return {
				mapSettings: $.extend(mapSettings, this.props.mapSettings),
				imageMapTypeSettings: $.extend(imageMapTypeSettings, this.props.imageMapTypeSettings),
				tileWidth: (this.props.tileWidth != undefined)?this.props.tileWidth:256 ,
				tileHeight: (this.props.tileHeight != undefined)?this.props.tileHeight:256,
				path: this.props.path
			};
		},

		shouldComponentUpdate() {
			return false;
		},

		// Normalizes the coords that tiles repeat across the x axis (horizontally)
		// like the standard Google map tiles.
		getNormalizedCoord: function (coord, zoom) {
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

			return { x: x, y: y };
		},

		componentDidMount: function () {
			var _this = this;
			GoogleMapsLoader.KEY = this.props.googleKey;
			GoogleMapsLoader.load(function (google) {
				var container = document.getElementById(_this.props.id + "_component");

				var map = new google.maps.Map(container, _this.state.mapSettings);

				// tileSize: new google.maps.Size(256, 256),
				_this.state.imageMapTypeSettings['tileSize'] = new google.maps.Size(_this.state.tileWidth, _this.state.tileHeight);
				var imageMapType = new google.maps.ImageMapType(_this.state.imageMapTypeSettings);

				map.mapTypes.set('imageMapType', imageMapType);
				map.setMapTypeId('imageMapType');

			});

			GoogleMapsLoader.onLoad(function (google) {
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
