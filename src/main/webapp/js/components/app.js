/**
 * @class components/app
 */
define(function(require) {

	var $ = require('jquery'), GEPPETTO = require('geppetto'), React = require('react'), LoadingSpinner = require('jsx!./loadingspinner/LoadingSpinner'), utils = require('./utils');

	require('./components');


	GEPPETTO.on('show_spinner', function(label) {
		React.renderComponent(LoadingSpinner({
			show : true,
			keyboard : false,
			text: label
		}), $('#modal-region').get(0));
	});

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