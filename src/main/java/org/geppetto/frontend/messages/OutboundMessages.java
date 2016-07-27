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
public enum OutboundMessages {
	
	LOAD_PROJECT("load_project"), 
	READ_URL_PARAMETERS("read_url_parameters"), 
	PROJECT_LOADED("project_loaded"), 
	ERROR_LOADING_PROJECT("error_loading_project"), 
	SERVER_UNAVAILABLE("server_unavailable"), 
	SERVER_AVAILABLE("server_available"),
	EXPERIMENT_RUNNING("experiment_running"),
	INFO_MESSAGE("info_message"),
	RELOAD_CANVAS("reload_canvas"),
	SIMULATION_CONFIGURATION("simulation_configuration"),
	ERROR("generic_error"),
	ERROR_LOADING_SIMULATION_CONFIG("error_loading_simulation_config"),
	ERROR_READING_SCRIPT("error_reading_script"),
	ERROR_SETTING_WATCHED_VARIABLES("error_setting_watched_variables"),
	ERROR_DOWNLOADING_MODEL("error_downloading_model"),
	ERROR_DOWNLOADING_RESULTS("error_downloading_results"),
	GEPPETTO_VERSION("geppetto_version"),
	SCRIPT_FETCHED("script_fetched"),
	DATASOURCE_RESULTS_FETCHED("data_source_results_fetched"),
	GET_SCRIPTS("get_scripts"),
	WATCHED_VARIABLES_SET("watched_variables_set"),
	CLEAR_WATCH("clear_watch"),
	CLIENT_ID("client_id"), 
	FIRE_SIM_SCRIPTS("fire_sim_scripts"),
	SIMULATION_OVER("simulation_over"),
	GET_SUPPORTED_OUTPUTS("get_supported_outputs"),
	DOWNLOAD_MODEL("download_model"),
	SET_PARAMETERS("set_parameters"),
	NO_FEATURE("no_feature"), 
	EXPERIMENT_LOADING("experiment_loading"),
	EXPERIMENT_LOADED("experiment_loaded"),
	EXPERIMENT_STATUS("experiment_status"),
	DELETE_EXPERIMENT("experiment_deleted"), 
	PLAY_EXPERIMENT("play_experiment"), 
	PROJECT_PERSISTED("project_persisted"),
	PROJECT_PROPS_SAVED("project_props_saved"),
	EXPERIMENT_PROPS_SAVED("experiment_props_saved"),
	DROPBOX_LINKED("dropbox_linked"),
	DROPBOX_UNLINKED("dropbox_unlinked"),
	RESULTS_UPLOADED("results_uploaded"),
	MODEL_UPLOADED("model_uploaded"),
	DOWNLOAD_RESULTS("download_results"),
	UPDATE_MODEL_TREE("update_model_tree"), 
	EXPERIMENT_CREATED("experiment_created"),
	EXPERIMENT_CLONED("experiment_cloned"),
	GEPPETTO_MODEL_LOADED("geppetto_model_loaded"), 
	VARIABLE_FETCHED("variable_fetched"),
	IMPORT_TYPE_RESOLVED("import_type_resolved");

	private OutboundMessages(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}

}
