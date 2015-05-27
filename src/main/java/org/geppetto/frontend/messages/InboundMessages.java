/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 - 2015 OpenWorm.
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
package org.geppetto.frontend.messages;

/*
 * Stores different types of messages that can be send to the clients
 */
public enum InboundMessages {
	
	RUN_EXPERIMENT("run_experiment"), 
	PAUSE("pause"), 
	STOP("stop"), 
	OBSERVE("observe"), 
	LOAD_PROJECT_FROM_URL("load_project_from_url"), 
	LOAD_PROJECT_FROM_ID("load_project_from_id"), 
	LOAD_PROJECT_FROM_CONTENT("load_project_from_content"),
	LOAD_EXPERIMENT("load_experiment"),
	SIM("sim"),
	GEPPETTO_VERSION("geppetto_version"),
	RUN_SCRIPT("run_script"),
	SET_WATCHED_VARIABLES("set_watch"),
	GET_WATCH("get_watch"),
	CLEAR_WATCHED_VARIABLES("clear_watch"),
	NOTIFY_USER("notify_user"),
	IDLE_USER("idle_user"),
	GET_MODEL_TREE("get_model_tree"),
	GET_SIMULATION_TREE("get_simulation_tree"),
	GET_SUPPORTED_OUTPUTS("get_supported_outputs"),
	DOWNLOAD_MODEL("download_model"),
	SET_PARAMETERS("set_parameters"),
	EXPERIMENTS_STATUS("experiments_status"), 
	PLAY_EXPERIMENT("play_experiment"),
	DELETE_EXPERIMENT("delete_experiment");

	
	private InboundMessages(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}
}
