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
 * Handles commands for widgets. 
 * 
 * @constructor

 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

var W = W ||
{
	REVISION : '1'
};

var Widgets = {
		PLOT : 0
	};

/**
 * Adds widget to Geppetto
 * 
 * @name W.addWidget(widgetType)
 * @param widgetType - Type of widget to add
 */
W.addWidget = function(widgetType){
	switch(widgetType){
	
	case Widgets.PLOT:
		var p = GEPPETTO.PlotsController.addPlotWidget();
		return p.getName() + " widget created";
		break;
	default: 
		break;
	}
};

/**
 * Removes widget from Geppetto
 * 
 * @name W.removeWidget(widgetType)
 * @param widgetType - Type of widget to remove
 */
W.removeWidget = function(widgetType){
switch(widgetType){
	
	case Widgets.PLOT:
		GEPPETTO.PlotsController.removePlotWidgets();
		return "Plotting widget(s) removed";
		break;
	default: 
		break;
	}
};

/**
 * Gets list of available widgets 
 * 
 * @name W.availableWidgets()
 * @returns {List} - List of available widgets
 */
W.availableWidgets = function(){

	return widgetsList;
};

/**
*
* Outputs list of commands with descriptions associated with the Simulation object.
* 
* @name W.help()
* @returns  Returns list of all commands for the Simulation object
*/
W.help = function(){
	var commands = W_COMMANDS;

	var descriptions = [];

	//retrieve the script to get the comments for all the methods
	$.ajax({ 
		async:false,
		type:'GET',
		url: "js/geppetto-objects/W.js",
		dataType:"text",
		//at success, read the file and extract the comments
		success:function(data) {			
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			descriptions = data.match(STRIP_COMMENTS);
		},
	});

	//find all functions of object Simulation
	for ( var prop in W ) {
		if(typeof W[prop] === "function") {
			var f = W[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = "W."+prop+"("+parameter+")";
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
*
* Outputs list of commands with descriptions associated with the Simulation object.
* 
* @name W.help()
* @returns  Returns list of all commands for the Simulation object
*/
Plot.help = function(){
	var commands = PLOT_COMMANDS;

	var descriptions = [];

	//retrieve the script to get the comments for all the methods
	$.ajax({ 
		async:false,
		type:'GET',
		url: "js/widgets/Plot.js",
		dataType:"text",
		//at success, read the file and extract the comments
		success:function(data) {			
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			descriptions = data.match(STRIP_COMMENTS);
		},
	});

	//find all functions of object Simulation
	for ( var prop in Plot ) {
		if(typeof Plot[prop] === "function") {
			var f = Plot[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = "Plot."+prop+"("+parameter+")";
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
