 /**
 * Help Button
 * @module components/HelpButton
 */
define(function (require) {

    var React = require('react'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        HelpModal = require('jsx!components/help/HelpModal');

    return React.createClass({
        mixins: [require('mixins/Button')],

        onClick: function() {
            GEPPETTO.Console.executeCommand("G.showHelpWindow(true)");
        },
        
        componentDidMount: function() {
        	
        	GEPPETTO.on('simulation:show_helpwindow',function(){
        		React.renderComponent(HelpModal({show:true}), document.getElementById('modal-region'));
				$("#help-modal").css("margin-right", "-20px");
				$('#help-modal').css('max-height', $(window).height() * 0.7);
				$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
            });
        	
            GEPPETTO.on('simulation:hide_helpwindow',function(){
            	React.renderComponent(LoadingSpinner({show:true, keyboard:false}), $('#modal-region').get(0));
            });
        },
        

        getDefaultProps: function() {
            return {
                label: 'Help',
                className: 'pull-right btn-info help-button',
                icon:'icon-info-sign',
                onClick: this.onClick
            }
        }
    });
});