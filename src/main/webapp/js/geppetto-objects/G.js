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
 * Global objects. Handles global operations; clearing js console history commands, 
 * turning on/off debug statements, copying history commands, help info, etc.
 * 
 * @constructor

 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
var G = G ||
{
	REVISION : '1'
};

G.debugMode = false;

G.clear = function(){
	
	GEPPETTO.JSConsole.jsConsole.clear();
};

G.copyHistoryToClipboard = function(){
	
	var text =  JSON.stringify(GEPPETTO.JSConsole.jsConsole.model.get('history'), 0, 4);
	
	window.clipboardData.setData("Text", text);
	
	return text;
};

G.debug = function(toggle){
	G.debugMode = toggle;
	
	if(toggle){
		return "Debug log statements on";
	}
	else{
		return "Debug log statements off";
	}
};

G.isDebugOn = function(){
	return G.debugMode;
};

G.getCurrentSimulation = function(){
	return Simulation;
};

G.help = function(){
	var commands = "List of Commands for G: \n\n";

	  for ( var prop in G ) {
		  if(typeof G[prop] === "function") {
			  var f = G[prop].toString();
			  var match = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');
		      // its a function if you get here
			  commands += ("G."+prop+"("+match+");" + "\n");
		    };
	  }
	  	  
	  return commands.substring(0,commands.length-1);
};

G.runScript = function(url){
	return "Function under construction";
};

G.wait = function(ms){
	return "Function under construction";
};