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
 * 
 *  
 *  
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
(function(){
	
	var waitingForServletResponse = false;
	
	GEPPETTO.MessageSocket = GEPPETTO.MessageSocket ||
	{
		REVISION : '1'
	};

	/**
	 * Web socket creation and communication
	 */
	GEPPETTO.MessageSocket.connect = (function(host)
			{
		if ('WebSocket' in window)
		{
			GEPPETTO.MessageSocket.socket = new WebSocket(host);
		}
		else if ('MozWebSocket' in window)
		{
			GEPPETTO.MessageSocket.socket = new MozWebSocket(host);
		}
		else
		{
			GEPPETTO.Console.debugLog(WEBSOCKET_NOT_SUPPORTED);
			return;
		}

		GEPPETTO.MessageSocket.socket.onopen = function()
		{
			GEPPETTO.Console.debugLog(WEBSOCKET_OPENED);

		};

		GEPPETTO.MessageSocket.socket.onclose = function()
		{
			GEPPETTO.Console.debugLog(WEBSOCKET_CLOSED);
		};

		GEPPETTO.MessageSocket.socket.onmessage = function(msg)
		{
			waitingForServletResponse = false;
			
			var parsedServerMessage = JSON.parse(msg.data);
			// parsed message has a type and data fields - data contains the payload of the message
			var payload = JSON.parse(parsedServerMessage.data);

			// Switch based on parsed incoming message type
			switch(parsedServerMessage.type){
			//clear canvas, used when loading a new model or re-loading previous one
			case "reload_canvas":
				GEPPETTO.Console.debugLog(CLEAR_CANVAS);
				var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
				GEPPETTO.FE.update(webGLStarted);
				break;
				//Error loading simulation, invalid url or simulation file 
			case "error_loading_simulation":
				$('#loadingmodal').modal('hide');
				$('#start').attr('disabled', 'disabled');
				GEPPETTO.FE.infoDialog(INVALID_SIMULATION_FILE, payload.message);
				break;
			case "geppetto_version":
				var version = payload.geppetto_version;
				var geppettoVersion = GEPPETTO_VERSION_HOLDER.replace("$1", version);
				GEPPETTO.Console.log(geppettoVersion);
				break;
				//Simulation has been loaded and model need to be loaded
			case "load_model":
				GEPPETTO.Console.debugLog(LOADING_MODEL);
				var entities = JSON.parse(payload.entities);

				setSimulationLoaded();

				//Populate scene
				GEPPETTO.populateScene(entities);
				break;
				//Notify user with alert they are now in Observer mode
			case "observer_mode_alert":
				GEPPETTO.FE.observersAlert(OBSERVING_MODE, payload.alertMessage, payload.popoverMessage);
				break;
				//Read the Parameters passed in url
			case "read_url_parameters":
				GEPPETTO.FE.searchForURLEmbeddedSimulation();
				break;		
				//Run script
			case "run_script":
				GEPPETTO.ScriptRunner.runScript(payload.run_script);
				break;
				//Event received to update the simulation
			case "scene_update":
				var entities = JSON.parse(payload.entities);
				//Update if simulation hasn't been stopped
				if(Simulation.status != Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()){
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
				GEPPETTO.FE.infoDialog(SERVER_AVAILABLE, payload.message);
				break;
				//Simulation server already in use
			case "server_unavailable":
				GEPPETTO.FE.disableSimulationControls();
				GEPPETTO.FE.observersDialog(SERVER_UNAVAILABLE, payload.message);
				break;
				//Simulation configuration retrieved from server
			case "simulation_configuration":
				//Load simulation file into display area
				GEPPETTO.SimulationContentEditor.loadSimulationInfo(payload.configuration);
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
				GEPPETTO.FE.updateStartEvent();
				break;
				//Simulation has been started, enable pause button
			case "list_watch_vars":
				GEPPETTO.Console.debugLog(LISTING_WATCH_VARS);
				formatListVariableOutput(JSON.parse(payload.list_watch_vars).variables, 0);
				break;
			case "list_force_vars":
				GEPPETTO.Console.debugLog(LISTING_FORCE_VARS);
				formatListVariableOutput(JSON.parse(payload.list_force_vars).variables, 0);
				break;
			default:

				break;
			}
		};
	});
	
	GEPPETTO.MessageSocket.send = function(command, parameter){
		GEPPETTO.MessageSocket.socket.send(messageTemplate(command, parameter));
		if(command.indexOf("init")>-1){
		waitingForServletResponse = true;
		}
	};
	
	GEPPETTO.MessageSocket.isServletBusy = function(){
		return waitingForServletResponse;
	};
})();

/**
* Template for Geppetto message 
* 
* @param msgtype - message type
* @param payload - message payload, can be anything
* @returns JSON stringified object
*/
function messageTemplate(msgtype, payload) {
	
	if (!(typeof payload == 'string' || payload instanceof String))
	{
		payload = JSON.stringify(payload);
	}
	
	var object = {
		type: msgtype,
	    data: payload
	};
	return JSON.stringify(object);
};

/**
* Utility function for formatting output of list variable operations 
* NOTE: move from here under wherever it makes sense
* 
* @param vars - array of variables
*/
function formatListVariableOutput(vars, indent)
{
	// vars is always an array of variables
	for(var i = 0; i < vars.length; i++) {
		var name  = vars[i].name;
		
		if(indent == 0)
		{
			name = vars[i].aspect + "." + name;
		}
		
		var size = null;
		if (typeof(vars[i].size) != "undefined")
		{	
			// we know it's an array
			size = vars[i].size;
		}
		
		// print node
		var arrayPart = (size!=null) ? "[" + size + "]" : "";
		var indentation = "";
		for(var j=0; j<indent; j++){ indentation=indentation.replace("↪"," ") + "   ↪ "; }
		var formattedNode = indentation + name + arrayPart;
		
		// is type simple variable? print type
		if (typeof(vars[i].type.variables) == "undefined")
		{	
			// we know it's a simple type
			var type = vars[i].type.type;
			formattedNode += ":" + type;
		}
		
		// print current node
		GEPPETTO.Console.log(formattedNode);
		
		// recursion check
		if (typeof(vars[i].type.variables) != "undefined")
		{	
			// we know it's a complex type - recurse
			formatListVariableOutput(vars[i].type.variables, indent + 1);
		}
	}
}
