define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        TutorialModal = require('jsx!../../tutorial/TutorialModule');

    return React.createClass({
        mixins: [require('mixins/Button')],
        
        componentDidMount: function() {
        	
        	GEPPETTO.on("show:tutorial",function(){
        		ReactDOM.render(React.createFactory(TutorialModal)({show:true}), document.getElementById('modal-region'));
//
//				$("#help-modal").css("margin-right", "-20px");
//				$('#help-modal').css('max-height', $(window).height() * 0.7);
//				$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
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