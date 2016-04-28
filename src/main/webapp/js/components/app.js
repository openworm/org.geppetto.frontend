/**
 * @class components/app
 */
define(function(require) {

	var $ = require('jquery'), GEPPETTO = require('geppetto'), React = require('react'), LoadingSpinner = require('jsx!./loadingspinner/LoadingSpinner'), utils = require('./utils');
	var ReactDOM = require('react-dom');

	require('./components');

	GEPPETTO.on('show_spinner', function(label) {
		var spinnerFactory = React.createFactory(LoadingSpinner);
		ReactDOM.render(spinnerFactory({
			show : true,
			keyboard : false,
			text: label
		}), $('#modal-region').get(0));
	});

	GEPPETTO.on('spin_logo', function(label) {
		$(".gpt-gpt_logo").addClass("fa-spin").attr('title', 'Loading data');
	});

	GEPPETTO.on('stop_spin_logo', function(label) {
		$(".gpt-gpt_logo").removeClass("fa-spin").attr('title', '');;
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