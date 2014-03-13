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
			var entities = JSON.parse(payload.update).entities;

			setSimulationLoaded();

			//Populate scene
			GEPPETTO.populateScene(entities);
			break;
			//Event received to update the simulation
		case MESSAGE_TYPE.SCENE_UPDATE:
			var starttime=(new Date()).getTime();

            var entities = JSON.parse(payload.update).entities;
            var variables = JSON.parse(payload.update).variable_watch;
            var time = JSON.parse(payload.update).time;
            
            if(time != null){
            	updateTime(time);
            }
            if(variables != null){
            	updateSimulationWatchTree(variables);
            }  
            
            //Update if simulation hasn't been stopped
            if(Simulation.status != Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated())
            {
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
            
            var endtime=(new Date()).getTime();
    		//console.log("took " + (endtime-starttime) + " to UPDATE SCENE");
    		
            // TODO: store variable-watch tree
            break;
            //Simulation server became available
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
		case MESSAGE_TYPE.FIRE_SIM_SCRIPTS:
			//Reads scripts received for the simulation
			var scripts = JSON.parse(payload.get_scripts).scripts;
			
			//make sure object isn't empty
			if(!jQuery.isEmptyObject(scripts)){
				//run the received scripts
				GEPPETTO.ScriptRunner.fireScripts(scripts);
			}
			else{
				//hide loading modal, no scripts associated with simulation
				$('#loadingmodal').modal('hide');
			}
			break;
			//Simulation has been started, enable pause button
		case MESSAGE_TYPE.SIMULATION_STARTED:
			GEPPETTO.FE.updateStartEvent();
			break;
		case MESSAGE_TYPE.SIMULATION_STOPPED:
			//Updates the simulation controls visibility
			GEPPETTO.FE.updateStopEvent();
			break;
		case MESSAGE_TYPE.SIMULATION_PAUSED:
			//Updates the simulation controls visibility
			GEPPETTO.FE.updatePauseEvent();
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
			formatListVariableOutput(JSON.parse(paylad.list_force_vars).variables, 0);
			//GEPPETTO.Console.log(JSON.stringify(payload));
			break;
		case MESSAGE_TYPE.GET_WATCH_LISTS:
			GEPPETTO.Console.debugLog(LISTING_FORCE_VARS);
			GEPPETTO.Console.log(payload.get_watch_lists);
			break;
		case MESSAGE_TYPE.SIMULATOR_FULL:
			var simulatorInfo = JSON.parse(payload.simulatorFull);
			
			var simulatorName = simulatorInfo.simulatorName;
			var queuePosition = simulatorInfo.queuePosition;
			
			GEPPETTO.FE.disableSimulationControls();
			GEPPETTO.FE.fullSimulatorNotification(simulatorName, queuePosition);
			break;
		//Starts the watch of requested variables
		case MESSAGE_TYPE.START_WATCH:
			//variables watching
			var variables = JSON.parse(payload.get_watch_lists)[0].variablePaths;
			
			//create objects for the variables to watch
			for(var v in variables){
				
				var splitVariableName = variables[v].split(".");

				var name = variables[v].replace(splitVariableName[0]+".", "");
							
				if(simulationStates[name]==null){
					stringToObject(name);
				}
			}
			break;
		case MESSAGE_TYPE.SET_WATCH_VARS:
			//variables watching
			var variables = JSON.parse(payload.get_watch_lists)[0].variablePaths;
			
			//create objects for the variables to watch
			for(var v in variables){
				
				var splitVariableName = variables[v].split(".");

				var name = variables[v].replace(splitVariableName[0]+".", "");
							
				if(simulationStates[name]==null){
					createSimState(name);
				}
			}
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
		var formattedNode = null;
		
		// vars is always an array of variables
		for(var i = 0; i < vars.length; i++) {
			var name  = vars[i].name;

			if(vars[i].aspect != "aspect"){
				var size = null;
				if (typeof(vars[i].size) != "undefined")
				{	
					// we know it's an array
					size = vars[i].size;
				}

				// print node
				var arrayPart = (size!=null) ? "[" + size + "]" : "";
				var indentation = "   ↪";
				for(var j=0; j<indent; j++){ indentation=indentation.replace("↪"," ") + "   ↪ "; }
				formattedNode = indentation + name + arrayPart;

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
			else{
				formattedNode = name;
				// print current node
				GEPPETTO.Console.log(formattedNode);
			}
		}
	}
})();

/**
 *Creates a Geppetto.SimState out of a simulation state path
 */
function createSimState(name){	
	//split the path of the object name
	var statePath = name.split(".");
	
	//create object from simulation states that have a path
	//e.g. "hhpop[0].v"
	if(statePath.length > 1 ){		
		stringToObject(null, statePath);
	}
	//create object for non path variable, single node simulation state
	//e.g. "dummyNode"
	else{
		//format name of the variable
		var singleVar = statePath[0];

		//create object with variable name and 0 as value
		if(window[singleVar]==null){
			window[singleVar] = new State(singleVar, 0);
			simulationStates[singleVar] = window[singleVar];
		}
	}
}

/**
 *
 */
function stringToObject(parent, statePath){
	//get first node from path
	var node = statePath[0];
	
	//get index from node if it's array
	var index = node.match(/[^[\]]+(?=])/g);
	
	//take index and brackets out of the equation for now
	node = node.replace(/ *\[[^]]*\] */g, "");
	
	if(window[node] == null){
		//we have an array
		if(index != null){

			var iNumber =index[0].replace(/[\[\]']+/g,"");
			
			//create array object
			window[node] = [];
			var c = window[node][parseInt(iNumber)] = {};
			
			var stateName = node+"["+parseInt(iNumber)+"]";
			
			for(var x =1; x< statePath.length; x++){
				var child = statePath[x];
				stateName = stateName+"."+child;

				c = c[child] = new State(stateName);								
			}
			
			c = new State(stateName, 0);
			
			simulationStates[stateName] = c;
		}
		else{
			window[node] = new State(node,0);
			
			if(parent!=null){
				window[parent].push(window[node]);
			}
			
			statePath.splice(0,1);
			
			stringToObject(node, statePath);
		}
	}
	else{
		if(index != null){
			var iNumber =index[0].replace(/[\[\]']+/g,"");
										
			var c = window[node][parseInt(iNumber)];
			
			var stateNamePath = node+"["+parseInt(iNumber)+"]";
			
			for(var x =1; x< statePath.length; x++){
				var child = statePath[x];
				stateNamePath = stateNamePath+"."+child;

				if(c[child] == null){
					c[child] = new State(stateNamePath,0);
				}
				
				c = c[child];								
			}
			
			if(parent!=null){
				stateNamePath = parent + "." + stateNamePath;
			}
			
			c = new State(stateNamePath, 0);
			
			simulationStates[stateNamePath] = c;			
		}
		else{
			window[node] = new State(node,0);
			
			if(parent!=null){
				window[parent].push(window[node]);
			}
			
			statePath.splice(0,1);
			
			stringToObject(node, statePath);
		}
	}
}