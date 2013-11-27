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
 * Enum that holds different message types for socket

 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
var MESSAGE_TYPE = {
	/*
	 * Messages handle by GlobalHandler
	 */
	CLIENT_ID : "client_id",
	RELOAD_CANVAS : "reload_canvas",
	ERROR_LOADING_SIM : "error_loading_simulation",
	GEPPETTO_VERSION : "geppetto_version",
	OBSERVER_MODE : "observer_mode_alert",
	READ_URL_PARAMS : "read_url_parameters",
	RUN_SCRIPT : "run_script",
	SERVER_AVAILABLE : "server_available",
	SERVER_UNAVAILABLE : "server_unavailable",
	
	/*
	 * Messages handle by SimulatorHandle
	 */
	LOAD_MODEL : "load_model",
	SCENE_UPDATE : "scene_update",
	SIMULATION_CONFIGURATION : "simulation_configuration",
	SIMULATION_LOADED : "simulation_loaded",
	SIMULATION_STARTED : "simulation_started",
	LIST_WATCH_VARS : "list_watch_vars",
	LIST_FORCE_VARS : "list_force_vars",
};