define(function (require) {

	require("./BigImageViewer.less")

	var React = require('react');
	var OpenSeaDragon = require('openseadragon');
	var AbstractComponent = require('../../AComponent');

	return class BigImageViewer extends AbstractComponent {

		constructor(props) {
			super(props);

			var settings = {
				id: this.props.id + "_component",
				zoomInButton: "zoom-in",
				zoomOutButton: "zoom-out",
				homeButton: "home",
				fullPageButton: "full-page"
			};

			this.state = {
				settings: $.extend(settings, this.props.settings),
				file: this.props.file
			};

			this.download = this.download.bind(this);
		}

		loadViewer() {
			this.state.settings.tileSources = this.state.file;
			this.state.settings.showNavigator = this.state.showNavigator;

			this.viewer = OpenSeadragon(this.state.settings);
		}

		download() {
			//What do we do here?
		}

		componentDidUpdate() {
			this.loadViewer();
		}

		componentDidMount() {
			this.loadViewer();
		}

		render() {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="bigImageViewer">
					<div id="displayArea" style={{ position: 'absolute', top: 0, left: 0, width: '20px', margin: '6px' }}>
						<button style={{
							padding: 0,
							zIndex: 999,
							border: 0,
							background: 'transparent'
						}} className='btn fa fa-home' id='home' title={'Center Stack'} />
						<button style={{
							padding: 0,
							zIndex: 999,
							border: 0,
							background: 'transparent'
						}} className='btn fa fa-search-plus' id='zoom-in' title={'Zoom In'} />
						<button style={{
							padding: 0,
							zIndex: 999,
							border: 0,
							background: 'transparent'
						}} className='btn fa fa-search-minus' id='zoom-out' title={'Zoom Out'} />
						<button style={{
							padding: 0,
							zIndex: 999,
							border: 0,
							background: 'transparent'
						}} className='btn fa fa-arrows-alt' id='full-page' title={'Full Page'} />
					</div>
				</div>
			)
		}
	};
});
