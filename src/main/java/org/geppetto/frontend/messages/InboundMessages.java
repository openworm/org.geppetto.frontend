package org.geppetto.frontend.messages;

/*
 * Stores different types of messages that can be send to the clients
 */
public enum InboundMessages {
	
	GEPPETTO_VERSION("geppetto_version"),
	USER_PRIVILEGES("user_privileges"),
	NOTIFY_USER("notify_user"),
	GET_SCRIPT("get_script"),
	GET_DATA_SOURCE_RESULTS("get_data_source_results"),
	
	//PROJECT MESSAGES
	LOAD_PROJECT_FROM_URL("load_project_from_url"), 
	LOAD_PROJECT_FROM_ID("load_project_from_id"), 
	LOAD_PROJECT_FROM_CONTENT("load_project_from_content"),
	SAVE_PROJECT_PROPERTIES("save_project_properties"),
	PERSIST_PROJECT("persist_project"),
	MAKE_PROJECT_PUBLIC("make_project_public"),
	
	//EXPERIMENT MESSAGES
	NEW_EXPERIMENT("new_experiment"),
	CLONE_EXPERIMENT("clone_experiment"),
	LOAD_EXPERIMENT("load_experiment"),
	SAVE_EXPERIMENT_PROPERTIES("save_experiment_properties"),
	DELETE_EXPERIMENT("delete_experiment"),
	GET_EXPERIMENT_STATE("get_experiment_state"),
	EXPERIMENT_STATUS("experiment_status"), 
	RUN_EXPERIMENT("run_experiment"), 
	
	SET_WATCHED_VARIABLES("set_watched_variables"),
	GET_WATCH("get_watch"),
	CLEAR_WATCHED_VARIABLES("clear_watch"),
	SET_PARAMETERS("set_parameters"),
	SET_EXPERIMENT_VIEW("set_experiment_view"),
	
	LINK_DROPBOX("link_dropbox"),
	UNLINK_DROPBOX("unlink_drobpox"),
	UPLOAD_MODEL("upload_model"),
	UPLOAD_RESULTS("upload_results"),
	GET_SUPPORTED_OUTPUTS("get_supported_outputs"),
	DOWNLOAD_MODEL("download_model"),
	DOWNLOAD_RESULTS("download_results"),
	
	//DATASOURCES
	FETCH_VARIABLE("fetch_variable"), 
	RESOLVE_IMPORT_TYPE("resolve_import_type"), 
	RESOLVE_IMPORT_VALUE("resolve_import_value"),	 
	
	//QUERIES
	RUN_QUERY("run_query"),
	RUN_QUERY_COUNT("run_query_count"),
	;

	
	private InboundMessages(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}
}
