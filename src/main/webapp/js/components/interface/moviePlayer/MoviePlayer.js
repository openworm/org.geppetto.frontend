define(function (require) {

	var React = require('react');
	var ReactPlayer = require('react-player');
	var AbstractComponent = require('../../AComponent');

	/**
	 * Creates a component using react-player
	 */
	return class MoviePlayer extends AbstractComponent {

		constructor(props) {
			super(props);
			this.state = {
					play: false,
					volume : 1, // can be any value from 0 to 1
					videoURL : "", //URL pointing to the file to be played
					loop : false, //play video again at end of video
					playbackRate : 1 //playback rate any decimal
			};
		}

		play(){
			this.setState({play:true});
			this.forceUpdate();
		}

		pause(){
			this.setState({play:false});
			this.forceUpdate();
		}

		loop(loopp){
			this.setState({loop:loopp});
			this.forceUpdate();
		}
		
		stop(){
			this.setState({play:false});
			this.forceUpdate();
		}

		load(url){
			this.setState({videoURL : url});
			this.forceUpdate();
		}

		componentDidMount() {
			if(this.props.controls!= null || this.props.controls!=undefined){
				var play = (this.props.controls.playAtStart!=undefined)? this.props.controls.playAtStart : this.state.play;
				var loop = (this.props.controls.loop!=undefined)? this.props.controls.loop : this.state.loop;
				var volume = (this.props.controls.volume!=undefined)? this.props.controls.volume : this.state.volume;
				var playbackRate = (this.props.controls.playbackRate!=undefined)?
						this.props.controls.playbackRate : this.state.playbackRate;

				this.setState({play : play,loop : loop, volume : volume,
					playbackRate : playbackRate, videoURL : this.props.videoURL});
			}else{
				this.setState({videoURL : this.props.videoURL});
			}
			this.forceUpdate();
		}

		render () {
			var width="100%", height = "100%";
			if(this.props.width!=undefined && this.props.width!=null){
				this.props.width =this.props.width;
			}
			if(this.props.height!=undefined && this.props.height!=null){
				this.props.height =this.props.height;
			}
			return <ReactPlayer url={this.state.videoURL} playing={this.state.play}  volume={this.state.volume}
			loop={this.state.loop} playbackRate={this.state.playbackRate} width ={width} height = {height}/>
		}
	};
});
