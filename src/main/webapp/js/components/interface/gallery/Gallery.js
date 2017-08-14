define(function (require) {

	var React = require('react');
	var AbstractComponent = require('../../AComponent');

	require('lightgallery');
	require('lg-thumbnail');
	require('lg-video');
	require('lg-zoom');
	require('lg-fullscreen');
	require('lg-pager');
	require('../../../../node_modules/lightgallery/src/css/lightgallery.css');

	return class Gallery extends AbstractComponent {

		constructor(props) {
			super(props);

			this.state = {
				items: props.items
			};
		}

		componentDidMount() {
			if ($('#lightgallery').data('lightGallery')) $('#lightgallery').data('lightGallery').destroy(true)
			$('#lightgallery').lightGallery({
				thumbnail: true
			});
		}

		componentDidUpdate() {
			if ($('#lightgallery').data('lightGallery')) $('#lightgallery').data('lightGallery').destroy(true)
			$('#lightgallery').lightGallery({
				thumbnail: true
			});
		}

		render() {
			return (
				<div key="lightgallery" id="lightgallery" style={this.props.style}>
					{this.state.items.map((item) => {

						{
							switch (item.type) {
								case 'image':
									return <a href={item.original}>
										<img src={item.thumbnail} />
									</a>
								case 'video':
									return <a href={item.original}>
										<img src={item.thumbnail} />
									</a>
							}
						}
					})
					};
				</div>

			)
		}
	};
});
