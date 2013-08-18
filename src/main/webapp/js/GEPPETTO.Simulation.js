/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * @fileoverview Simulation layer of Geppetto frontend
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 */

/**
 * Base class
 */

GEPPETTO.Simulation = GEPPETTO.Simulation ||
{
	REVISION : '1'
};

GEPPETTO.Simulation.StatusEnum =
{
	INIT : 0,
	LOADED : 1,
	STARTED : 2,
	PAUSED : 3,
	OBSERVED: 4,
	STOPPED: 5
};

GEPPETTO.Simulation.simulationFile = "resources/template.xml";

GEPPETTO.Simulation.init = function()
{
	GEPPETTO.Simulation.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.INIT;
	Console.log('Geppetto Simulation Initialised');
};

GEPPETTO.Simulation.getStatus = function()
{
	return GEPPETTO.Simulation.status;
};

GEPPETTO.Simulation.start = function()
{
	GEPPETTO.Simulation.socket.send("start");

	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.STARTED;
	Console.log('Sent: Simulation started');
};

GEPPETTO.Simulation.pause = function()
{
	GEPPETTO.Simulation.socket.send("pause");
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.PAUSED;
	Console.log('Sent: Simulation paused');
};

GEPPETTO.Simulation.stop = function()
{
	GEPPETTO.Simulation.socket.send("stop");
	GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.STOPPED;
	Console.log('Sent: Simulation stopped');
};

GEPPETTO.Simulation.observe = function()
{
	//Create canvas for observing visitor
	var webGLStarted = GEPPETTO.init(FE.createContainer());
	
	//Allow user to observe only if wegbl container was created
	if(webGLStarted){
		GEPPETTO.animate();	
		GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.OBSERVED;
		GEPPETTO.Simulation.socket.send("observe");
		Console.log('Sent: Simulation being observed');
	}
	
	//update the UI based on success of webgl 
	FE.update(webGLStarted);
};

GEPPETTO.Simulation.load = function(init_mode, init_value)
{
	var webGLStarted = GEPPETTO.init(FE.createContainer());
	//update ui based on success of webgl
	FE.update(webGLStarted);
	//Keep going with load of simulation only if webgl container was created
	if(webGLStarted){
		FE.activateLoader("show", "Loading Simulation");
		if (GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.INIT)
		{
			//we call it only the first time
			GEPPETTO.animate();
		}
		GEPPETTO.Simulation.simulationURL = init_value;
		GEPPETTO.Simulation.socket.send(init_mode + init_value);
		Console.log('Sent: Simulation loaded');
	}
};

