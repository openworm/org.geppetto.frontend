define(function (require) {

	var React = require('react');
	var Slider = require('react-slick');
	var AbstractComponent = require('../../AComponent');

	return class Carousel extends AbstractComponent {

		constructor(props) {
            super(props);

			var settings = {
				infinite: true,
				speed: 500,
				slidesToShow: 1,
				slidesToScroll: 1
			};
			
			this.state = {
            	settings: $.extend(settings, this.props.settings),
            	files: this.props.files
            };
		}

		render () {
			var items = this.state.files.map(function (path) {		            			 
    			 return (<div><img src={path} /></div>);
    		 });

			return (
				<Slider {...this.state.settings}>
					{items}
				</Slider>
			)
		}
	};
});
