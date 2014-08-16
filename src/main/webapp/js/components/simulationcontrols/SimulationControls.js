define(function(require) {

    var React = require('react');

    var LoadButton = require('./buttons/LoadButton');
    var StartButton = require('./buttons/StartButton');
    var PauseButton = require('./buttons/PauseButton');
    var StopButton = require('./buttons/StopButton');
    var HelpButton = require('./buttons/HelpButton');

    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

        getInitialState: function() {
            return {
                disableLoad:false,
                disableStart:true,
                disablePause:true,
                disableStop:true
            }
        },

        componentDidMount: function() {

            var self = this;

            GEPPETTO.on('simulation:started', function(){
                self.setState({disableStart:true, disablePause:false, disableStop:false});
            });

            GEPPETTO.on('simulation:paused', function(){
                self.setState({disableStart:false, disablePause:true, disableStop:false});
            });

            GEPPETTO.on('simulation:stopped', function(){
                self.setState({disableStart:false, disablePause:true, disableStop:true});
            });
            
            GEPPETTO.on('simulation:disable_all', function(){
                self.setState({disableLoad : true, disableStart:true, disablePause:true, disableStop:true});
            });
        },

        render: function () {
            return React.DOM.div({className:'simulation-controls'},
                HelpButton({disabled:false}),
                StopButton({disabled:this.state.disableStop}),
                PauseButton({disabled:this.state.disablePause}),
                StartButton({disabled:this.state.disableStart}),
                LoadButton({disabled:this.state.disableLoad})
            );
        }

    });

    React.renderComponent(Controls({},''), document.getElementById('sim-toolbar'));

});