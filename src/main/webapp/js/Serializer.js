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

/*
 * Class use for creating namespace objects for the simulation states being watched.
 * Serializer is not used right now by Geppetto  
 */

/**
 * Method responsible for serializing values to simulation states
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
			arrayNode(parent,node, index, statePath);
		}
		else{
			window[node] = new State(node,0);
			
			if(parent!=null){
				window[parent][node] = new State(node,0);
			}
			
			statePath.splice(0,1);
			
			stringToObject(node, statePath);
		}
	}
	else{
		if(index != null){
			updateArrayNode(parent,node, index, statePath);
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

function arrayNode(parent,node, index, statePath){
	var iNumber =index[0].replace(/[\[\]']+/g,"");

	//create array object
	window[node] = [];
	
	var c = window[node][parseInt(iNumber)] = {};

	if(parent == null){
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
		var stateName = node+"["+parseInt(iNumber)+"]";
		window[parent][node][parseInt(iNumber)]= new State(stateName);
	}
}

function updateArrayNode(parent,node, index, statePath){
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

/**
 * Takes an object path and traverses through it to find the value within. 
 * Example :    {hhpop[0] : { v : 20 } }
 * 
 * Method will traverse through object to find the value "20" and update corresponding 
 * simulation state with it. If no simulation state exists, then it creates one. 
 */
function searchTreePath(a) {
	  var list = [];
	  (function(o, r) {
	    r = r || '';
	    if (typeof o != 'object') {
	      return true;
	    }
	    for (var c in o) {
	    	//if current tree path object is array
	    	if(!isNaN(c)){
	    		if (arguments.callee(o[c], r + (r!=""?"[":"") + c + (r!=""?"]":""))) {
	    			var val  = 0;
	    			if(o[c]!=null){
	    				val = o[c];
	    			}
	    			var rs = r.toString();
	    			//first object or no more children
	    			if(rs == ""){
	    				//simulation state already exists, update
	    				if(simulationStates[c]!=null){
	    					simulationStates[c].update(val);
	    				}
	    			}
	    			//object has leafs, add "." to name and update value if it exists
	    			else{
	    				if(simulationStates[r + "." + c]!=null){
	    					simulationStates[r + "." + c].update(val);
	    				}
	    			}
	    		}
	    	}
	    	//current path object from tree not an array
	    	else{
	    		var val  = 0;
    			if(o[c]!=null){
    				val = o[c];
    			}
    			
    			if(arguments.callee(o[c], r + (r!=""?".":"") + c + (r!=""?"":""))){
    				//root of path case, no more children
    				if(r == ""){
						simulationStates[c].update(val);
    				}
    				//within path of tree, add "." to note levels
    				else{
						var name = r + "." + c;

						simulationStates[name].update(val);

    				}
    			}
    		}
	      }
	    return false;
	  })(a);
	  return list;
	}


/**
 * Search through array looking for simulation states
 */
function searchTreeArray(variables){
	for(var v =0; v < variables.length; v++){
		var state = Simulation.watchTree.WATCH_TREE[v];

		if(state.name != null){
			updateState(state);
		}

		else{
			searchTreeObject(state);
		}	
	}		
}

/**
 * Search through object structure for object with value and name
 */
function searchTreeObject(obj){
	    for (var name in obj) {
	    	var value = obj[name];
	    	
	    	//state found, create or update its state
	    	updateState(name,value);
	    }
}