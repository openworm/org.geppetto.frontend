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

function deepFind(obj, path) {
	var paths = path.split('.')
	, current = obj
	, i;
	
	for (i = 0; i < paths.length; ++i) {
		//get index from node if it's array
		var index = paths[i].match(/[^[\]]+(?=])/g);
		
		if(index == null){
			if (current[paths[i]] == undefined) {
				return undefined;
			} else {
				current = current[paths[i]];
			}
		}
		else{
			var iNumber =index[0].replace(/[\[\]']+/g,"");
			
			//take index and brackets out of the equation for now
			var node = paths[i].replace(/ *\[[^]]*\] */g, "");

			if (current[node][parseInt(iNumber)] == undefined) {
				return undefined;
			} else {
				current = current[node][parseInt(iNumber)];
			}
		}
	}
	return current;
}