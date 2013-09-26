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
package org.geppetto.frontend;

/*
 * Stores different types of messages that can be send to the clients
 */
public enum OUTBOUND_MESSAGE_TYPES {
	OBSERVER_MODE("observer_mode_alert"), 
	LOAD_MODEL("load_model"), 
	READ_URL_PARAMETERS("read_url_parameters"), 
	SIMULATION_LOADED("simulation_loaded"), 
	ERROR_LOADING_SIMULATION("error_loading_simulation"), 
	SERVER_UNAVAILABLE("server_unavailable"), 
	SERVER_AVAILABLE("server_available"),
	SIMULATION_STARTED("simulation_started"), 
	INFO_MESSAGE("info_message"),
	SCENE_UPDATE("scene_update"), 
	RELOAD_CANVAS("reload_canvas"),
	SIMULATION_CONFIGURATION("simulation_configuration"),
	ERROR_LOADING_SIMULATION_CONFIG("error_loading_simulation_config"),
	ERROR_READING_SCRIPT("error_reading_script"),
	GEPPETTO_VERSION("geppetto_version"),
	RUN_SCRIPT("run_script");

	private OUTBOUND_MESSAGE_TYPES(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}

}
