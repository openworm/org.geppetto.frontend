define(function (require) {

	require('./GoogleViewer.less');
	var React = require('react');
	var GoogleMapsLoader = require('google-maps');
	var AbstractComponent = require('../../AComponent');

	return class GoogleViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			var _this = this;
			var mapSettings = {
				center: { lat: 0, lng: 0 },
				zoom: 1,
				streetViewControl: false,
				mapTypeControl: false
			};

			var path = this.extractFilesPath(this.props.data);
			var imageMapTypeSettings = {
				getTileUrl: function (coord, zoom) {
					var normalizedCoord = _this.getNormalizedCoord(coord, zoom);
					if (!normalizedCoord) {
						return null;
					}
					var bound = Math.pow(2, zoom);
					return _this.state.path +
						'/' + zoom + '/' + normalizedCoord.x + '/' +
						(bound - normalizedCoord.y - 1) + '.jpg';
				},
				isPng: false,
				maxZoom: 11,
				minZoom: 0,
				radius: 1738000,
				path: path
			}



			this.state = {
				mapSettings: $.extend(mapSettings, this.props.mapSettings),
				imageMapTypeSettings: $.extend(imageMapTypeSettings, this.props.imageMapTypeSettings),
				tileWidth: (this.props.tileWidth != undefined) ? this.props.tileWidth : 256,
				tileHeight: (this.props.tileHeight != undefined) ? this.props.tileHeight : 256,
				path: path
			};
		}

		extractFilesPath(data) {
			var path;
			if (data != undefined) {
				if (data.getMetaType == undefined) {
					path = data;
				}
				else if (data.getMetaType() == "Instance") {
					if (data.getVariable().getInitialValues()[0].value.format == "GOOGLE_MAP") {
						path = data.getVariable().getInitialValues()[0].value.data;
					}
				}
			}
			return path;
		}

		setData(data) {
			this.setState({ path: this.extractFilesPath(data) });
		}

		// Normalizes the coords that tiles repeat across the x axis (horizontally)
		// like the standard Google map tiles.
		getNormalizedCoord(coord, zoom) {
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
		}

		getMap() {
			return this.map;
		}

		setMap(map) {
			this.map = map;
			this.addResizeHandler();
		}

		componentDidMount() {
			var _this = this;
			GoogleMapsLoader.KEY = this.props.googleKey;
			GoogleMapsLoader.load(function (google) {
				var container = document.getElementById(_this.props.id + "_component");

				_this.map = new google.maps.Map(container, _this.state.mapSettings);

				// tileSize: new google.maps.Size(256, 256),
				_this.state.imageMapTypeSettings['tileSize'] = new google.maps.Size(_this.state.tileWidth, _this.state.tileHeight);
				var imageMapType = new google.maps.ImageMapType(_this.state.imageMapTypeSettings);

				_this.map.mapTypes.set('imageMapType', imageMapType);
				_this.map.setMapTypeId('imageMapType');

				$(window).resize(function () {
					google.maps.event.trigger(_this.map, "resize");
				});

				_this.addResizeHandler();


			});

			GoogleMapsLoader.onLoad(function (google) {
				//console.log('I just loaded google maps api');
			});
		}

		addResizeHandler(){
			var _this = this;
			_this.newCenter = null;
			google.maps.event.addListener(_this.map, 'idle', function () {
				if (_this.newCenter== null){
					_this.newCenter = _this.map.getCenter();
				}

			});
			google.maps.event.addListener(_this.map, 'resize', function () {
				setTimeout(function () { _this.map.setCenter(_this.newCenter); }, 200);
			});
		}

		download() {
			//What do we do here?
			console.log("Downloading data...");
		}

		render() {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="googleViewer" style={this.props.style}>
				</div>
			)
		}
	};
});
