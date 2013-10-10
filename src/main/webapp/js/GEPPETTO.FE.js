/**
 * Front end, user interface, methods for handling updates to the UI
 * 
 * @constructor
 */
GEPPETTO.FE = GEPPETTO.FE ||
{};

/**
 * Create the container for holding the canvas
 * 
 * @returns {DivElement}
 */
GEPPETTO.FE.createContainer = function()
{
	$("#sim canvas").remove();
		
	return $("#sim").get(0);
};

/**
 * Show error message if webgl failed to start
 */
GEPPETTO.FE.update = function(webGLStarted)
{
	//
	if(!webGLStarted){
		GEPPETTO.Console.debugLog(WEBGL_FAILED);
		GEPPETTO.FE.disableSimulationControls();
	}
};

/**
 * Show dialog informing users of server being used and
 * gives them the option to Observer ongoing simulation.
 * 
 * @param msg
 */
GEPPETTO.FE.observersDialog = function(title, msg)
{
	$('#infomodal-title').html(title);
	$('#infomodal-text').html(msg);
	$('#infomodal-btn').html("<i class='icon-eye-open '></i> Observe").click(function() {
		GEPPETTO.Main.observe();
	});
	$('#infomodal').modal();   
            
};

/**
 * Basic Dialog box with message to display.
 * 
 * @method
 * 
 * @param title - Title of message
 * @param msg - Message to display
 */
GEPPETTO.FE.infoDialog = function(title, msg)
{
	$('#infomodal-title').html(title);
	$('#infomodal-text').html(msg);
	$('#infomodal-btn').html("OK").off('click');
	$('#infomodal').modal();   
};

/**
 * Create bootstrap alert to notify users they are in observer mode
 * 
 * @param title
 * @param alertMsg
 * @param popoverMsg
 */
GEPPETTO.FE.observersAlert = function(title, alertMsg, popoverMsg)
{
	$('#alertbox-text').html(alertMsg);
	$('#alertbox').show();
	$("#infopopover").popover({title: title, 
							   content: popoverMsg});  
};

/**
 * Look for Simulations that may have been embedded as parameter in the URL
 */
GEPPETTO.FE.searchForURLEmbeddedSimulation =  function()
{	
	//Get the URL with which Geppetto was loaded
	var urlLocation = window.location.href;
	//Split url looking for simulation parameters
	var vars = urlLocation.split("?sim=");
	
	//Load simulation if simulation parameters where found
	if(vars.length > 1){
		var urlVal = decodeURIComponent(vars[1]);
		$('#url').val(urlVal);
		//Simulation found, load it
		GEPPETTO.Console.executeCommand('Simulation.load("'+urlVal+'")');
	}
};

/**
 * Populate Load Modal with drop down menu of 
 * predefined sample simulations stored in JSON file. 
 * 
 */
GEPPETTO.FE.loadingModalUIUpdate = function()
{
	//Read JSON file storing predefined sample simulations
	$.getJSON('resources/PredefinedSimulations.json', function(json) {
		
		//Get access to <ul> html element in load modal to add list items
		var ul = document.getElementById('dropdownmenu');
		
		//Loop through simulations found in JSON file
		for (var i in json.simulations) {
			//Create <li> element and add url attribute storing simulation's url
			var li = document.createElement('li');
			li.setAttribute('url', json.simulations[i].url);
			
			//Create <a> element to add simulation name, add to <li> element
			var a = document.createElement('a');
			a.innerHTML = json.simulations[i].name;
			li.appendChild(a);
			
			//Add <li> element to load modal's dropdownmenu
			ul.appendChild(li);
		}		
		
		//Add click listener to sample simulations dropdown menu
		$('#dropdownmenu li').click(function () {
			
			GEPPETTO.SimulationContentEditor.setEditing(false);
			
			//Get the name and url of selected simulation
            var selectedURL = $(this).attr('url');
            var selectedName =$(this).text();
            
            //Add selected simulation's url to URL input field
            $('#url').val(selectedURL);
            //Change drop down menu name to selected simulation's name
            $('#dropdowndisplaytext').html(selectedName);
            
            GEPPETTO.Main.simulationFileTemplate = selectedURL;
            
            //Custom Content editor is visible, update with new sample simulation chosen
            if($('#customRadio').val()=="active"){
            	GEPPETTO.FE.updateEditor(selectedURL);
            }
        });
		
		$('#url').keydown(function(){
			//reset sample drop down menu if url field modified
			$('#dropdowndisplaytext').html("Select simulation from list...");
			
			//reset simulation file used in editor to template
			GEPPETTO.Main.simulationFileTemplate = "resources/template.xml";
		});
			
	});

	//Responds to user selecting url radio button
	$("#urlRadio").click(function() {
		$('#customRadio').val("inactive");
		$('#customInputDiv').hide();
		$('#urlInput').show();		
	});
	
	//Responds to user selecting Custom radio button
	$("#customRadio").click(function() {
		//Handles the events related the content edit area
		$('#customRadio').val("active");
		$('#urlInput').hide();	
		$('#customInputDiv').show();
		
		//update editor with latest simulation file selected
		GEPPETTO.FE.updateEditor(GEPPETTO.Main.simulationFileTemplate);
	});
	
};

/**
 * Updates the editor with new simulation file
 * 
 * @param selectedSimulation
 */
GEPPETTO.FE.updateEditor = function(selectedSimulation)
{
	GEPPETTO.SimulationContentEditor.loadEditor();

	//load template simulation
	if(selectedSimulation == "resources/template.xml"){
		GEPPETTO.SimulationContentEditor.loadTemplateSimulation(selectedSimulation);
	}
	//load sample simulation, request info from the servlet
	else{
		GEPPETTO.MessageSocket.socket.send(messageTemplate("sim", selectedSimulation));
	}
};

/**
 * If simulation is being controlled by another user, hide the 
 * control and load buttons. Show "Observe" button only.
 */
GEPPETTO.FE.disableSimulationControls = function()
{
	//Disable 'load simulation' button and click events
	$('#openload').attr('disabled', 'disabled');
	$('#openload').click(function(e){return false;});
	
	$('#consoleButton').attr('disabled', 'disabled');
};

GEPPETTO.FE.activateLoader = function(state, msg)
{
	$('#loadingmodaltext').html(msg);
	$('#loadingmodal').modal(state);
};


/**
 * Update the simulation controls button's visibility after
 * user's interaction.
 */
GEPPETTO.FE.updateLoadEvent = function(){
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
};

/**
 * Update the simulation controls button's visibility after
 * user's interaction.
 */
GEPPETTO.FE.updateStartEvent = function(){
	$('#start').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
	$('#pause').removeAttr('disabled');
};

/**
 * Update the simulation controls button's visibility after
 * user's interaction.
 */
GEPPETTO.FE.updateStopEvent = function(){
	$('#start').removeAttr('disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
};

/**
 * Update the simulation controls button's visibility after
 * user's interaction.
 */
GEPPETTO.FE.updatePauseEvent = function(){
	$('#start').removeAttr('disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').removeAttr('disabled');
};