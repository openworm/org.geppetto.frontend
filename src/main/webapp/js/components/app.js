define(function(require){

	var $ = require('jquery'),
		GEPPETTO = require('geppetto'),
		React = require('react'),
		LoadingSpinner = require('jsx!./simulationcontrols/LoadingSpinner'),
		IntroModal = require('jsx!./tutorial/IntroModal'),
		utils = require('./utils');

    require('jsx!./simulationcontrols/SimulationControls');
    require('jsx!./cameracontrols/CameraControls');
    require('jsx!./tutorial/IntroModal');
    
    GEPPETTO.on('simulation:show_spinner',function(){
    	React.renderComponent(LoadingSpinner({show:true, keyboard:false}), $('#modal-region').get(0));
    });    
    
    var simParam = utils.getQueryStringParameter('sim');

	if(simParam) {
		GEPPETTO.Console.executeCommand('Simulation.load("' + simParam + '")');
	}else if(!$.cookie('geppetto_hideWelcomeMessage')){
        React.renderComponent(IntroModal({show:true}), document.getElementById('modal-region'));
    }
});