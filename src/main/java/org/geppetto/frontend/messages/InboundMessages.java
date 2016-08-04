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
	
	GEPPETTO_VERSION("geppetto_version"),
	NOTIFY_USER("notify_user"),
	GET_SCRIPT("get_script"),
	GET_DATA_SOURCE_RESULTS("get_data_source_results"),
	
	//PROJECT MESSAGES
	LOAD_PROJECT_FROM_URL("load_project_from_url"), 
	LOAD_PROJECT_FROM_ID("load_project_from_id"), 
	LOAD_PROJECT_FROM_CONTENT("load_project_from_content"),
	SAVE_PROJECT_PROPERTIES("save_project_properties"),
	PERSIST_PROJECT("persist_project"),

	//EXPERIMENT MESSAGES
	NEW_EXPERIMENT("new_experiment"),
	CLONE_EXPERIMENT("clone_experiment"),
	LOAD_EXPERIMENT("load_experiment"),
	SAVE_EXPERIMENT_PROPERTIES("save_experiment_properties"),
	DELETE_EXPERIMENT("delete_experiment"),
	PLAY_EXPERIMENT("play_experiment"),
	EXPERIMENT_STATUS("experiment_status"), 
	RUN_EXPERIMENT("run_experiment"), 
	
	SET_WATCHED_VARIABLES("set_watched_variables"),
	GET_WATCH("get_watch"),
	CLEAR_WATCHED_VARIABLES("clear_watch"),
	SET_PARAMETERS("set_parameters"),
	
	LINK_DROPBOX("link_dropbox"),
	UNLINK_DROPBOX("unlink_drobpox"),
	UPLOAD_MODEL("upload_model"),
	UPLOAD_RESULTS("upload_results"),
	GET_SUPPORTED_OUTPUTS("get_supported_outputs"),
	DOWNLOAD_MODEL("download_model"),
	DOWNLOAD_RESULTS("download_results"),
	
	//DATASOURCES
	FETCH_VARIABLE("fetch_variable"), 
	RESOLVE_IMPORT_TYPE("resolve_import_type");

	
	private InboundMessages(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}
}
