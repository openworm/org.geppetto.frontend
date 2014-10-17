 /**
 * @class components/app
 */
define(function(require){

	var $ = require('jquery'),
		GEPPETTO = require('geppetto'),
		React = require('react'),
		LoadingSpinner = require('jsx!./loadingspinner/LoadingSpinner'),
		utils = require('./utils');

    require('./components');
    
    GEPPETTO.on('simulation:show_spinner',function(){
    	React.renderComponent(LoadingSpinner({show:true, keyboard:false}), $('#modal-region').get(0));
    });

    var simParam = utils.getQueryStringParameter('sim');

	var webGLStarted = GEPPETTO.webGLAvailable();

	if(webGLStarted && simParam) {
		GEPPETTO.Console.executeCommand('Simulation.load("' + simParam + '")');
	}
});