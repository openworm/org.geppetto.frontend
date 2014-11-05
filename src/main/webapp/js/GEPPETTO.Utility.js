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

		GEPPETTO.Utility = {

				/**
				 * Extracts commands from Javascript files. Used by the help method in each object class,
				 * where it needs to retrieve commands, but not update existing list as UdateCommands() method.
				 *
				 * @param script - Script from where to read the commands and comments
				 * @param Object - Object from where to extract the commands
				 * @param objectName - Name of the object holding commands
				 *
				 * @returns - Formmatted commands with descriptions
				 */
				extractCommandsFromFile: function(script, Object, objectName) {
					var commandsFormatted = objectName + GEPPETTO.Resources.COMMANDS;

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
											if(line.indexOf("@command") == -1) {
												//build description for function
												matchedDescription += "         " + line + "\n";
											}
											
											//ignore the name line, already have it
											if(line.indexOf("@returns") != -1) {
												//build description for function
												var match = line.match(/\{.*?\}/);
												
												if(match!=null){
													if(match[0] == "{String}" && parameter!=""){
														functionName = functionName.replace("(","(\"");
														functionName = functionName.replace(")","\")");
													}
												}
											}
										}
									}
								}
							}
							//format and keep track of all commands available
							commandsFormatted += ("      -- " + functionName + "\n" + matchedDescription + "\n");
						}
						;
					}
					//returned formatted string with commands and description, remove last two blank lines
					return commandsFormatted.substring(0, commandsFormatted.length - 2);
				},

				/**
				 * Utility function for formatting output model tree
				 *
				 * @param node  - Node to traverse and print data
				 * @param indent - Indentation used for start of node
				 * @param previousNode - Formatted string with data
				 */
				formatmodeltree: function(node, indent, previousNode)
				{
					var formattedNode = previousNode;

					// node is always an array of variables
					for(var i in node) {
						if(typeof node[i] === "object" && node[i]!=null && i!= "attributes" && i!="parent") {
							var type = node[i]._metaType;

							if(type == "CompositeNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " +indentation;
								}
								formattedNode = formattedNode + indentation + i + "- [" +type + "]\n";

								// we know it's a complex type - recurse! recurse!
								formattedNode = GEPPETTO.Utility.formatmodeltree(node[i], indent + 1, formattedNode);
							}
							else if(type == "FunctionNode" || type  == "ParameterNode" || type == "ParameterSpecificationNode"
								|| type == "DynamicsSpecificationNode" || type  == "TextMetadataNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " + indentation;
								}
								formattedNode = formattedNode + indentation + i + "- [" +type + "]\n";
							}
						}
					}
					return formattedNode;
				},

				/**
				 * Utility function for formatting output of simulation tree	
				 *
				 * @param node  - Node to traverse and print data
				 * @param indent - Indentation used for start of node
				 * @param previousNode - Formatted string with data		 *
				 */
				formatsimulationtree: function(node, indent, previousNode)
				{
					var formattedNode = previousNode;

					// node is always an array of variables
					for(var i in node) {
						if(typeof node[i] === "object" && node[i]!=null && i!= "attributes") {
							var type = node[i]._metaType;

							if(node[i] instanceof Array){
								var array = node[i];

								for(var index in array){
									formattedNode = 
										this.formatsimulationtree(array[index], indent+1, formattedNode);
								}
							}
							else if(type == "CompositeNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " +indentation;
								}
								formattedNode = formattedNode + indentation + i +"\n";

								// we know it's a complex type - recurse! recurse!
								formattedNode = GEPPETTO.Utility.formatsimulationtree(node[i], indent + 2, formattedNode);
							}
							else if(type == "ParameterNode" || type  == "VariableNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " + indentation;
								}
								formattedNode = formattedNode + indentation + i + " : " + type + "\n";
							}
						}
					}
					return formattedNode;
				},
				
				/**
				 * Utility function for formatting output of visualization tree	
				 *
				 * @param node  - Node to traverse and print data
				 * @param indent - Indentation used for start of node
				 * @param previousNode - Formatted string with data		 *
				 */
				formatVisualizationTree: function(node, indent, previousNode)
				{
					var formattedNode = previousNode;

					// node is always an array of variables
					for(var i in node) {
						if(typeof node[i] === "object" && node[i]!=null && i!= "attributes") {
							var type = node[i]._metaType;

							if(node[i] instanceof Array){
								var array = node[i];

								for(var index in array){
									formattedNode = 
										this.formatVisualizationTree(array[index], indent+1, formattedNode);
								}
							}
							else if(type == "CompositeNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " +indentation;
								}
								formattedNode = formattedNode + indentation + i +"\n";

								// we know it's a complex type - recurse! recurse!
								formattedNode = GEPPETTO.Utility.formatVisualizationTree(node[i], indent + 2, formattedNode);
							}
							else if(type == "SphereNode" || type  == "CylinderNode" || type  == "ParticleNode"){
								var indentation = "   ↪";
								for(var j = 0; j < indent; j++) {
									indentation = " " + indentation;
								}
								formattedNode = formattedNode + indentation + i + " : " + type + "\n";
							}
						}
					}
					return formattedNode;
				},

				formatSelection : function(tree,formattedOutput, indentation){
					for(var e in tree){
						var entity = tree[e];
						if(entity.selected == true){
							formattedOutput = formattedOutput+indentation + entity.id + "\n";
							indentation = "      ↪";
						}
					}
					
					if(formattedOutput.lastIndexOf("\n")>0) {
						formattedOutput = formattedOutput.substring(0, formattedOutput.lastIndexOf("\n"));
					} 
					
					return formattedOutput.replace(/"/g, "");
				},
				
				formatEntitiesTree : function(tree,formattedOutput, indentation){
					for(var e in tree){
						var entity = tree[e];
						formattedOutput = formattedOutput+indentation + entity.id + " [Entity]\n";
						for(var a in entity.aspects){
							var aspect = entity.aspects[a];
							var aspectIndentation = "         ↪";
							formattedOutput = formattedOutput+ aspectIndentation + aspect.id +  " [Aspect]\n";
						}
						indentation = "      ↪";
					}
					
					if(formattedOutput.lastIndexOf("\n")>0) {
						formattedOutput = formattedOutput.substring(0, formattedOutput.lastIndexOf("\n"));
					} 
					
					return formattedOutput.replace(/"/g, "");
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
