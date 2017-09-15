define(function (require) {

	var React = require('react');
	var AbstractComponent = require('../../AComponent');
	require('./Gallery.less');

	require('lightgallery');
	require('lg-thumbnail');
	require('lg-video');
	require('lg-fullscreen');
	require('lg-pager');
	require('../../../../node_modules/lightgallery/src/css/lightgallery.css');

	var LazyLoad = require('react-lazy-load').default;

	return class Gallery extends AbstractComponent {

		constructor(props) {
			super(props);

			this.state = {
				items: props.items
			};
		}

		loadGallery() {
			if (this.state.items != null) {
				var dynamicEl = [];
				this.state.items.forEach(function (item) {
					switch (item.type) {
						case 'image':
							dynamicEl.push({
								"src": item.original,
								'thumb': item.thumbnail,
								'subHtml': item.caption
							});
							break;

						case 'video-youtube':
							dynamicEl.push({
								"src": 'https://www.youtube.com/watch?v=' + item.id,
								'thumb': (item.thumbnail != undefined) ? item.thumbnail : 'https://img.youtube.com/vi/' + item.id + '/0.jpg',
								'subHtml': item.caption
							});
							break;
					}
				});


				$('#lightgallery').on('onCloseAfter.lg', function (event) {
					$('#lightgallery').data('lightGallery').destroy(true);
				});

				$(".gallery-item").on('click', function () {
					var slideID = $(this).attr('data-slide');

					$('#lightgallery').lightGallery({
						thumbnail: false,
						index: parseInt(slideID),
						dynamic: true,
						dynamicEl: dynamicEl,
						fullScreen: false
					});
				});
			}
		}

		componentDidMount() {
			this.loadGallery();
		}

		destroyEvents() {
			if ($('#lightgallery').data('lightGallery')) {
				$('#lightgallery').data('lightGallery').destroy(true);
			}
			$(".gallery-item").off("click");
		}

		componentDidUpdate() {
			this.destroyEvents();
			this.loadGallery();
		}

		componentWillUnmount() {
			this.destroyEvents();
		}

		setData(items) {
			this.setState({ items: items });
		}

		render() {
			return (
				<div key="lightgallery" id="lightgallery" style={this.props.style}>
					{this.state.items != null ? this.state.items.map((item, index) => {

						switch (item.type) {
							case 'image':
								return <a className="gallery-item" data-slide={index}>
									<LazyLoad offset={200}><img src={item.thumbnail} /></LazyLoad>
								</a>
							case 'video-youtube':
								return <a className="gallery-item" data-slide={index}>
									<LazyLoad offset={200}><img data-slide={index} src={
										(item.thumbnail != undefined) ?
											item.thumbnail :
											'https://img.youtube.com/vi/' + item.id + '/0.jpg'}
									/></LazyLoad>
								</a>
						}
					}) : null
					}
				</div>

			)
		}
	};
});
