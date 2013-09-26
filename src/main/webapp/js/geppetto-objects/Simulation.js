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
 * Class for the Simulation Object. Handles user's request to start, stop, pause, 
 * and/or load a simulation.
 * 
 * @constructor
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
var Simulation = Simulation ||
{
	REVISION : '1'
};

Simulation.StatusEnum =
{
	INIT : 0,
	LOADED : 1,
	STARTED : 2,
	PAUSED : 3,
	STOPPED: 4
};

Simulation.status = Simulation.StatusEnum.INIT;

Simulation.simulationURL = "";

/**
 * Start the simulation.
 * 
 * @name Simulation.start()
 * @returns {String} - Simulation status after starting it.
 */
Simulation.start = function()
{
	if(Simulation.isLoaded()){
		//Update the simulation controls visibility
		FE.updateStartEvent();
		
		GEPPETTO.Main.socket.send(messageTemplate("start", null));
		
		Simulation.status = Simulation.StatusEnum.STARTED;
		GEPPETTO.Console.debugLog('Outbund Message Sent: Simulation started');
		
		return SIMULATION_STARTED;
	}
	else{
		return UNABLE_TO_START_SIMULATION;
	}
};

/**
 * Pauses the simulation
 * 
 * @name Simulation.pause()
 * @returns {String} - Status of Simulation after pausing it.
 * 
 */
Simulation.pause = function()
{
	if(Simulation.status == Simulation.StatusEnum.STARTED){
		//Updates the simulation controls visibility
		FE.updatePauseEvent();
		
		GEPPETTO.Main.socket.send(messageTemplate("pause", null));
		
		Simulation.status = Simulation.StatusEnum.PAUSED;
		GEPPETTO.Console.debugLog('Outbund Message Sent: Simulation paused');

		return SIMULATION_PAUSED;
	}
	else{
		return UNABLE_TO_PAUSE_SIMULATION;
	}
};

/**
 * Stops the simulation. 
 * 
 * @name Simulation.stop()
 * @returns {String} - Status of simulation after stopping it.
 */
Simulation.stop = function()
{
	if(Simulation.status == Simulation.StatusEnum.PAUSED || Simulation.status == Simulation.StatusEnum.STARTED){
		//Updates the simulation controls visibility
		FE.updateStopEvent();

		GEPPETTO.Main.socket.send(messageTemplate("stop", null));
		
		Simulation.status = Simulation.StatusEnum.STOPPED;
		GEPPETTO.Console.debugLog('Outbund Message Sent: Simulation stopped');

		return SIMULATION_STOP;
	}
	else if(Simulation.status == Simulation.StatusEnum.LOADED){
		return SIMULATION_NOT_RUNNING;
	}
	else if(Simulations.status == Simulation.StatusEnum.STOPPED){
		return SIMULATION_ALREADY_STOPPED;
	}
	else{
		return SIMULATION_NOT_LOADED;
	}
};

/**
 * Loads a simulation from a URL.
 * 
 * @name Simulation.load(simulationURL)
 * @param simulationURL - URL of simulation file to be loaded.
 * @returns {String} - Status of attempt to load simulation using url. 
 */
Simulation.load = function(simulationURL)
{
	if (Simulation.status == Simulation.StatusEnum.STARTED || Simulation.status == Simulation.StatusEnum.PAUSED)
	{
		Simulation.stop();
	}
		
	Simulation.simulationURL = simulationURL;
	
	var loadStatus = SIMULATION_LOADING;
	
	if(simulationURL != null && simulationURL != ""){
		//Updates the simulation controls visibility
		var webGLStarted = GEPPETTO.init(FE.createContainer());
		//update ui based on success of webgl
		FE.update(webGLStarted);
		//Keep going with load of simulation only if webgl container was created
		if(webGLStarted){
			FE.activateLoader("show", "Loading Simulation");
			if (Simulation.status == Simulation.StatusEnum.INIT)
			{
				//we call it only the first time
				GEPPETTO.animate();
			}
			GEPPETTO.Main.socket.send(messageTemplate("init_url", simulationURL));
			GEPPETTO.Console.debugLog('Outbound Message Sent: Load Simulation');			
		}
	}
	
	else{		
		loadStatus = SIMULATION_UNSPECIFIED;
	}
	
	return loadStatus;
};

