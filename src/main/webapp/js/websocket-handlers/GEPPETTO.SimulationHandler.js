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
 * Handles incoming messages associated with Simulation
 */
GEPPETTO.SimulationHandler = GEPPETTO.SimulationHandler ||
	{
		REVISION : '1'
	};
	
(function(){

	GEPPETTO.SimulationHandler.onMessage = function(parsedServerMessage){

		// parsed message has a type and data fields - data contains the payload of the message
		var payload = JSON.parse(parsedServerMessage.data);

		// Switch based on parsed incoming message type
		switch(parsedServerMessage.type){
		//Simulation has been loaded and model need to be loaded
		case MESSAGE_TYPE.LOAD_MODEL:
			GEPPETTO.Console.debugLog(LOADING_MODEL);
			var entities = JSON.parse(payload.entities);

			setSimulationLoaded();

			//Populate scene
			GEPPETTO.populateScene(entities);
			break;
			//Event received to update the simulation
		case MESSAGE_TYPE.SCENE_UPDATE:
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
			//Simulation configuration retrieved from server
		case MESSAGE_TYPE.SIMULATION_CONFIGURATION:
			//Load simulation file into display area
			GEPPETTO.SimulationContentEditor.loadSimulationInfo(payload.configuration);
			//Auto Format Simulation FIle display
			GEPPETTO.SimulationContentEditor.autoFormat();
			break;
			//Simulation has been loaded, enable start button and remove loading panel
		case MESSAGE_TYPE.SIMULATION_LOADED:
			$('#start').removeAttr('disabled');
			$('#loadingmodal').modal('hide');
			break;
			//Simulation has been started, enable pause button
		case MESSAGE_TYPE.SIMULATION_STARTED:
			GEPPETTO.FE.updateStartEvent();
			break;
			//Simulation has been started, enable pause button
		case MESSAGE_TYPE.LIST_WATCH_VARS:
			GEPPETTO.Console.debugLog(LISTING_WATCH_VARS);
			// TODO: format output 
			formatListVariableOutput(JSON.parse(payload.list_watch_vars).variables, 0);
			//GEPPETTO.Console.log(JSON.stringify(payload));
			break;
		case MESSAGE_TYPE.LIST_FORCE_VARS:
			GEPPETTO.Console.debugLog(LISTING_FORCE_VARS);
			// TODO: format output
			formatListVariableOutput(JSON.parse(payload.list_force_vars).variables, 0);
			//GEPPETTO.Console.log(JSON.stringify(payload));
			break;
		default:

			break;
		}
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
				// we know it's a complex type - recurse! recurse!
				formatListVariableOutput(vars[i].type.variables, indent + 1);
			}
		}
	}
})();