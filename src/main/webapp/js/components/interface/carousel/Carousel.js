define(function (require) {

	require("./vendor/slick.css");
	require("./vendor/slick-theme.less");
	var React = require('react');
	var Slider = require('react-slick').default;
	
	var AbstractComponent = require('../../AComponent');

	return class Carousel extends AbstractComponent {

		constructor(props) {
			super(props);

			var settings = {
				infinite: false,
				speed: 500,
				slidesToShow: 1
			};

			this.state = {
				settings: $.extend(settings, props.settings),
				files: props.files
			};

			this.download = this.download.bind(this);
		}

		componentDidMount() {
			this.refs.slider.forceUpdate();
		}

		setData(files) {
			this.setState({ files: files });
		}

		download() {
			GEPPETTO.Utility.createZipFromRemoteFiles(this.state.files, "data.zip");
		}

		render() {
			var that = this;
			var items = this.state.files.map(function (path, index) {
				return (<div key={index}><img onClick={() => that.props.onClick(path)} onMouseEnter={() => that.props.onMouseEnter(path)} onMouseLeave={() => that.props.onMouseLeave(path)} src={path} /></div>);
			});

			if (this.state.files != undefined) {
				return (
					<Slider {...this.state.settings} ref='slider'>
						{items}
					</Slider>
				)
			}
		}
	};
});
