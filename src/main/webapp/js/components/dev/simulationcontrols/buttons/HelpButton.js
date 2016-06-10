define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        HelpModal = require('jsx!../../help/HelpModal');

    return React.createClass({
        mixins: [require('mixins/Button')],
        
        componentDidMount: function() {
        	
        	GEPPETTO.on('simulation:show_helpwindow',function(){
        		ReactDOM.render(React.createFactory(HelpModal)({show:true}), document.getElementById('modal-region'));

				$("#help-modal").css("margin-right", "-20px");
				$('#help-modal').css('max-height', $(window).height() * 0.7);
				$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
            });
        	
            GEPPETTO.on('simulation:hide_helpwindow',function(){
            	ReactDOM.render(React.createFactory(LoadingSpinner)({show:true, keyboard:false}), $('#modal-region').get(0));
            });
        },

        getDefaultProps: function() {
            return {
                label: 'Help',
                className: 'pull-right help-button',
                icon:'fa fa-info-circle',
                onClick: function(){ GEPPETTO.Console.executeCommand("G.showHelpWindow(true)"); }
            }
        }
    });
});