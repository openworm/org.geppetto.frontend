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
 * THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * 
 * Global class that stores resource strings 
 * 
 * @constructor

 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

/**
 * Simulation Object Resources
 */
var SIMULATION_LOADED = "Simulation Loaded";

var SIMULATION_STARTED = "Simulation Started";

var UNABLE_TO_START_SIMULATION = "Simulation not loaded; must load simulation first";

var SIMULATION_PAUSED = "Simulation Paused";

var UNABLE_TO_PAUSE_SIMULATION = "Simulation not running; must run simulation first";

var SIMULATION_STOP = "Simulation Stopped"; 

var LOADING_SIMULATION = "Loading Simulation";

var SIMULATION_NOT_RUNNING = "Unable to stop simulation; loaded but not running";

var SIMULATION_NOT_LOADED = "Unable to stop simulation that hasn't been loaded";

var SIMULATION_UNSPECIFIED = "Simulation not specified";

var SIMULATION_ALREADY_STOPPED = "Simulation was already stopped";

var SIMULATION_COMMANDS = "Simulation control commands: \n\n";

var LOADING_FROM_CONTENT= "Outbound Message Sent: Load Simulation from editing console";

var MESSAGE_OUTBOUND_LOAD = 'Outbound Message Sent: Loading Simulation';

var MESSAGE_OUTBOUND_STOP = 'Outbund Message Sent: Simulation Stopped';

var MESSAGE_OUTBOUND_PAUSE = 'Outbund Message Sent: Simulation Paused';

var MESSAGE_OUTBOUND_START = 'Outbund Message Sent: Simulation Started';


/**
 * Object G resources
 */
var RUNNING_SCRIPT = "Running script";

var NO_SIMULATION_TO_GET = "No Simulation to get as no simulation is running";

var DEBUG_ON = "Debug log statements on";

var DEBUG_OFF = "Debug log statements off";

var CLEAR_HISTORY = "Console history cleared";

var COPY_CONSOLE_HISTORY = "Copying history to clipboard";

var EMPTY_CONSOLE_HISTORY = "No console history to copy to clipboard";

var COPY_TO_CLIPBOARD_WINDOWS = "Copy to Clipboard: CTRL+C , OK";

var COPY_TO_CLIPBOARD_MAC = "Copy to Clipboard: Cmd+C , OK";
	
var INVALID_WAIT_USE = "G.wait(ms) command must be used inside script";

var WAITING = "Waiting ms";

var G_COMMANDS = "G object commands: \n\n";

/**
 * GEPPETTO.Main resources
 */
var GEPPETTO_INITIALIZED = 'Geppetto Initialised';

var SIMULATION_OBSERVED = 'Sent: Simulation being observed';

var WEBSOCKET_NOT_SUPPORTED = 'Error: WebSocket is not supported by this browser.';

var WEBSOCKET_OPENED = 'Info: WebSocket connection opened';

var WEBSOCKET_CLOSED = "Info: WebSocket connection closed";
	
var CLEAR_CANVAS = "Inbound Message Received: Clear canvas";

var INVALID_SIMULATION_FILE = "Invalid Simulation File";

var LOADING_MODEL = "Inbound Message Received: Loading Model ";

var OBSERVING_MODE = "Observing Simulation Mode";

var SERVER_UNAVAILABLE = "Server Unavailable";

var SERVER_AVAILABLE = "Server Available";

var WEBGL_FAILED = "Initializing Error: Unable to initialize WebGL";

var ALL_COMMANDS_AVAILABLE_MESSAGE = "The following commands are available in the Geppetto console.\n\n";

var GEPPETTO_VERSION_HOLDER = "Geppetto v$1 is ready";


/**
 * GEPPETTO resources
 */
var UPDATE_FRAME_STARTING = "Starting update frame";

var UPDATE_FRAME_END = "Ending update frame";

/**
 * GEPPETTO.SimulationContentEditor resources
 */
var SAMPLES_DROPDOWN_PLACEHOLDER = "Select simulation from list...";

/**
 * Global help function with all commands in global objects. 
 * 
 * @returns {String}
 */
function help(){
	return ALL_COMMANDS_AVAILABLE_MESSAGE+G.help() + '\n\n' + Simulation.help();
};
