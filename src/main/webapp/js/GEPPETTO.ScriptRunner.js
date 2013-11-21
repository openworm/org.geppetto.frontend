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
 * Handles running script inside Geppetto.
 * 
 * @constructor

 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
(function(){

	GEPPETTO.ScriptRunner = GEPPETTO.ScriptRunner ||
	{
		REVISION : '1'
	};

	/**
	 * Executes a set of commands from a script 
	 * 
	 * @param commands - commands to execute
	 */
	GEPPETTO.ScriptRunner.executeScriptCommands = function(commands){
		for (var i = 0, len = commands.length; i < len; i++) {
			var command = commands[i].toString().trim();
			var waitingPeriod = 0;
			
			if(GEPPETTO.MessageSocket.isServletBusy()){
				waitingPeriod = setInterval(function(){
					if(!GEPPETTO.MessageSocket.isServletBusy()){
						
						//get the remaining commands
						var remainingCommands = commands.splice(i,commands.length);

						GEPPETTO.ScriptRunner.executeScriptCommands(remainingCommands);
						
						clearInterval(waitingPeriod);
						
						return;
					}
				},500);
				
				return;
			}
			else{	
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
		}
	};
	
	/**
	 * Runs script data received from servlet
	 */
	GEPPETTO.ScriptRunner.runScript = function(scriptData){

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
		GEPPETTO.ScriptRunner.executeScriptCommands(commands);
	};
})();