GEPPETTO.Simulation.connect = (function(host)
{
	if ('WebSocket' in window)
	{
		GEPPETTO.Simulation.socket = new WebSocket(host);
	}
	else if ('MozWebSocket' in window)
	{
		GEPPETTO.Simulation.socket = new MozWebSocket(host);
	}
	else
	{
		Console.log('Error: WebSocket is not supported by this browser.');
		return;
	}

	GEPPETTO.Simulation.socket.onopen = function()
	{
		Console.log('Info: WebSocket connection opened.');
	};

	GEPPETTO.Simulation.socket.onclose = function()
	{
		Console.log('Info: WebSocket closed.');
	};

	GEPPETTO.Simulation.socket.onmessage = function(msg)
	{		
		var parsedServerMessage = JSON.parse(msg.data);
		
		//Parsed incoming message
		switch(parsedServerMessage.type){
			//clear canvas, used when loading a new model or re-loading previous one
			case "reload_canvas":
				Console.log("Clear canvas");
				var webGLStarted = GEPPETTO.init(FE.createContainer());
				FE.update(webGLStarted);
				break;
			//Error loading simulation, invalid url or simulation file 
			case "error_loading_simulation":
				$('#loadingmodal').modal('hide');
				$('#start').attr('disabled', 'disabled');
				FE.infoDialog("Invalid Simulation File", parsedServerMessage.message);
				break;
			//Simulation has been loaded and model need to be loaded
			case "load_model":
				Console.log("Received: Loading Model " );
				var entities = JSON.parse(parsedServerMessage.entities);
								
				//Populate scene and set status to loaded
				GEPPETTO.populateScene(entities);
				GEPPETTO.Simulation.status = GEPPETTO.Simulation.StatusEnum.LOADED;
				break;
			//Notify user with alert they are now in Observer mode
			case "observer_mode_alert":
				FE.observersAlert("Observing Simulation Mode", parsedServerMessage.alertMessage, parsedServerMessage.popoverMessage);
				break;
			//Read the Parameters passed in url
			case "read_url_parameters":
				FE.searchForURLEmbeddedSimulation();
				break;
			//Event received to update the simulation
			case "scene_update":
				var entities = JSON.parse(parsedServerMessage.entities);
				//Update if simulation hasn't been stopped
				if(GEPPETTO.Simulation.status != GEPPETTO.Simulation.StatusEnum.STOPPED){
					if (!GEPPETTO.isScenePopulated())
					{				
						// the first time we need to create the object.s
						GEPPETTO.populateScene(entities);
					}
					else
					{					
						// any other time we just update them
						GEPPETTO.updateJSONScene(entities);
					}
				}
				break;
			//Simulation server became available
			case "server_available":
				FE.infoDialog("Server Available", parsedServerMessage.message);
				break;
			//Simulation server already in use
			case "server_unavailable":
			    FE.disableSimulationControls();
				FE.observersDialog("Server Unavailable", parsedServerMessage.message);
				break;
			//Simulation configuration retrieved from server
			case "simulation_configuration":
				//Load simulation file into display area
				GEPPETTO.SimulationContentEditor.loadSimulationInfo(parsedServerMessage.configuration);
				//Auto Format Simulation FIle display
				GEPPETTO.SimulationContentEditor.autoFormat();
				break;
			//Simulation has been loaded, enable start button and remove loading panel
			case "simulation_loaded":
				$('#start').removeAttr('disabled');
				$('#loadingmodal').modal('hide');
				break;
			//Simulation has been started, enable pause button
			case "simulation_started":
				$('#pause').removeAttr('disabled');
				break;
			default:
				
				break;
		}
	};
});

var Console =
{};

Console.log = (function(message)
{
	var console = document.getElementById('consolealert');
	if(console !=null){
		var p = document.createElement('p');
		p.style.wordWrap = 'break-word';
		p.innerHTML = message;
		console.appendChild(p);
		while (console.childNodes.length > 25)
		{
			console.removeChild(console.firstChild);
		}
		console.scrollTop = console.scrollHeight;
	}
});

var FE = FE ||
{};

FE.createContainer = function()
{
	$("#sim canvas").remove();
	return $("#sim").get(0);
};

/**
 * update
 */
FE.update = function(webGLStarted)
{
	//
	if(!webGLStarted){
		Console.log("Unable to initialize WebGL");
		FE.disableSimulationControls();
	}
};

/**
 * Show dialog informing users of server being used and
 * gives them the option to Observer ongoing simulation.
 * 
 * @param msg
 */
FE.observersDialog = function(title, msg)
{
	$('#infomodal-title').html(title);
	$('#infomodal-text').html(msg);
	$('#infomodal-btn').html("<i class='icon-eye-open '></i> Observe").click(function() {
		GEPPETTO.Simulation.observe();
	});
	$('#infomodal').modal();   
            
};

/**
 * Basic Dialog box with message to display.
 * 
 * @param title - Title of message
 * @param msg - Message to display
 */
FE.infoDialog = function(title, msg)
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
FE.observersAlert = function(title, alertMsg, popoverMsg)
{
	$('#alertbox-text').html(alertMsg);
	$('#alertbox').show();
	$("#infopopover").popover({title: title, 
							   content: popoverMsg});  
};

/**
 * Look for Simulations that may have been embedded as parameter in the URL
 */
FE.searchForURLEmbeddedSimulation =  function()
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
		GEPPETTO.Simulation.load("init_url$",urlVal);
	}
};

/**
 * Populate Load Modal with drop down menu of 
 * predefined sample simulations stored in JSON file. 
 * 
 */