/**
 * Loads a simulation using the content's from the simulation file editor.
 * 
 * @name Simulation.loadFromContent(content)
 * @param content - Content of simulation to be loaded. 
 * @returns {String} - Status of attempt to load simulation from content window.
 */
Simulation.loadFromContent = function(content)
{
	 if (Simulation.status == Simulation.StatusEnum.STARTED || Simulation.status == Simulation.StatusEnum.PAUSED)
	 {
		 Simulation.stop();
	 }

	var webGLStarted = GEPPETTO.init(FE.createContainer());
	//update ui based on success of webgl
	FE.update(webGLStarted);
	//Keep going with load of simulation only if webgl container was created
	if(webGLStarted){
		FE.activateLoader("show", "Loading Simulation");
		if (Simulation.status == Simulation.StatusEnum.INIT)
		{
			//we call it only the first time
			GEPPETTO.animate();
		}
		
		GEPPETTO.Main.socket.send(messageTemplate("init_sim", content));
		GEPPETTO.Console.debugLog("Outbound Message Sent: Load Simulation from editing console");
	}
	
	return SIMULATION_LOADING;
};

/**
 * Checks status of the simulation, whether it has been loaded or not.
 * 
 * @name Simulation.isLoaded()
 * @returns {Boolean} - True if simulation has been loaded, false if not.
 */
Simulation.isLoaded = function()
{
	if(Simulation.status != Simulation.StatusEnum.INIT){
		return true;
	}
	
	return false;
};

/**
 *
 * Outputs list of commands with descriptions associated with the Simulation object.
 * 
 * @name Simulation.help()
 * @returns  Returns list of all commands for the Simulation object
 */
Simulation.help = function(){
	var commands = "Simulation control commands: \n\n";

	var descriptions = [];

	//retrieve the script to get the comments for all the methods
	$.ajax({ 
		async:false,
		type:'GET',
		url: "js/geppetto-objects/Simulation.js",
		dataType:"text",
		//at success, read the file and extract the comments
		success:function(data) {			
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			descriptions = data.match(STRIP_COMMENTS);
		},
	});

	//find all functions of object Simulation
	for ( var prop in Simulation ) {
		if(typeof Simulation[prop] === "function") {
			var f = Simulation[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = "Simulation."+prop+"("+parameter+")";
			//match the function to comment
			var matchedDescription = "";
			for(var i = 0; i<descriptions.length; i++){
				var description = descriptions[i].toString();
				
				//items matched
				if(description.indexOf(functionName)!=-1){

					/*series of formatting of the comments for the function, removes unnecessary 
					 * blank and special characters.
					 */
					var splitComments = description.replace(/\*/g, "").split("\n");
					splitComments.splice(0,1);
					splitComments.splice(splitComments.length-1,1);
					for(var s = 0; s<splitComments.length; s++){
						var line = splitComments[s].trim();
						if(line != ""){
							//ignore the name line, already have it
							if(line.indexOf("@name")==-1){
								//build description for function
								matchedDescription += "         " + line + "\n";
							}
						}
					}
				}
			}

			//format and keep track of all commands available
			commands += ("      -- " + functionName + "\n" + matchedDescription + "\n");
		};
	}	

	//returned formatted string with commands and description, remove last two blank lines
	return commands.substring(0,commands.length-2);
};

/**
 * Return status of simulation
 */
function getSimulationStatus()
{
	return Simulation.status;
};

/**
* Template for Geppetto message 
* NOTE: move from here under global G object once in place
* 
* @param msgtype - messaga type
* @param payload - message payload, can be anything
* @returns JSON stringified object
*/
function messageTemplate(msgtype, payload) {
	var object = {
		type: msgtype,
	    data: payload
	};
	return JSON.stringify(object);
};
