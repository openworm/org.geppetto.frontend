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
    
    GEPPETTO.on('project:show_spinner',function(){
    	React.renderComponent(LoadingSpinner({show:true, keyboard:false}), $('#modal-region').get(0));
    });

    var command =  "Project.loadFromURL";
    var simParam = utils.getQueryStringParameter('load_project_from_url');
    if(simParam==""){
    	simParam = utils.getQueryStringParameter('load_project_from_id');
    	command = "Project.loadFromID";
    }
    if(simParam==""){
    	simParam = utils.getQueryStringParameter('load_project_from_content');
    	command = "Project.loadFromContent";
    }
    

	var webGLStarted = GEPPETTO.webGLAvailable();

	if(webGLStarted && simParam) {
		$(document).ready(function() {
			GEPPETTO.Console.executeCommand(command+'("' + simParam + '")');
		});
	}
});