define(function(require) {

    var React = require('react');

    var SaveButton = require('./SaveButton');

    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

    	 onClick: function() {
             GEPPETTO.Console.executeCommand("Project.persist();");
         },
         
    	getInitialState: function() {
            return {
            	disableSave : true,
            }
        },
        
        componentDidMount: function() {

            var self = this;

            GEPPETTO.on(Events.Project_loaded, function(){
            	 self.setState({disableSave:false});
            });
        },

        render: function () {
            return React.DOM.div({className:'saveButton'},
                SaveButton({disabled:this.state.disableSave})
            );
        }

    });

    React.renderComponent(Controls({},''), document.getElementById("SaveButton"));

});