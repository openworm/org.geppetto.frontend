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
 * Utility class for helper functions
 */

var tags = [];

var helpMsg = null;

 /**
 * Global help functions with all commands in global objects. 
 * 
 * @returns {String} - Message with help notes.
 */
function help(){
	if(helpMsg == null){
		helpMsg = ALL_COMMANDS_AVAILABLE_MESSAGE + G.help() + '\n\n' + Simulation.help();
	}
	
	return helpMsg;
};

function updateHelp(newObjectCommands){
	helpMsg = helpMsg + '\n\n' + newObjectCommands;
	
	GEPPETTO.Console.log("New help " + helpMsg);
};

/**
 * Extracts commands from Javascript files 
 * 
 * @param script - Script from where to read the commands and comments
 * @param Object - Object from where to extract the commands
 * @param objectName - Name of the object holding commands
 * 
 * @returns - Formmatted commands with descriptions
 */
function extractCommandsFromFile(script, Object, objectName){
	var commands = objectName + COMMANDS;

	var descriptions = [];

	//retrieve the script to get the comments for all the methods
	$.ajax({ 
		async:false,
		type:'GET',
		url: script,
		dataType:"text",
		//at success, read the file and extract the comments
		success:function(data) {			
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			descriptions = data.match(STRIP_COMMENTS);
		},
	});

	//find all functions of object Simulation
	for ( var prop in Object ) {
		if(typeof Object[prop] === "function") {
			var f = Object[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = objectName + "."+prop+"("+parameter+")";
			
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
			commands += ("      -- "+functionName + "\n" + matchedDescription + "\n");
		};
	}	

	//returned formatted string with commands and description, remove last two blank lines
	return commands.substring(0,commands.length-2);
}
 
/**
 * Available commands stored in an array, used for autocomplete
 * 
 * @returns {Array}
 */
function availableTags(){

	var commands = "\n" +  "Simulation" + "\n" + Simulation.help() + "\n" +  G.help();

	var commandsSplitByLine = commands.split("\n");

	var tagsCount = 0;

	for(var i =0; i<commandsSplitByLine.length; i++){
		var line = commandsSplitByLine[i].trim();

		if(line.substring(0,2) == "--"){
			var command = line.substring(3, line.length);
			tags[tagsCount] = command;
			tagsCount++;
		}
	}

	return tags;
};

function addTags(scriptLocation, object, name){
	var nonCommands = ["initialize()", "constructor()", "render()", "bind(a,b,c)", "unbind(a,b)","trigger(a)",
	                   "$(a)", "make(a)", "remove()", "delegateEvents(a)", "_configure(a)", "_ensureElement()"];

	var commands = name + COMMANDS;

	var tagsCount = tags.length;
	
//	find all functions of object Simulation
	for ( var prop in object ) {
		if(typeof object[prop] === "function") {
			var f = object[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = name + "."+prop+"("+parameter+")";

			var isCommand = true;
			for(var c =0; c<nonCommands.length; c++){
				if(functionName.indexOf(nonCommands[c])!=-1){
					isCommand = false;
				}
			}		

			if(isCommand){
				tags[tagsCount] = functionName;
				tagsCount++;
				//format and keep track of all commands available
				commands += ("      -- "+functionName + "\n\n");
			}
		};
	}	

	//update help message
	updateHelp(commands.substring(0,commands.length-2));
}

function removeTags(name, object){
	
}
//function addTags(scriptLocation, object, name){
//	var nonCommands = ["initialize()", "constructor()", "render()", "bind(a,b,c)", "unbind(a,b)","trigger(a)",
//	                   "$(a)", "make(a)", "remove()", "delegateEvents(a)", "_configure(a)", "_ensureElement()"];
//	
//	var commands = name + COMMANDS;
//
//	var descriptions = [];
//
//	//retrieve the script to get the comments for all the methods
//	$.ajax({ 
//		async:false,
//		type:'GET',
//		url: scriptLocation,
//		dataType:"text",
//		//at success, read the file and extract the comments
//		success:function(data) {			
//			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
//			descriptions = data.match(STRIP_COMMENTS);
//		},
//	});
//
//	//find all functions of object Simulation
//	for ( var prop in object ) {
//		if(typeof object[prop] === "function") {
//			var f = object[prop].toString();
//			//get the argument for this function
//			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');
//
//			var functionName = name + "."+prop+"("+parameter+")";
//			
//			var isCommand = true;
//			for(var c =0; c<nonCommands.length; c++){
//				if(functionName.indexOf(nonCommands[c])!=-1){
//					isCommand = false;
//				}
//			}		
//
//			if(isCommand){
//			//match the function to comment
//			var matchedDescription = "";
//			for(var i = 0; i<descriptions.length; i++){
//				var description = descriptions[i].toString();
//				
//				GEPPETTO.Console.log("is command " + description);
//				//items matched
//				if(description.indexOf(prop)!=-1){
//
//					/*series of formatting of the comments for the function, removes unnecessary 
//					 * blank and special characters.
//					 */
//					var splitComments = description.replace(/\*/g, "").split("\n");
//					splitComments.splice(0,1);
//					splitComments.splice(splitComments.length-1,1);
//					for(var s = 0; s<splitComments.length; s++){
//						var line = splitComments[s].trim();
//						if(line != ""){
//							//ignore the name line, already have it
//							if(line.indexOf("@name")==-1){
//								//build description for function
//								matchedDescription += "         " + line + "\n";
//							}
//						}
//					}
//				}
//			}
//				
//			//format and keep track of all commands available
//			commands += ("      -- "+functionName + "\n" + matchedDescription + "\n");
//			}
//		};
//	}	
//
//	//returned formatted string with commands and description, remove last two blank lines
//	updateHelp(commands.substring(0,commands.length-2));
//}