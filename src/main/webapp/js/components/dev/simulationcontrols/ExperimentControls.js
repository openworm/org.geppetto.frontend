define(function(require) {

    var React = require('react');

    var RunButton = require('./buttons/RunButton');
    var PlayButton = require('./buttons/PlayButton');
    var PauseButton = require('./buttons/PauseButton');
    var StopButton = require('./buttons/StopButton');
    var HelpButton = require('./buttons/HelpButton');

    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

        getInitialState: function() {
            return {
            	disableRun : true,
                disablePlay:true,
                disablePause:true,
                disableStop:true
            }
        },

        componentDidMount: function() {

            var self = this;

            GEPPETTO.on(Events.Experiment_loaded, function(){
            	var experiment = window.Project.getActiveExperiment();
            	if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.COMPLETED){
            		self.setState({disablePlay:false, disablePause:true, disableStop:true});
            	}
            	else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.DESIGN){
            		self.setState({disableRun : false, disablePlay:true, disablePause:true, disableStop:true});
            	}
            });
            
            GEPPETTO.on(Events.Experiment_running, function(){
                self.setState({disableRun: true, disablePlay:true, disablePause:true, disableStop:true});
            });

            GEPPETTO.on(Events.Experiment_play, function(){
                self.setState({disableRun: true,disablePlay:true, disablePause:false, disableStop:false});
            });

            GEPPETTO.on(Events.Experiment_pause, function(){
                self.setState({disableRun: true,disablePlay:false, disablePause:true, disableStop:false});
            });

            GEPPETTO.on(Events.Experiment_stop, function(){
                self.setState({disableRun:true, truedisablePlay:false, disablePause:true, disableStop:true});
            });
            
            GEPPETTO.on('disable_all', function(){
                self.setState({disableRun: true,disablePlay:true, disablePause:true, disableStop:true});
            });
            GEPPETTO.on(Events.Experiment_replay, function(){
                self.setState({disableRun: true,disablePlay:true, disablePause:false, disableStop:false});
            });
        },

        render: function () {
            return React.DOM.div({className:'simulation-controls'},
                HelpButton({disabled:false}),
                StopButton({disabled:this.state.disableStop}),
                PauseButton({disabled:this.state.disablePause}),
                PlayButton({disabled:this.state.disablePlay}),
                RunButton({disabled:this.state.disableRun})
            );
        }

    });

    React.renderComponent(Controls({},''), document.getElementById('sim-toolbar'));

});