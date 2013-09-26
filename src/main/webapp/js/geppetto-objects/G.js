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

/**
 * Clears the console history
 * 
 * @name G.clear()
 */
G.clear = function(){

	GEPPETTO.Console.console.clear();
	
	return CLEAR_HISTORY;
};

/**
 * Copies console history to OS clipboard 
 * 
 * @name G.copyHistoryToClipboard()
 */
G.copyHistoryToClipboard = function(){

	var text =  JSON.stringify(GEPPETTO.Console.consoleHistory(), 0, 4);
	var commands = JSON.parse(text);	
	var commandsString = "";

	for(var i=0; i<commands.length; i++){
		var n = commands[i];
		if(n.command != null || typeof n.command != "undefined"){
			commandsString += n.command.trim() +";" + '<br>';
		}
	}

	if(commandsString != ""){
		var message = "Copy to Clipboard: Ctrl+C , OK";

		//different command for copying in macs means different message
		var mac=navigator.userAgent.match(/(Mac|iPhone|iPod|iPad)/i)?true:false;

		if(mac){
			message = "Copy to Clipboard: Cmd+C , OK";
		}

		//show alert window with clipboard history
		$('#infomodal-title').html(message);
		$('#infomodal-text').html(commandsString);
		$('#infomodal').css('height', 200);
		$('#infomodal').modal();

		//auto select text for user
		$('#infomodal').on('shown', function(){
			SelectText('infomodal-text');
		});
		
		return COPY_CONSOLE_HISTORY;
	}
	else{
		return EMPTY_CONSOLE_HISTORY;
	}
};

/**
 * Takes an html element and selects all text within
 * 
 * @param element - element whose text will be auto selected
 */
function SelectText(element) {
    var doc = document;
    var text = doc.getElementById(element);    
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Toggles debug statement on/off
 * 
 * @name G.debug(toggle)
 * @param toggle - toggles debug statements
 * 
 */
G.debug = function(toggle){
	G.debugMode = toggle;

	if(toggle){
		return DEBUG_ON;
	}
	else{
		return DEBUG_OFF;
	}
};

/**
 * Gets the object for the current Simulation, if any. 
 * 
 * @name G.getCurrentSimulation()
 * @returns Returns current Simulation object if it exists
 */
G.getCurrentSimulation = function(){
	//return simulation object if one has been loaded
	if(Simulation.isLoaded()){
		return JSON.stringify(Simulation);
	}
	else{
		return NO_SIMULATION_TO_GET;
	}
};

/**
 * Get all commands and descriptions available for object G. 
 * 
 * @name G.help()
 * @returns {String} - All commands and descriptions for G.
 */
G.help = function(){
	var commands = "G object commands: \n\n";

	var descriptions = [];

	//retrieve the script to get the comments for all the methods
	$.ajax({ 
		async:false,
		type:'GET',
		url: "js/geppetto-objects/G.js",
		dataType:"text",
		//at success, read the file and extract the comments
		success:function(data) {			
			var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
			descriptions = data.match(STRIP_COMMENTS);
		},
	});

	//find all functions of object Simulation
	for ( var prop in G ) {
		if(typeof G[prop] === "function") {
			var f = G[prop].toString();
			//get the argument for this function
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');

			var functionName = "G."+prop+"("+parameter+")";
			
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
};

/**
 * Takes the URL corresponding to a script, executes 
 * commands inside the script.
 * 
 * @name G.runScript(scriptURL)
 * @param scriptURL - URL of script to execute
 */
G.runScript = function(scriptURL){	

	GEPPETTO.Main.socket.send(messageTemplate("run_script", scriptURL));
	
	return RUNNING_SCRIPT; 
};

/**
 * Runs script data
 */
function runScript(scriptData){

	var commands = scriptData.split("\n");

	//format the commands, remove white spaces
	for(var c = 0; c<commands.length; c++){
		commands[c] = commands[c].replace(/\s/g,"");
		var lineC = commands[c];
		if(lineC.toString() === ""){
			commands.splice(c,1);
		}
	}
	//execute the commands found inside script
	executeScriptCommands(commands);
}

/**
 * 
 * Waits certain amount of time before running next command. Must be 
 * used inside a script. 
 * 
 * @name G.wait(ms)
 * @param ms - Amount of time to wait.
 */
G.wait = function(ms){
	return "G.wait(ms) command must be used inside script";
};

/**
 * Waits some amount of time before executing a set of commands
 * 
 * @name G.wait(commands,ms)
 * @param commands - commands to execute
 * @param ms - milliseconds to wait before executing commands
 */
G.wait = function(commands, ms){
	setTimeout(function()
	{
		//execute commands after ms milliseconds
		GEPPETTO.Console.executeCommand(executeScriptCommands(commands));
	}, ms);
	
	return "Waiting ms";
};

/**
 * State of debug statements, whether they are turned on or off.
 * 
 * @returns {boolean} Returns true or false depending if debug statements are turned on or off.
 */
function isDebugOn(){
	return G.debugMode;
};

/**
 * Executes a set of commands from a script 
 * 
 * @param commands - commands to execute
 */
function executeScriptCommands(commands){
	for (var i = 0, len = commands.length; i < len; i++) {
		var command = commands[i].toString().trim();

		if(command != ""){
			//if it's the wait command,  call the the wait function 
			//with all remanining commands left to execute as parameter.
			if ( command.indexOf("G.wait") > -1 ) {
				//get the ms time for waiting
				var parameter = command.match(/\((.*?)\)/);
				var ms = parameter[1];
				
				//get the remaining commands
				var remainingCommands = commands.splice(i+1,commands.length);
				
				//call wait function with ms, and remaining commands to execute when done
				G.wait(remainingCommands, ms);
				
				return;
			}

			//execute commands, except the wait one
			else{
				GEPPETTO.Console.executeCommand(command);
			}
		}
	}
};
