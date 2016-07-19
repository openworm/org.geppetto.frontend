define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        TutorialModal = require('jsx!../../tutorial/TutorialModule');

    return React.createClass({
        mixins: [require('mixins/Button')],
        
        componentDidMount: function() {
        	
        	GEPPETTO.on(Events.Show_Tutorial,function(){
        		ReactDOM.render(React.createFactory(TutorialModal)({show:true, tutorial : {"name":"hello"}}), document.getElementById('modal-region'));
            });
        },

        getDefaultProps: function() {
            return {
                label: '',
                className: 'squareB',
                icon:'fa fa-leanpub',
                onClick: function(){ GEPPETTO.Console.executeCommand("G.showTutorial(true)"); }
            }
        }
    });
});