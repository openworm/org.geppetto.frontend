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
define(function (require) {
    return function (GEPPETTO) {

        GEPPETTO.Resources = {

            Icon: {
                "ParameterType": "fa-sliders",
                "TextType": "fa-file-text-o",
                "CompositeType": "fa-align-justify",
                "ArrayType": "fa-list",
                "PointerType": "fa-link",
                "HTMLType": "fa-code",
                "StateVariableType": "fa-superscript",
                "DynamicsType": "fa-bolt",
            },

            Colour: {
                "ParameterType": "#0066cc",
                "TextType": "#10b7bd",
                "CompositeType": "#2e2a2a",
                "ArrayType": "#ff5a02",
                "PointerType": "#10b7bd",
                "HTMLType": "0xdddddd",
                "StateVariableType": "#42b6ff",
                "DynamicsType": "#00cc66",
            },

            COLORS: {
                DEFAULT: "#0199e8",
                SELECTED: "#ffcc00",
                INPUT_TO_SELECTED: "#ffdfc6",
                OUTPUT_TO_SELECTED: "#ff5a02",
                HIGHLIGHTED: "#ff1a02",
                INPUT_AND_OUTPUT: "#649615",
                SPLIT: "#CFCFA6",
                ENTITY_NODE: "#cc0000",
                ASPECT_NODE: "#cc6600",
                ASPECT_SUBTREE_NODE: "#cccc00",
                COMPOSITE_NODE: "#66cc00",
                CONNECTION_NODE: "#00cc00",
                DYNAMICS_SPECIFICATION_NODE: "#00cc66",
                FUNCTION_NODE: "#00cccc",
                PARAMETER_NODE: "#0066cc",
                PARAMETER_SPECIFICATION_NODE: "#0000cc",
                TEXT_METADATA_NODE: "#6600cc",
                URL_METADATA_NODE: "#cc00cc",
                VARIABLE_NODE: "#cc0066",
                VISUAL_OBJECT_REFERENCE_NODE: "#606060",
                VISUAL_GROUP_ELEMENT_NODE: "#ffffff",
            },

            /**
             *
             * Different status an experiment can be on and descriptions
             *
             * @enum
             */
            ExperimentStatus: {
                DESIGN: "DESIGN",
                CANCELED: "CANCELED",
                QUEUED: "QUEUED",
                RUNNING: "RUNNING",
                ERROR: "ERROR",
                COMPLETED: "COMPLETED",
                DELETED: "DELETED",
                Descriptions: {
                    DESIGN: "The experiment is in <b>DESIGN</b> status. Parameters can be set and state variables can be recorded before running the experiment.",
                    CANCELED: "The experiment has been <b>CANCELED</b>.",
                    QUEUED: "The experiment is <b>QUEUED</b> for running.",
                    RUNNING: "The experiment is currently <b>RUNNING</b>.",
                    ERROR: "The experiment caused an <b>ERROR</b> while running.",
                    COMPLETED: "The experiment has successfully <b>COMPLETED</b>. The state variables that were recorded, if any, can now be plotted.",
                    DELETED: "The experiment is <b>DELETED</b>... and you shouldn't be seeing this message!"
                }
            },

            GeometryTypes: {
                LINES: "lines",
                TUBES: "tubes",
                CYLINDERS: "cylinders"
            },


            OPACITY: {
                DEFAULT: 1,
                GHOST: .3,
            },

            PROJECT_LOADED: "Project loaded",

            MODEL_LOADED: "The model for the current project has been loaded",

            VARIABLE_ADDED: "A variable has been added to the Geppetto model",

            VARIABLE_ALREADY_EXISTS: "Cannot add variable that already exists",

            IMPORT_TYPE_RESOLVED: "An import type has been resolved to a full type and swapped into the Geppetto model",

            EXPERIMENT_CREATED: "New experiment created",

            EXPERIMENT_BATCH_CREATED: "New experiment batch created",
            
            EXPERIMENT_CLONED: "Experiment cloned",

            EXPERIMENT_DELETED: "Experiment Deleted",

            UNABLE_TO_START_EXPERIMENT: "Experiment can't be started",

            EXPERIMENT_PAUSED: "Experiment Paused",

            UNABLE_TO_PAUSE_EXPERIMENT: "Simulation is not running. You must run a simulation first",

            EXPERIMENT_STOP: "Simulation Stopped",

            LOADING_PROJECT: "Loading Project",

            LOADING_EXPERIMENT: "Loading Experiment",
            
            FETCHING_RESULTS: "Fetching Experiment Results",
            
            RESOLVING_TYPES: "Resolving types",
                        
            PARSING_MODEL: "Parsing model",

            CREATING_MODEL: "Creating model",

            CREATING_INSTANCES: "Creating instances",

            CREATING_SCENE: "Creating scene",

            ADDING_VARIABLE: "Adding variable",

            SPOTLIGHT_HINT: "Did you know you can rapidly access the data once it gets loaded using Ctrl+Space?",

            LOADING_SIMULATION_SLOW: "Still loading, but things are taking longer than expected. Do you have a low bandwidth connection?",

            SIMULATION_NOT_RUNNING: "Unable to stop simulation, loaded but not running",

            SIMULATION_NOT_LOADED: "Unable to stop simulation that hasn't been loaded",

            SIMULATION_UNSPECIFIED: "Simulation not specified",

            SIMULATION_ALREADY_STOPPED: "Simulation has already been stopped",

            SIMULATION_ALREADY_STARTED: "Simulation has already been started",

            LOADING_FROM_CONTENT: "Outbound Message Sent: Load Simulation from editing console",

            MESSAGE_OUTBOUND_LOAD: 'Outbound Message Sent: Loading Simulation',

            MESSAGE_OUTBOUND_STOP: 'Outbound Message Sent: Simulation Stopped',

            MESSAGE_OUTBOUND_PAUSE: 'Outbound Message Sent: Simulation Paused',

            MESSAGE_OUTBOUND_START: 'Outbound Message Sent: Simulation Started',

            MESSAGE_OUTBOUND_SET_WATCHED_VARIABLES: 'Outbound Message Sent: add variables to watch',

            MESSAGE_OUTBOUND_CLEAR_WATCH: 'Outbund Message Sent: clear watch lists',

            SIMULATION_NOT_LOADED_ERROR: "Unable to perform operation, the simulation hasn't been loaded",

            SIMULATION_SET_WATCHED_VARIABLES: "Watch variables requested",

            SIMULATION_CLEAR_WATCH: 'Clear watched variables requested',
            
            NO_WATCHED_VARIABLES : "No Recorded Variables",

            NO_FEATURE: "The feature is not avaialble for the current service",
            
            TIME_VARIABLE_NOT_DEFINED : "Time Variable not defined, can't show time",
            
            DISABLED_COLOR_PLOTTING : "Color Plotting Disabled",
            
            ENABLED_COLOR_PLOTTING : "Color Plotting Enabled",

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

            SHARE_ON_TWITTER: "Sharing Geppetto on Twitter",

            SHARE_ON_FACEBOOK: "Sharing Geppetto on Facebook",

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

            RETRIEVING_MODEL_TREE: 'Model tree requested',

            RETRIEVING_SIMULATION_TREE: 'Simulation tree requested',

            EMPTY_MODEL_TREE: 'Model is empty, nothing to see here.',

            EMPTY_SIMULATION_TREE: 'No variables to simulate.',

            SIMULATION_TREE_POPULATED: 'Simulation tree populated.',

            SIMULATION_TREE_RECEIVED: 'Requested simulation tree received.',

            NO_SIMULATION_TREE: 'Simulation tree is not available.',

            NO_VISUALIZATION_TREE: 'Visualization tree is not available.',

            RETRIEVING_VISUALIZATION_TREE: 'Visualization tree: ',

            DOWNLOADING_MODEL: 'Downloading model as ',
            
            DOWNLOADING_PROJECT: 'Downloading Project',

            ERROR_DOWNLOADING_MODEL: "Error downloading model",

            ERROR_LOADING_PROJECT: "Error loading project",

            RETRIEVING_SUPPORTED_OUTPUTS: 'Supported outputs requested',

            EXPERIMENT_NOT_COMPLETED_UPLOAD: "Can't upload results for an experiment that isn't completed",

            UNACTIVE_EXPERIMENT_UPLOAD: "Unable to upload results for experiment that isn't active",

            GEPPETTO_INITIALIZED: 'Geppetto Initialised',

            SIMULATION_OBSERVED: 'Sent: Simulation being observed',

            WEBSOCKET_NOT_SUPPORTED: 'Error: WebSocket is not supported by this browser.',

            WEBSOCKET_OPENED: 'Info: WebSocket connection opened',

            WEBSOCKET_CLOSED: "Info: WebSocket connection closed",

            CLEAR_CANVAS: "Inbound Message Received: Clear canvas",

            INVALID_SIMULATION_FILE: "Invalid Simulation File",

            INCOMING_MESSAGE: "Incoming message...",

            ERROR: "Houston, we have a problem...",

            INVALID_WATCH_LIST: "Invalid Watch List",

            LOADING_MODEL: "Inbound Message Received: Loading Model ",

            OBSERVING_MODE: "Observing Simulation Mode",

            SERVER_UNAVAILABLE: "Server Unavailable",

            SERVER_AVAILABLE: "Server Available",

            SIMULATOR_FULL: "Simulation Full",

            WEBGL_FAILED: "Initialization Error: Unable to initialize WebGL",

            WEBGL_MESSAGE: "Unable to detect WebGl in your browser. \n" +
            "Try updating your browser and video card drivers to resolve issue",

            WORKERS_NOT_SUPPORTED: "Initialization Error: WebWorkers not suported",

            WORKERS_NOT_SUPPORTED_MESSAGE: "Unable to detect WebWorkers support in your browser. Try any browser that is not from the stone age.",

            ALL_COMMANDS_AVAILABLE_MESSAGE: "The following commands are available in the Geppetto console.",

            GEPPETTO_VERSION_HOLDER: "Geppetto v$1 is ready",

            SIMULATOR_UNAVAILABLE: " is Unavailable",

            WEBSOCKET_CONNECTION_ERROR: "Server Connection Error",

            STOP_SIMULATION_TUTORIAL: "Tutorial Starting",

            STOP_SIMULATION_TUTORIAL_MSG: "Current Simulation will be stopping in order to start tutorial, press" +
            " Okay and enjoy the show!",

            SELECTING_ENTITY: "Selecting entity ",
            DESELECTING_ENTITY: "Deselecting entity ",
            DESELECT_ALL: "Deselecting all entities ",
            UNHIGHLIGHT_ALL: "Unhighlighting all connections ",
            CANT_FIND_ENTITY: "Entity not found, can't use selection on it",
            NO_ENTITIES_SELECTED: "No entities are currently selected.",
            SHOW_ENTITY: "Showing entity ",
            HIDE_ENTITY: "Hiding entity ",
            ZOOM_TO_ENTITY: "Zooming to entity ",
            HIGHLIGHTING: "Highlighting object ",
            NO_REFERENCES_TO_HIGHLIGHT: "Connection has no Visual References to highlight.",
            ENTITY_ALREADY_SELECTED: "Entity already selected",
            ENTITY_NOT_SELECTED: "Entity not selected, can't unselect what it isn't selected.",
            SELECTING_ASPECT: "Selecting aspect ",
            DESELECTING_ASPECT: "Deselecting aspect ",
            SHOW_ASPECT: "Showing aspect ",
            HIDE_ASPECT: "Hiding aspect ",
            ZOOM_TO_ASPECT: "Zooming to aspect ",
            ASPECT_ALREADY_SELECTED: "Aspect already selected",
            ASPECT_NOT_SELECTED: "Aspect not selected, can't unselect what it isn't selected.",
            SHOWING_VISUAL_GROUPS: "Showing visual group ",
            HIDING_VISUAL_GROUPS: "Hiding visual group ",
            NO_VISUAL_GROUP_ELEMENTS: "No elements inside visual group to show ",
            MISSING_PARAMETER: "Command is missing parameter.",
            BATCH_SELECTION: "Batch selection performed",
            BATCH_DESELECTION: "Batch deselection performed",
            BATCH_SET_GEOMETRY: "Batch set geometry performed",
            BATCH_HIGHLIGHT_CONNECTIONS: "Batch highlight connections performed",
            BATCH_SHOW_CONNECTIONS_LINES: "Batch show/hide connection lines performed",
            OPERATION_NOT_SUPPORTED: "Operation not supported: ",
			WRITE_PRIVILEGES_NOT_SUPPORTED : "User doesn't have WRITE privileges",
            DOWNLOAD_PRIVILEGES_NOT_SUPPORTED : "User doesn't have DOWNLOAD privileges",
            RUN_PRIVILEGES_NOT_SUPPORTED : "User doesn't have RUN_EXPERIMENT privileges",
            UPLOAD_PRIVILEGES_NOT_SUPPORTED : "User doesn't have UPLOAD privileges",
            PROJECT_NOT_PERSISTED : "Project not persisted, run command Project.persist() or use Save button on top right corner.",
            USER_NOT_LOGIN : "No user logged in.",
            INSTANTIATING_MODEL : "Instantiating model",
            PARSING_MODEL : "Parsing Model",
            RUNNING_SIMULATION : "Running Simulation",
            IMPORTING_MODEL : "Importing Model",
            EXPORTING_MODEL : "Exporting Model",



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
            REMOTE_VARIABLEVISUALISER_WIDGETS: "Variable Visualiser widget(s) removed",
            REMOVE_CONNECTIVITY_WIDGETS: "Connectivity widget(s) removed",
            NON_EXISTENT_WIDGETS: "Unable to remove widgets, type doesn't exist",

            /**
             * Idle messages
             */
            IDLE_MESSAGE: "Are you still there?",

            DISCONNECT_MESSAGE: "Prolonged inactivity has been detected and you have been disconnected from Geppetto. Please refresh your browser if you wish to continue",

            /**
             * Socket Messages
             */
            SERVER_CONNECTION_ERROR: "Error communicating with Geppetto. \nReload page if problems persits",

            /**
             * Node Resources
             */
            PROJECT_NODE: "ProjectNode",
            EXPERIMENT_NODE: "ExperimentNode",
            SIMULATOR_CONFIGURATION_NODE: "SimulatorConfigurationNode",
            VISUAL_GROUP_NODE: "VisualGroup",
            VISUAL_GROUP_ELEMENT_NODE: "VisualGroupElement",

            //TYPES
            TYPE_NODE: "Type",
            VISUAL_TYPE_NODE: "VisualType",
            COMPOSITE_TYPE_NODE: "CompositeType",
            COMPOSITE_VISUAL_TYPE_NODE: "CompositeVisualType",
            ARRAY_TYPE_NODE: "ArrayType",
            PARAMETER_TYPE: "ParameterType",
            STATE_VARIABLE_TYPE: "StateVariableType",
            DERIVED_STATE_VARIABLE_TYPE: "DerivedStateVariableType",
            CONNECTION_TYPE: "ConnectionType",
            POINTER_TYPE: "PointerType",
            DYNAMICS_TYPE: "DynamicsType",
            FUNCTION_TYPE: "FunctionType",
            TEXT_TYPE: "TextType",
            IMAGE_TYPE: "ImageType",
            HTML_TYPE: "HTMLType",
            IMPORT_TYPE: "ImportType",
            //VARIABLES
            VARIABLE_NODE: "Variable",
            //VALUES
            CYLINDER: "Cylinder",
            ARRAY_VALUE: "ArrayValue",
            IMAGE: "Image",
            SPHERE: "Sphere",
            COLLADA: "Collada",
            OBJ: "OBJ",
            PARTICLES: "Particles",
            //GEPPETTO MODEL
            GEPPETTO_MODEL_NODE: "GeppettoModel",
            LIBRARY_NODE: "GeppettoLibrary",
            //INSTANCES
            INSTANCE_NODE: "Instance",
            ARRAY_INSTANCE_NODE: "ArrayInstance",
            ARRAY_ELEMENT_INSTANCE_NODE: "ArrayElementInstance",
            //COMMON LIBRARY
            PARAMETER: "Parameter",
            STATE_VARIABLE: "StateVariable",
            CONNECTION: "Connection",
            DYNAMICS: "Dynamics",
            FUNCTION: "Function",
            TEXT: "Text",
            HTML: "HTML",
            SKELETON_ANIMATION_NODE: "SkeletonAnimation",
            PARTICLES_TYPE: "particles",
            // CAPABILITIES
            VISUAL_CAPABILITY: 'VisualCapability',
            STATE_VARIABLE_CAPABILITY: 'StateVariableCapability',
            DERIVED_STATE_VARIABLE_CAPABILITY: 'DerivedStateVariableCapability',
            PARAMETER_CAPABILITY: 'ParameterCapability',
            CONNECTION_CAPABILITY: 'ConnectionCapability',
            VISUAL_GROUP_CAPABILITY: 'VisualGroupCapability',
            // CONNECTION DIRECTION
            INPUT: 'input',
            OUTPUT: 'output',
            INPUT_OUTPUT: 'input_output',
            DIRECTIONAL: 'DIRECTIONAL',
            BIDIRECTIONAL: 'BIDIRECTIONAL',
            // FLOWS
            SEARCH_FLOW: 'SearchFlow',
            PLAY_FLOW: 'PlayFlow',
            RUN_FLOW: 'RunFlow',
            // COMMMON TYPE PATHS
            STATE_VARIABLE_TYPE_PATH: 'Model.common.StateVariable',
            PARAMETER_TYPE_PATH: 'Model.common.Parameter',
            MODEL_PREFIX_CLIENT: 'Model', //DO NOT ADD A DOT HERE THANKS
            // CONTROL PANEL
            CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT: 'Control Panel - error running source script:',
            
            //USER PRIVILEGES
            WRITE_PROJECT : "WRITE_PROJECT",
            READ_PROJECT : "READ_PROJECT",
            DOWNLOAD : "DOWNLOAD",
            DROPBOX_INTEGRATION : "DROPBOX_INTEGRATION",
            RUN_EXPERIMENT : "RUN_EXPERIMENT"
        }
    }
});
