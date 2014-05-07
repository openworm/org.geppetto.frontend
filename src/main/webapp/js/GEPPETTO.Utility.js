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
 *      OpenWorm - http://openworm.org/people.html
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
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery');
		var tags = [];
		var helpObjectsMap;
		var helpMsg = GEPPETTO.Resources.ALL_COMMANDS_AVAILABLE_MESSAGE;
		var getHelpObjectsMap = function() {
			if(helpObjectsMap == null) {
				helpObjectsMap = {"G": GEPPETTO.G.help(), "Simulation": GEPPETTO.Simulation.help()};
			}
			return helpObjectsMap;
		};

		GEPPETTO.Utility = {
			/**
			 * Global help functions with all commands in global objects.
			 *
			 * @returns {String} - Message with help notes.
			 */
			help: function() {

				var map = getHelpObjectsMap();

				for(var g in map) {
					helpMsg += '\n\n' + map[g];
				}

				return helpMsg;
			},

			/**
			 * Extracts commands from Javascript files
			 *
			 * @param script - Script from where to read the commands and comments
			 * @param Object - Object from where to extract the commands
			 * @param objectName - Name of the object holding commands
			 *
			 * @returns - Formmatted commands with descriptions
			 */
			extractCommandsFromFile: function(script, Object, objectName) {
				var commands = objectName + GEPPETTO.Resources.COMMANDS;

				var descriptions = [];

				//retrieve the script to get the comments for all the methods
				$.ajax({
					async: false,
					type: 'GET',
					url: script,
					dataType: "text",
					//at success, read the file and extract the comments
					success: function(data) {
						var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
						descriptions = data.match(STRIP_COMMENTS);
					}
				});

				//find all functions of object Simulation
				for(var prop in Object) {
					if(typeof Object[prop] === "function") {
						var f = Object[prop].toString();
						//get the argument for this function
						var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

						var functionName = objectName + "." + prop + "(" + parameter + ")";

						//match the function to comment
						var matchedDescription = "";
						for(var i = 0; i < descriptions.length; i++) {
							var description = descriptions[i].toString();

							//items matched
							if(description.indexOf(functionName) != -1) {

								/*series of formatting of the comments for the function, removes unnecessary
								 * blank and special characters.
								 */
								var splitComments = description.replace(/\*/g, "").split("\n");
								splitComments.splice(0, 1);
								splitComments.splice(splitComments.length - 1, 1);
								for(var s = 0; s < splitComments.length; s++) {
									var line = splitComments[s].trim();
									if(line != "") {
										//ignore the name line, already have it
										if(line.indexOf("@name") == -1) {
											//build description for function
											matchedDescription += "         " + line + "\n";
										}
									}
								}
							}
						}
						//format and keep track of all commands available
						commands += ("      -- " + functionName + "\n" + matchedDescription + "\n");
					}
					;
				}
				//returned formatted string with commands and description, remove last two blank lines
				return commands.substring(0, commands.length - 2);
			},

			/**
			 * Available commands stored in an array, used for autocomplete
			 *
			 * @returns {Array}
			 */
			availableTags: function() {
				if(tags.length == 0) {
					var commands = "\n";
					var map = getHelpObjectsMap();
					for(var g in map) {
						commands += '\n' + map[g];
					}
					var commandsSplitByLine = commands.split("\n");
					var tagsCount = 0;
					for(var i = 0; i < commandsSplitByLine.length; i++) {
						var line = commandsSplitByLine[i].trim();
						if(line.substring(0, 2) == "--") {
							var command = line.substring(3, line.length);
							tags[tagsCount] = command;
							tagsCount++;
						}
					}
				}
				return tags;
			},

			/**
			 * Remove tags that correspond to target object
			 *
			 * @param targetObject - Object whose command should no longer exist
			 */
			removeAutocompleteTags: function(targetObject) {

				//loop through tags and match the commands for object
				for(var index = 0; index < tags.length; index++) {
					if(tags[index].indexOf(targetObject + ".") !== -1) {
						tags.splice(index, 1);
						//go back one index spot after deletion
						index--;
					}
				}
			},

			/**
			 * Returns the commands associated with the object
			 *
			 * @param id - Id of object for commands
			 * @returns
			 */
			getObjectCommands: function(id) {
				return getHelpObjectsMap()[id];
			},

			/**
			 * Update commands for help option. Usually called after widget
			 * is created.
			 *
			 * @param scriptLocation - Location of files from where to read the comments
			 * @param object - Object whose commands will be added
			 * @param id - Id of object
			 * @returns
			 */
			updateCommands: function(scriptLocation, object, id) {
				var nonCommands = ["initialize()", "constructor()", "render()", "bind(a,b,c)", "unbind(a,b)", "trigger(a)",
					"$(a)", "make(a)", "remove()", "delegateEvents(a)", "_configure(a)", "_ensureElement()", "off(t,e,r)",
					"on(t,e,i)", "once(t,e,r)", "listenTo(e,r,s)", "listenToOnce(e,r,s)", "stopListening(t,e,r)",
					"trigger(t)", "unbind(t,e,r)", "$(t)", "bind(t,e,i)", "setElement(t,i)", "delegateEvents(t)",
					"undelegateEvents()"];

				var descriptions = [];

				//retrieve the script to get the comments for all the methods
				$.ajax({
					async: false,
					type: 'GET',
					url: scriptLocation,
					dataType: "text",
					//at success, read the file and extract the comments
					success: function(data) {
						var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
						descriptions = data.match(STRIP_COMMENTS);
					}
				});

				var commands = id + GEPPETTO.Resources.COMMANDS;

				var tagsCount = tags.length;

				//	find all functions of object Simulation
				for(var prop in object) {
					if(typeof object[prop] === "function") {
						var f = object[prop].toString();
						//get the argument for this function
						var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

						var functionName = id + "." + prop + "(" + parameter + ")";

						var isCommand = true;
						for(var c = 0; c < nonCommands.length; c++) {
							if(functionName.indexOf(nonCommands[c]) != -1) {
								isCommand = false;
							}
						}

						if(isCommand) {
							tags[tagsCount] = functionName;
							tagsCount++;
							//match the function to comment
							var matchedDescription = "";
							for(var i = 0; i < descriptions.length; i++) {
								var description = descriptions[i].toString();

								//items matched
								if(description.indexOf(prop) != -1) {

									/*series of formatting of the comments for the function, removes unnecessary
									 * blank and special characters.
									 */
									var splitComments = description.replace(/\*/g, "").split("\n");
									splitComments.splice(0, 1);
									splitComments.splice(splitComments.length - 1, 1);
									for(var s = 0; s < splitComments.length; s++) {
										var line = splitComments[s].trim();
										if(line != "") {
											//ignore the name line, already have it
											if(line.indexOf("@name") == -1) {
												//build description for function
												matchedDescription += "         " + line + "\n";
											}
										}
									}
								}
							}
							//format and keep track of all commands available
							commands += ("      -- " + functionName + "\n" + matchedDescription + "\n");
						}
					}
					;
				}

				//after commands and comments are extract, update global help option
				getHelpObjectsMap()[id] = commands.substring(0, commands.length - 2);
			},

			addTag: function(tagName) {
				tags.push(tagName);
			},

			removeTags: function(id) {

				GEPPETTO.Utility.removeAutocompleteTags(id);
				delete getHelpObjectsMap()[id];

			},
			
			/**
			 * Search obj for the value of node within using path.
			 * E.g. If obj = {"tree":{"v":1}} and path is "tree.v", it will
			 * search within the obj to find the value of "tree.v", returning object 
			 * containing {value : val, unit : unit, scale : scale}.
			 */
			deepFind: function(tree, state){
				var paths = state.split('.')
				, current = tree
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
		};
	};
});
