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

	var simulationScripts = [];

	var waitingForPreviousCommand = false; 
	
	var runningScript =false;
	
	var watchedRequestsIDS = [];
	
	var scriptMessageHandler = null;
	
	var remainingCommands = [];
	
	/**
	 * Executes a set of commands from a script 
	 * 
	 * @param commands - commands to execute
	 */
	GEPPETTO.ScriptRunner.executeScriptCommands = function(commands){
		
		runningScript = true;
		
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
					remainingCommands = commands.splice(i+1,commands.length);

					//call wait function with ms, and remaining commands to execute when done
					G.wait(remainingCommands, ms);
					return;
				}

				//execute commands, except the wait one
				else{
					GEPPETTO.Console.executeCommand(command);
					
					//if last command executed it's waiting on server response, break from loop and 
					//keep track of remaining commands to execute later
					if(waitingForPreviousCommand){
						//get the remaining commands
						remainingCommands = commands.splice(i+1,commands.length);
						break;
					}
				}
			}
			
			//End of commands, check if there's more scripts waiting to be run
			if(commands.length == (i+1) ){
				//more scripts waiting to be run
				if(simulationScripts.length > 0){
					//run next script
					var script = simulationScripts[0];
					GEPPETTO.Console.executeCommand('G.runScript("'+script+'")');
					
					simulationScripts.splice(0,1);
				}
				//no more scripts waiting to be run, remove handler and loading panel
				else{
					GEPPETTO.MessageSocket.removeHandler(scriptMessageHandler);
					runningScript = false;
					$('#loadingmodal').modal('hide');
				}
			}		
		}		
	};
	
	/**
	 * Runs script data received from servlet
	 */
	GEPPETTO.ScriptRunner.runScript = function(scriptData){
		//create handler to receive message form server after sending commands 
		GEPPETTO.ScriptRunner.addScriptMessageHandler();

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

	/**
	 * Creates handler to response to script commands. A command from the script that 
	 * is send to the server is identified with this handler, once it's detected it 
	 * fires subsequent commands in script
	 */
	GEPPETTO.ScriptRunner.addScriptMessageHandler = function(){
		scriptMessageHandler = {
				onMessage : function(parsedServerMessage){
					//get index of received command
					var index = watchedRequestsIDS.indexOf(parsedServerMessage.requestID);
					
					//make sure requestID received for command is one from the script
					if (index > -1) {
						//remove requestID from watched ids
					    watchedRequestsIDS.splice(index, 1);
					    if(watchedRequestsIDS.length <= 0 ){
					    	//reset flag if no longer waiting for commands to process
					    	waitingForPreviousCommand = false;
					    }
					    //execute remaining commands
					    if(remainingCommands.length > 0){
							GEPPETTO.ScriptRunner.executeScriptCommands (remainingCommands);
						}
					}
				}
		};

		//adds the handler to the socket class
		GEPPETTO.MessageSocket.addHandler(scriptMessageHandler);
	};
	
	/**
	 * Let's script class know a request to server was made from a command within the script
	 */
	GEPPETTO.ScriptRunner.waitingForServerResponse = function(requestID){
		//flags that server is processing a command
		waitingForPreviousCommand = true;
		
		//keep track of request for command
		watchedRequestsIDS.push(requestID);		
	};
	
	/**
	 * Returns true if a script is already running
	 */
	GEPPETTO.ScriptRunner.isScriptRunning = function(){
		return runningScript;
	};
	
	/**
	 * Fires the scripts , one at a time
	 */
	GEPPETTO.ScriptRunner.fireScripts = function(scripts){				
		//More than one script, fire first one and hold the other ones to execute later
		if(scripts.length > 1){
			//fire first script
			var script = scripts[0].script;
			GEPPETTO.Console.executeCommand('G.runScript("'+script+'")');
			
			//store the other one, will fire once first one is done
			for(var i =1; i< scripts.length; i++){
				var script = scripts[i].script;
				simulationScripts.push(script);
			}
			
		}
		//one script only, fire it
		else{
			var script = scripts[0].script;
			GEPPETTO.Console.executeCommand('G.runScript("'+script+'")');
		}
	};
})();