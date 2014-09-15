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
define(function(require) {
	return function(GEPPETTO) {
		GEPPETTO.Resources = {
			SIMULATION_LOADED: "Simulation Loaded",
			SIMULATION_STARTED: "Simulation Started",

			UNABLE_TO_START_SIMULATION: "Simulation not loaded, must load simulation first",

			SIMULATION_PAUSED: "Simulation Paused",

			UNABLE_TO_PAUSE_SIMULATION: "Simulation not running, must run simulation first",

			SIMULATION_STOP: "Simulation Stopped",

			LOADING_SIMULATION: "Loading Simulation",

			LOADING_SIMULATION_SLOW : "Still loading, but things are taking longer than expected, are you on low bandwidth?",
			
			SIMULATION_NOT_RUNNING: "Unable to stop simulation, loaded but not running",

			SIMULATION_NOT_LOADED: "Unable to stop simulation that hasn't been loaded",

			SIMULATION_UNSPECIFIED: "Simulation not specified",

			SIMULATION_ALREADY_STOPPED: "Simulation was already stopped",

			LOADING_FROM_CONTENT: "Outbound Message Sent: Load Simulation from editing console",

			MESSAGE_OUTBOUND_LOAD: 'Outbound Message Sent: Loading Simulation',

			MESSAGE_OUTBOUND_STOP: 'Outbund Message Sent: Simulation Stopped',

			MESSAGE_OUTBOUND_PAUSE: 'Outbund Message Sent: Simulation Paused',

			MESSAGE_OUTBOUND_START: 'Outbund Message Sent: Simulation Started',

			MESSAGE_OUTBOUND_LIST_WATCH: 'Outbund Message Sent: List watchable variables',

			MESSAGE_OUTBOUND_LIST_FORCE: 'Outbund Message Sent: List forceable variables',

			MESSAGE_OUTBOUND_SET_WATCH: 'Outbund Message Sent: add watch lists',

			MESSAGE_OUTBOUND_GET_WATCH: 'Outbund Message Sent: get watch lists',

			MESSAGE_OUTBOUND_START_WATCH: 'Outbund Message Sent: start watch lists',

			MESSAGE_OUTBOUND_STOP_WATCH: 'Outbund Message Sent: stop watch lists',

			MESSAGE_OUTBOUND_CLEAR_WATCH: 'Outbund Message Sent: clear watch lists',

			SIMULATION_NOT_LOADED_ERROR: "Unable to perform operation, the simulation hasn't been loaded",

			SIMULATION_VARS_LIST: "Simulation Variables List requested",

			SIMULATION_SET_WATCH: "Simulation add watchlists requested",

			SIMULATION_GET_WATCH: 'Simulation get watchlists requested',

			SIMULATION_START_WATCH: 'Simulation start watch requested',

			SIMULATION_STOP_WATCH: 'Simulation stop watch requested',

			SIMULATION_CLEAR_WATCH: 'Simulation clear watchlists requested',

			WATCHED_SIMULATION_STATES: "You are currently watching the following states : \n",

			EMPTY_WATCH_TREE: "There are no simulation states to watch",

			/**
			 * Object G resources
			 */
			RUNNING_SCRIPT: "Running script",

			NO_SIMULATION_TO_GET: "No Simulation to get as no simulation is running",

			DEBUG_ON: "Debug log statements on",

			DEBUG_OFF: "Debug log statements off",

			CLEAR_HISTORY: "Console history cleared",

			COPY_CONSOLE_HISTORY: "Copying history to clipboard",

			EMPTY_CONSOLE_HISTORY: "No console history to copy to clipboard",

			COPY_TO_CLIPBOARD_WINDOWS: "Copy to Clipboard: CTRL+C , OK",

			COPY_TO_CLIPBOARD_MAC: "Copy to Clipboard: Cmd+C , OK",

			INVALID_WAIT_USE: "GEPPETTO.G.wait(ms) command must be used inside script",

			WAITING: "Waiting ms",

			SHOW_CONSOLE: "Showing Console",

			HIDE_CONSOLE: "Hiding Console",
			
			CONSOLE_ALREADY_VISIBLE: "Console is already visible",

			CONSOLE_ALREADY_HIDDEN: "Console is already hidden",
			
			SHOW_SHAREBAR: "Showing ShareBar",

			HIDE_SHAREBAR: "Hiding ShareBar",
			
			SHAREBAR_ALREADY_VISIBLE: "ShareBar is already visible",

			SHAREBAR_ALREADY_HIDDEN: "Sharebar is already hidden",
			
			SHARE_ON_TWITTER : "Sharing Geppetto on Twitter",
			
			SHARE_ON_FACEBOOK : "Sharing Geppetto on Facebook",
			
			SHOW_HELP_WINDOW: "Showing Help Window",

			HIDE_HELP_WINDOW: "Hiding Help Window",
			
			HELP_ALREADY_VISIBLE: "Help Window is already visible",

			HELP_ALREADY_HIDDEN: "Help Window is already hidden",
			
			CAMERA_PAN_INCREMENT: "Panning increment",
			
			CAMERA_ROTATE_INCREMENT: "Rotation increment",
			
			CAMERA_ZOOM_INCREMENT: "Zoom increment",
			
			CAMERA_RESET: "Camera reset",
			
			/**
			 * Node resources
			 */

			RETRIEVING_MODEL_TREE : 'Model tree requested',
			
			EMPTY_MODEL_TREE : 'Model is empty, nothing to see here.',
			
			NO_SIMULATION_TREE : 'Simulation tree is not available.',
			
			NO_VISUALIZATION_TREE : 'Visualization tree is not available.',

			RETRIEVING_SIMULATION_TREE : 'Simulation tree: ',
			
			RETRIEVING_VISUALIZATION_TREE : 'Visualization tree: ',
			
			/**
			 * GEPPETTO.Main resources
			 */
			GEPPETTO_INITIALIZED: 'Geppetto Initialised',

			SIMULATION_OBSERVED: 'Sent: Simulation being observed',

			WEBSOCKET_NOT_SUPPORTED: 'Error: WebSocket is not supported by this browser.',

			WEBSOCKET_OPENED: 'Info: WebSocket connection opened',

			WEBSOCKET_CLOSED: "Info: WebSocket connection closed",

			CLEAR_CANVAS: "Inbound Message Received: Clear canvas",

			INVALID_SIMULATION_FILE: "Invalid Simulation File",
			
			ERROR: "Rats! Something went wrong.",

			INVALID_WATCH_LIST: "Invalid Watch List",

			LOADING_MODEL: "Inbound Message Received: Loading Model ",

			OBSERVING_MODE: "Observing Simulation Mode",

			SERVER_UNAVAILABLE: "Server Unavailable",

			SERVER_AVAILABLE: "Server Available",

			WEBGL_FAILED: "Initializing Error: Unable to initialize WebGL",
			
			WEBGL_MESSAGE : "Unable to detect WebGl in your browser. \n" +
						"Try updating your browser and video card drivers to resolve issue",

			ALL_COMMANDS_AVAILABLE_MESSAGE: "The following commands are available in the Geppetto console.",

			GEPPETTO_VERSION_HOLDER: "geppetto v$1 is ready",

			LISTING_WATCH_VARS: "Inbound Message Received: List watch variables",

			LISTING_FORCE_VARS: "Inbound Message Received: List force variables",

			SIMULATOR_UNAVAILABLE: " is Unavailable",

			WEBSOCKET_CONNECTION_ERROR: "Server Connection Error",
			
			STOP_SIMULATION_TUTORIAL : "Tutorial Starting",
			
			STOP_SIMULATION_TUTORIAL_MSG : "Current Simulation will be stopping in order to start tutorial, press" +
					" Okay and enjoy the show!",
					
			SELECTING_ENTITY : "Selecting entity ",
			UNSELECTING_ENTITY : "Unselecting entity ",
			CANT_FIND_ENTITY : "Entity not found, can't use selection on it",
			NO_ENTITIES_SELECTED : "No entities are currently selected.",
			SHOW_ENTITY : "Showing entity ",
			ENTITY_ALREADY_VISIBLE : "Entity already visible.",
			HIDE_ENTITY : "Hiding entity ",
			ENTITY_ALREADY_HIDDING : "Entity already invisible.",
			ZOOM_TO_ENTITY : "Zooming to entity ",
			
			ENTITY_ALREADY_SELECTED : "Entity already selected",
			
			ENTITY_NOT_SELECTED : "Entity not selected, can't uselect what it isn't selected.",

			SELECTING_ASPECT : "Selecting aspect ",
			UNSELECTING_ASPECT : "Unselecting aspect ",
			SHOW_ASPECT : "Showing aspect ",
			ASPECT_ALREADY_VISIBLE : "Aspect already visible.",
			HIDE_ASPECT : "Hiding aspect ",
			ASPECT_ALREADY_HIDDING : "Aspect already invisible.",
			ZOOM_TO_ASPECT : "Zooming to aspect ",
			
			ASPECT_ALREADY_SELECTED : "Aspect already selected",
			
			ASPECT_NOT_SELECTED : "Aspect not selected, can't uselect what it isn't selected.",

			
			/**
			 * GEPPETTO resources
			 */
			UPDATE_FRAME_STARTING: "Starting update frame",

			UPDATE_FRAME_END: "Ending update frame",

			/**
			 * GEPPETTO.SimulationContentEditor resources
			 */
			SAMPLES_DROPDOWN_PLACEHOLDER: "Select simulation from list...",

			/**
			 * Global resources
			 */
			COMMANDS: " commands: \n\n",

			/**
			 * Widget resources
			 */
			WIDGET_CREATED: " widget created",
			REMOVE_PLOT_WIDGETS: "Plotting widget(s) removed",
			NON_EXISTENT_WIDGETS: "Unable to remove widgets, type doesn't exist",

			/**
			 * Idle messages
			 */
			IDLE_MESSAGE: "Are you still there?",

			DISCONNECT_MESSAGE: "A prolonged inactivity has been detected and you have been disconnected from Geppetto. Please refresh your browser if you wish to continue",

			/**
			 * Socket Messages
			 */
			SERVER_CONNECTION_ERROR: "Error communicating with Geppetto servlet. \nReload page if problems persits",
			
			/**
			 * Node Resources
			 */
			ENTITY_NODE : "EntityNode", 
			ASPECT_NODE : "AspectNode",
			ASPECT_SUBTREE_NODE : "AspectSubTreeNode",
			VARIABLE_NODE : "VariableNode",
			FUNCTION_NODE : "FunctionNode",
			PARAMETER_SPEC_NODE : "ParameterSpecificationNode",
			PARAMETER_NODE : "ParameterNode",
			COMPOSITE_NODE : "CompositeNode",
			DYNAMICS_NODE : "DynamicsSpecificationNode"
				
		}
	}
});
