define(function(require){

	var $ = require('jquery');

    require('jsx!./simulationcontrols/SimulationControls');
    require('jsx!./cameracontrols/CameraControls');
    require('jsx!./tutorial/IntroModal');

    var utils = require('./utils');
    var simParam = utils.getQueryStringParameter('sim');

	if(simParam) {
		GEPPETTO.Console.executeCommand('Simulation.load("' + simParam + '")');
	}
});