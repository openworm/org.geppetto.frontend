

/**
 *
 * Handles running script inside Geppetto.
 *
 * @author   (jesus@metacell.us)
 */
define(function (require) {

    return function (GEPPETTO) {

        var simulationScripts = [];
        var waitingForPreviousCommand = false;
        var runningScript = false;
        var watchedRequestsIDS = [];
        var scriptMessageHandler = null;
        var remainingCommands = [];

        /**
         * Executes a set of commands from a script
         * @class GEPPETTO.ScriptRunner
         */
        GEPPETTO.ScriptRunner = {
            executeScriptCommands: function (commands) {

                runningScript = true;

                for (var i = 0, len = commands.length; i < len; i++) {
                    var command = commands[i].toString().trim();

                    if (command != "") {
                        //if it's the wait command,  call the the wait function
                        //with all remanining commands left to execute as parameter.
                        if (command.indexOf("G.wait") > -1) {
                            //get the ms time for waiting
                            var parameter = command.match(/\((.*?)\)/);
                            var ms = parameter[1];

                            //get the remaining commands
                            remainingCommands = commands.splice(i + 1, commands.length);

                            //call wait function with ms, and remaining commands to execute when done
                            GEPPETTO.G.wait(remainingCommands, ms);
                            return;
                        }
                        else {
                            //waiting for previous command to be done, exit loop
                            if (waitingForPreviousCommand) {
                                return;
                            }
                            //execute command
                            else {
                                GEPPETTO.CommandController.execute(command);
                                //keep track of reamaining commands
                                var clone = commands.slice();
                                remainingCommands = clone.splice(i + 1, clone.length - 1);
                            }
                        }
                    }
                }

                runningScript = false;
            },

            /**
             * Runs script data received from servlet
             */
            runScript: function (scriptData) {
                //create handler to receive message form server after sending commands
                GEPPETTO.ScriptRunner.addScriptMessageHandler();

                var commands = scriptData.split("\n");

                //format the commands, remove white spaces
                for (var c = 0; c < commands.length; c++) {
                    //commands[c] = commands[c].replace(/\s/g, "");
                    var lineC = commands[c];
                    if (!lineC) {
                        commands.splice(c, 1);
                    }
                }
                //execute the commands found inside script
                GEPPETTO.ScriptRunner.executeScriptCommands(commands);
            },

            /**
             * Creates handler to response to script commands. A command from the script that
             * is send to the server is identified with this handler, once it's detected it
             * fires subsequent commands in script
             */
            addScriptMessageHandler: function () {
                scriptMessageHandler = {
                    onMessage: function (parsedServerMessage) {
                        //get index of received command
                        var index = watchedRequestsIDS.indexOf(parsedServerMessage.requestID);

                        //make sure requestID received for command is one from the script
                        if (index > -1) {
                            //remove requestID from watched ids
                            watchedRequestsIDS.splice(index, 1);
                            if (watchedRequestsIDS.length <= 0) {
                                //reset flag if no longer waiting for commands to process
                                waitingForPreviousCommand = false;

                                //execute remaining commands
                                GEPPETTO.ScriptRunner.executeScriptCommands(remainingCommands);
                            }
                        }
                    }
                };

                //adds the handler to the socket class
                GEPPETTO.MessageSocket.addHandler(scriptMessageHandler);

            },

            /**
             * Let's script class know a request to server was made from a command within the script
             */
            waitingForServerResponse: function (requestID) {
                //flags that server is processing a command
                waitingForPreviousCommand = true;

                //keep track of request for command
                watchedRequestsIDS.push(requestID);
            },

            /**
             * Returns true if a script is already running
             */
            isScriptRunning: function () {
                return runningScript;
            },

            /**
             * Fires the scripts , one at a time
             */
            fireScripts: function (scripts) {
                //More than one script, fire first one and hold the other ones to execute later
                if (scripts.length > 1) {
                    //fire first script
                    var script = scripts[0].script;
                    GEPPETTO.CommandController.execute('G.runScript("' + script + '")');

                    //store the other one, will fire once first one is done
                    for (var i = 1; i < scripts.length; i++) {
                        simulationScripts.push(scripts[i].script);
                    }

                }
                //one script only, fire it
                else {
                    GEPPETTO.CommandController.execute('G.runScript("' + scripts[0].script + '")');
                }
            }
        };
    };
});