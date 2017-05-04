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
	SIMULATION_CONFIGURATION("simulation_configuration"),
	ERROR("generic_error"),
	ERROR_RUNNING_EXPERIMENT("error_running_experiment"),
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
	GET_EXPERIMENT_STATE("get_experiment_state"), 
	PROJECT_PERSISTED("project_persisted"),
	DOWNLOAD_PROJECT("download_project"),
	PROJECT_PROPS_SAVED("project_props_saved"),
	PROJECT_MADE_PUBLIC("project_made_public"),
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
	USER_PRIVILEGES("user_privileges"),
	IMPORT_TYPE_RESOLVED("import_type_resolved"), 
	IMPORT_VALUE_RESOLVED("import_value_resolved"),
	RETURN_QUERY("return_query"),
	RETURN_QUERY_COUNT("return_query_count"), 
	RETURN_QUERY_RESULTS("return_query_results");

	private OutboundMessages(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}

}
