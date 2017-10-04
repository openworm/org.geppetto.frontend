define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        HelpModal = require('../HelpModal');

    return React.createClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function() {

        	GEPPETTO.on('simulation:show_helpwindow',function(){
        		ReactDOM.render(React.createFactory(HelpModal)({show:true}), document.getElementById('modal-region'));

				$("#help-modal").css("margin-right", "-20px");
				$('#help-modal').css('max-height', $(window).height() * 0.7);
				$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
            });

            GEPPETTO.on('simulation:hide_helpwindow',function(){
            	GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {show : true, keyboard : false, logo: "gpt-gpt_logo"}, document.getElementById("modal-region"));
            });
        },

        getDefaultProps: function() {
            return {
                label: 'Help',
                id: 'genericHelpBtn',
                className: 'pull-right help-button',
                icon:'fa fa-info-circle',
                onClick: function(){ GEPPETTO.CommandController.execute("G.showHelpWindow(true)", true); }
            }
        }
    });
});
