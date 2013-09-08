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
 */
G.clear = function(){

	GEPPETTO.JSConsole.jsConsole.clear();
};

/**
 * Copies console history to OS clipboard 
 * 
 * @returns {String}
 */
G.copyHistoryToClipboard = function(){

	var text =  JSON.stringify(GEPPETTO.JSConsole.jsConsole.model.get('history'), 0, 4);
	var commands = JSON.parse(text);	
	var commandsString = "";

	for(var i=0; i<commands.length; i++){
		var n = commands[i];
		commandsString += n.command +'\n';
	}
	
	
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
	
	return "Copying history to clipboard";
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
 * @param toggle - toggles debug statements
 * 
 * @returns {String}
 */
G.debug = function(toggle){
	G.debugMode = toggle;

	if(toggle){
		return "Debug log statements on";
	}
	else{
		return "Debug log statements off";
	}
};

/**
 * Returns current Simulation object if it exists
 * 
 * @returns
 */
G.getCurrentSimulation = function(){
	//return simulation object if one has been loaded
	if(Simulation.isLoaded()){
		return JSON.stringify(Simulation);
	}
	else{
		return "No Simulation to get as none is running";
	}
};

/**
 * Get all commands available for object G
 * 
 * @returns {String}
 */
G.help = function(){
	var header = "Global commands: \n\n";
	var commands = "";

	//Find all available functions inside objectG
	for ( var prop in G ) {
		//match function
		if(typeof G[prop] === "function") {
			var f = G[prop].toString();
			//get function parameter
			var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');
			// keep track of commands,format a little
			commands += ("      -- G."+prop+"("+parameter+");" + "\n");
		};
	}

	//return list of commands, remove empty line from the end
	return header + commands.substring(0,commands.length-1);
};

/**
 * Takes the URL corresponding to a script, executes 
 * commnands inside the script.
 * 
 * @param scriptURL - URL of script to execute
 */
G.runScript = function(scriptURL){	

	//retrieve the script
	$.ajax({ 
		async:false,
		type:'GET',
		url:scriptURL,
		dataType:"text",
		//at success, read the file and extract the commands
		success:function(data) {
			var commands = data.split("\n");
			
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
		}, });	
	
	return "Running Script"; 
};

G.wait = function(){
	return "G.wait(ms) command must be used inside script";
};

/**
 * Waits some amount of time before executing a set of commands
 * 
 * @param commands - commands to execute
 * @param ms - milliseconds to wait before executing commands
 */
G.wait = function(commands, ms){
	setTimeout(function()
	{
		//execute commands after ms milliseconds
		Console.executeCommand(executeScriptCommands(commands));
	}, ms);
};

/**
 * Returns true/false depending if debug statements are turn on/off.
 * 
 * @returns
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
				Console.executeCommand(command);
			}
		}
	}
};