FE.loadingModalUIUpdate = function()
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
			
			GEPPETTO.SimulationContentEditor.isEditing(false);
			
			//Get the name and url of selected simulation
            var selectedURL = $(this).attr('url');
            var selectedName =$(this).text();
            
            //Add selected simulation's url to URL input field
            $('#url').val(selectedURL);
            //Change drop down menu name to selected simulation's name
            $('#dropdowndisplaytext').html(selectedName);
            
            GEPPETTO.Simulation.simulationFile = selectedURL;
            
            //Custom Content editor is visible, update with new sample simulation chosen
            if($('#customRadio').val()=="active"){
            	FE.updateEditor(selectedURL);
            }
        });
		
		$('#url').keydown(function(){
			//reset sample drop down menu if url field modified
			$('#dropdowndisplaytext').html("Select simulation from list...");
			
			//reset simulation file used in editor to template
			GEPPETTO.Simulation.simulationFile = "resources/template.xml";
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
		FE.updateEditor(GEPPETTO.Simulation.simulationFile);
	});
	
};

/**
 * Updates the editor with new simulation file
 * 
 * @param selectedSimulation
 */
FE.updateEditor = function(selectedSimulation)
{
	GEPPETTO.SimulationContentEditor.loadEditor();

	//load template simulation
	if(selectedSimulation == "resources/template.xml"){
		GEPPETTO.SimulationContentEditor.loadTemplateSimulation(selectedSimulation);
	}
	//load sample simulation, request info from the servlet
	else{
		GEPPETTO.Simulation.socket.send("sim$"+selectedSimulation);
	}
};

/**
 * If simulation is being controlled by another user, hide the 
 * control and load buttons. Show "Observe" button only.
 */
FE.disableSimulationControls = function()
{
	//Disable 'load simulation' button and click events
	$('#openload').attr('disabled', 'disabled');
	$('#openload').click(function(e){return false;});
};

FE.activateLoader = function(state, msg)
{
	$('#loadingmodaltext').html(msg);
	$('#loadingmodal').modal(state);
};

// ============================================================================
// Application logic.
// ============================================================================

$(document).ready(function()
{	
	//Populate the 'loading simulation' modal's drop down menu with sample simulations
	$('#loadSimModal').on('shown', FE.loadingModalUIUpdate());
	$('#start').attr('disabled', 'disabled');
	$('#pause').attr('disabled', 'disabled');
	$('#stop').attr('disabled', 'disabled');
	
	$('#start').click(function()
	{
		//FE.activateLoader("show", "Starting Simulation ...");
		
		$('#start').attr('disabled', 'disabled');
		$('#stop').attr('disabled', 'disabled');
		GEPPETTO.Simulation.start();
	});

	$('#pause').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#pause').attr('disabled', 'disabled');
		$('#stop').removeAttr('disabled');
		GEPPETTO.Simulation.pause();
	});
	
	$('#stop').click(function()
	{
		$('#start').removeAttr('disabled');
		$('#pause').attr('disabled', 'disabled');
		$('#stop').attr('disabled', 'disabled');
		GEPPETTO.Simulation.stop();
	});
	
	$('#load').click(function()
	{
		$('#pause').attr('disabled', 'disabled');
		$('#stop').attr('disabled', 'disabled');
		$('#loadSimModal').modal("hide");
		if (GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.STARTED || GEPPETTO.Simulation.status == GEPPETTO.Simulation.StatusEnum.PAUSED)
		{
			GEPPETTO.Simulation.stop();
		}
		if(GEPPETTO.SimulationContentEditor.editing){
			Console.log("Sent: Load Simulation from editing console");
			var simulation = GEPPETTO.SimulationContentEditor.getEditedSimulation();
			
			GEPPETTO.Simulation.load("init_sim$", simulation);
			GEPPETTO.SimulationContentEditor.isEditing(false);
		}
		else{
			Console.log("Sent: Load simulation from URL");
			GEPPETTO.Simulation.load("init_url$", $('#url').val());
		}
	});
	$('#jsConsoleButton').click(function()
	{	
		GEPPETTO.JSConsole.toggleConsole();
	});

	GEPPETTO.Simulation.init();
});
