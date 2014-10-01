 /**
 * @class components/app
 */
define(function(require){

	var $ = require('jquery'),
		GEPPETTO = require('geppetto'),
		React = require('react'),
		LoadingSpinner = require('jsx!./dev/simulationcontrols/LoadingSpinner'),
		IntroModal = require('jsx!./dev/tutorial/IntroModal'),
		utils = require('./utils');

    require('./components');
    
    GEPPETTO.on('simulation:show_spinner',function(){
    	React.renderComponent(LoadingSpinner({show:true, keyboard:false}), $('#modal-region').get(0));
    });

    var simParam = utils.getQueryStringParameter('sim');

	var webGLStarted = GEPPETTO.webGLAvailable();

	if(webGLStarted){
		if(simParam) {
			GEPPETTO.Console.executeCommand('Simulation.load("' + simParam + '")');
		}else if(!$.cookie('geppetto_hideWelcomeMessage')){
			React.renderComponent(IntroModal({show:true}), document.getElementById('modal-region'));
		}
	}
});