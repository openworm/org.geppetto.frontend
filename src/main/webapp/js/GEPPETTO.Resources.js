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

			COLORS : {
					DEFAULT : "0X199e8",
					SELECTED : "0Xffcc00",
					INPUT_TO_SELECTED : "0Xffdfc6",
					OUTPUT_TO_SELECTED : "0Xff5a02",
					HIGHLIGHTED : "0Xff1a02",
					INPUT_AND_OUTPUT : "0X649615",
					SPLIT : "0XCFCFA6",
					ENTITY_NODE: "0xcc0000",
					ASPECT_NODE: "0xcc6600",
					ASPECT_SUBTREE_NODE: "0xcccc00",
					COMPOSITE_NODE: "0x66cc00",
					CONNECTION_NODE: "0x00cc00",
					DYNAMICS_SPECIFICATION_NODE: "0x00cc66",
					FUNCTION_NODE:"0x00cccc",
					PARAMETER_NODE: "0x0066cc",
					PARAMETER_SPECIFICATION_NODE: "0x0000cc",
					TEXT_METADATA_NODE: "0x6600cc",
					URL_METADATA_NODE: "0xcc00cc",
					VARIABLE_NODE: "0xcc0066",
					VISUAL_OBJECT_REFERENCE_NODE: "0x606060",
					VISUAL_GROUP_ELEMENT_NODE:"0xffffff",
			},

			/**
			 *
			 * Different status an experiment can be on
			 *
			 * @enum
			 */
			ExperimentStatus : {
					DESIGN : "DESIGN",
					CANCELED : "CANCELED",
					QUEUED : "QUEUED",
					RUNNING: "RUNNING",
					ERROR : "ERROR",
					COMPLETED : "COMPLETED",
					DELETED : "DELETED",
			},


			OPACITY : {
					DEFAULT : 1,
					GHOST : .3,
			},

			PROJECT_LOADED: "Project loaded",
			
			MMODEL_LOADED: "Model loaded",

			EXPERIMENT_CREATED: "New experiment created",

			EXPERIMENT_DELETED: "Experiment Deleted",

			UNABLE_TO_START_EXPERIMENT: "Experiment can't be started.",

			EXPERIMENT_PAUSED: "Experiment Paused",

			UNABLE_TO_PAUSE_EXPERIMENT: "Simulation not running, must run simulation first",

			EXPERIMENT_STOP: "Simulation Stopped",

			LOADING_PROJECT: "Loading Project",

			LOADING_SIMULATION_SLOW : "Still loading, but things are taking longer than expected, are you on low bandwidth?",

			SIMULATION_NOT_RUNNING: "Unable to stop simulation, loaded but not running",

			SIMULATION_NOT_LOADED: "Unable to stop simulation that hasn't been loaded",

			SIMULATION_UNSPECIFIED: "Simulation not specified",

			SIMULATION_ALREADY_STOPPED: "Simulation was already stopped",

			SIMULATION_ALREADY_STARTED: "Simulation was already started",

			LOADING_FROM_CONTENT: "Outbound Message Sent: Load Simulation from editing console",

			MESSAGE_OUTBOUND_LOAD: 'Outbound Message Sent: Loading Simulation',

			MESSAGE_OUTBOUND_STOP: 'Outbund Message Sent: Simulation Stopped',

			MESSAGE_OUTBOUND_PAUSE: 'Outbund Message Sent: Simulation Paused',

			MESSAGE_OUTBOUND_START: 'Outbund Message Sent: Simulation Started',

			MESSAGE_OUTBOUND_SET_WATCHED_VARIABLES: 'Outbund Message Sent: add variables to watch',

			MESSAGE_OUTBOUND_CLEAR_WATCH: 'Outbund Message Sent: clear watch lists',

			SIMULATION_NOT_LOADED_ERROR: "Unable to perform operation, the simulation hasn't been loaded",

			SIMULATION_SET_WATCHED_VARIABLES: "Watch variables requested",

			SIMULATION_CLEAR_WATCH: 'Clear watched variables requested',

			NO_FEATURE : "The feature is not avaialble for the current service",

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

			CAMERA_SET_POSITION: "Set position",

			CAMERA_SET_ROTATION: "Set rotation",

			CAMERA_RESET: "Camera reset",

			/**
			 * Node resources
			 */

			RETRIEVING_MODEL_TREE : 'Model tree requested',

			RETRIEVING_SIMULATION_TREE : 'Simulation tree requested',

			EMPTY_MODEL_TREE : 'Model is empty, nothing to see here.',

			EMPTY_SIMULATION_TREE : 'No variables to simulate.',

			SIMULATION_TREE_POPULATED : 'Simulation tree populated.',

			SIMULATION_TREE_RECEIVED : 'Requested simulation tree received.',

			NO_SIMULATION_TREE : 'Simulation tree is not available.',

			NO_VISUALIZATION_TREE : 'Visualization tree is not available.',

			RETRIEVING_VISUALIZATION_TREE : 'Visualization tree: ',

			DOWNLOADING_MODEL : 'Downloading model as ',

			ERROR_DOWNLOADING_MODEL : "Error downloading model",

			ERROR_LOADING_PROJECT : "Error loading project",
			
			RETRIEVING_SUPPORTED_OUTPUTS : 'Supported outputs requested',

			EXPERIMENT_NOT_COMPLETED_UPLOAD : "Can't upload results for an experiment that isn't completed",

			UNACTIVE_EXPERIMENT_UPLOAD : "Unable to upload results for experiment that isn't active",

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

			INCOMING_MESSAGE: "Incoming message...",

			ERROR: "Houston, we have a problem",

			INVALID_WATCH_LIST: "Invalid Watch List",

			LOADING_MODEL: "Inbound Message Received: Loading Model ",

			OBSERVING_MODE: "Observing Simulation Mode",

			SERVER_UNAVAILABLE: "Server Unavailable",

			SERVER_AVAILABLE: "Server Available",

			SIMULATOR_FULL : "Simulation Full",

			WEBGL_FAILED: "Initialization Error: Unable to initialize WebGL",

			WEBGL_MESSAGE : "Unable to detect WebGl in your browser. \n" +
						"Try updating your browser and video card drivers to resolve issue",

			WORKERS_NOT_SUPPORTED: "Initialization Error: WebWorkers not suported",

			WORKERS_NOT_SUPPORTED_MESSAGE : "Unable to detect WebWorkers support in your browser. Try any browser that is not from the stone age.",

			ALL_COMMANDS_AVAILABLE_MESSAGE: "The following commands are available in the Geppetto console.",

			GEPPETTO_VERSION_HOLDER: "geppetto v$1 is ready",

			SIMULATOR_UNAVAILABLE: " is Unavailable",

			WEBSOCKET_CONNECTION_ERROR: "Server Connection Error",

			STOP_SIMULATION_TUTORIAL : "Tutorial Starting",

			STOP_SIMULATION_TUTORIAL_MSG : "Current Simulation will be stopping in order to start tutorial, press" +
					" Okay and enjoy the show!",

			SELECTING_ENTITY : "Selecting entity ",
			DESELECTING_ENTITY : "Deselecting entity ",
			DESELECT_ALL : "Deselecting all entities ",
			UNHIGHLIGHT_ALL : "Unhighlighting all connections ",
			CANT_FIND_ENTITY : "Entity not found, can't use selection on it",
			NO_ENTITIES_SELECTED : "No entities are currently selected.",
			SHOW_ENTITY : "Showing entity ",
			HIDE_ENTITY : "Hiding entity ",
			ZOOM_TO_ENTITY : "Zooming to entity ",
			HIGHLIGHTING : "Highlighting object ",
			NO_REFERENCES_TO_HIGHLIGHT : "Connection has no Visual References to highlight.",
			ENTITY_ALREADY_SELECTED : "Entity already selected",
			ENTITY_NOT_SELECTED : "Entity not selected, can't uselect what it isn't selected.",
			SELECTING_ASPECT : "Selecting aspect ",
			DESELECTING_ASPECT : "Deselecting aspect ",
			SHOW_ASPECT : "Showing aspect ",
			HIDE_ASPECT : "Hiding aspect ",
			ZOOM_TO_ASPECT : "Zooming to aspect ",
			ASPECT_ALREADY_SELECTED : "Aspect already selected",
			ASPECT_NOT_SELECTED : "Aspect not selected, can't uselect what it isn't selected.",
			SHOWING_VISUAL_GROUPS : "Showing visual group ",
			HIDING_VISUAL_GROUPS : "Hiding visual group ",
			NO_VISUAL_GROUP_ELEMENTS : "No elements inside visual group to show ",
			MISSING_PARAMETER : "Command is missing parameter.",


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
			REMOVE_PLOT_WIDGETS: "Plotting widget(s) removed",
			REMOVE_POPUP_WIDGETS: "Popup widget(s) removed",
			REMOVE_TREEVISUALISERDAT_WIDGETS: "Tree Visualiser DAT widget(s) removed",
			REMOVE_TREEVISUALISERD3_WIDGETS: "Tree Visualiser D3 widget(s) removed",
			REMOTE_VARIABLEVISUALISER_WIDGETS: "Variable Visualiser widget(s) removed",
			REMOVE_CONNECTIVITY_WIDGETS: "Connectivity widget(s) removed",
			NON_EXISTENT_WIDGETS: "Unable to remove widgets, type doesn't exist",

			/**
			 * Idle messages
			 */
			IDLE_MESSAGE: "Are you still there?",

			DISCONNECT_MESSAGE: "A prolonged inactivity has been detected and you have been disconnected from Geppetto. Please refresh your browser if you wish to continue",

			/**
			 * Socket Messages
			 */
			SERVER_CONNECTION_ERROR: "Error communicating with Geppetto. \nReload page if problems persits",

			/**
			 * Node Resources
			 */
			PROJECT_NODE : "ProjectNode",
			EXPERIMENT_NODE : "ExperimentNode",
			SIMULATOR_CONFIGURATION_NODE : "SimulatorConfigurationNode",
			ENTITY_NODE : "EntityNode",
			ASPECT_NODE : "AspectNode",
			ASPECT_SUBTREE_NODE : "AspectSubTreeNode",
			VARIABLE_NODE : "VariableNode",
			FUNCTION_NODE : "FunctionNode",
			PARAMETER_SPEC_NODE : "ParameterSpecificationNode",
			TEXT_METADATA_NODE : "TextMetadataNode",
			HTML_METADATA_NODE : "HTMLMetadataNode",
			PARAMETER_NODE : "ParameterNode",
			CONNECTION_NODE : "ConnectionNode",
			COMPOSITE_NODE : "CompositeNode",
			DYNAMICS_NODE : "DynamicsSpecificationNode",
			VISUAL_REFERENCE_NODE : "VisualObjectReferenceNode",
			VISUAL_GROUP_NODE : "VisualGroupNode",
			VISUAL_GROUP_ELEMENT_NODE : "VisualGroupElementNode",
			SKELETON_ANIMATION_NODE: "SkeletonAnimationNode",
			INPUT_CONNECTION : "FROM",
			OUTPUT_CONNECTION : "TO",
			TYPE_NODE : "Type",
			COMPOSITE_TYPE_NODE : "CompositeType",
			ARRAY_TYPE_NODE : "ArrayType",
			VARIABLE_NODE : "Variable",
			GEPPETTO_MODEL_NODE : "GeppettoModel",
			LIBRARY_NODE : "Library",
			INSTANCE_NODE : "Instance"
		}
	}
});
