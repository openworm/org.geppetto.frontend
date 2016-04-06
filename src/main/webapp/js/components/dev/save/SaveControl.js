define(function(require) {

    var React = require('react');
    var ReactDOM = require('react-dom');
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

            GEPPETTO.on(Events.Project_persisted, function(){
                self.setState({disableSave:true});
            });
            
            GEPPETTO.on(Events.Volatile_project_loaded, function(){
                self.setState({disableSave:false});
            });
        },

        render: function () {
            return React.DOM.div({className:'saveButton'}, React.createFactory(SaveButton)({disabled:this.state.disableSave}));
        }

    });

    ReactDOM.render(React.createFactory(Controls)(), document.getElementById("SaveButton"));

});