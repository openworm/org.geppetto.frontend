/**
 * @class components/app
 */
define(function(require) {

	var $ = require('jquery'),
		GEPPETTO = require('geppetto'),
		utils = require('./utils');
	
	require('./ComponentFactory')(GEPPETTO);
	//require('./ComponentsInitialization_OSB')(GEPPETTO);
	//require('./ComponentsInitialization_VFB')(GEPPETTO);
	require('./ComponentsInitialization')(GEPPETTO);

	var command = "Project.loadFromURL";
	var simParam = utils.getQueryStringParameter('load_project_from_url');
	var expParam = utils.getQueryStringParameter('experimentId');
	if (simParam == "") {
		simParam = utils.getQueryStringParameter('load_project_from_id');
		command = "Project.loadFromID";
	}

	if (simParam == "") {
		simParam = utils.getQueryStringParameter('load_project_from_content');
		command = "Project.loadFromContent";
	}

	if (simParam) {
		$(document).ready(
			function() {
				if (expParam) {
					GEPPETTO.Console.executeCommand(command + '("'
							+ simParam + '", "'+expParam+'")');
				} else {
					GEPPETTO.Console.executeCommand(command + '("'
							+ simParam + '")');
				}
			});
	}
});