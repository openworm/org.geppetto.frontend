package org.geppetto.frontend.messages;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;

import org.geppetto.frontend.Resources;

import com.google.gson.JsonObject;

/**
 * Utility class to create JSON objects to be send to the clients. 
 * NOTE: this utility class has knowledge of what the messages looks like to communicate with the client
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 * @author  Giovanni Idili (giovanni@openworm.org)
 *
 */
public class TransportMessageFactory {
	
	private static final String EMPTY_STRING = "";
	
	/**
	 * Create JSON object with appropriate message for its type
	 * @param id 
	 * 
	 * @param type - Type of message of requested
	 * @return
	 */
	public static GeppettoTransportMessage getTransportMessage(String requestID, OutboundMessages type, String update){

		String messageType = type.toString();
		
		List<SimpleEntry<String, String>> params = new ArrayList<SimpleEntry<String, String>>();

		switch(type){
			case ERROR:
				params.add(new SimpleEntry<String, String>("message", update));
				break;
			case INFO_MESSAGE:
				params.add(new SimpleEntry<String, String>("message", update));
				break;
			case ERROR_LOADING_PROJECT:
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_LOADING_PROJECT_MESSAGE.toString()));
				break;
			case ERROR_DOWNLOADING_MODEL:	
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_DOWNLOADING_MODEL.toString()));
				break;
			case ERROR_DOWNLOADING_RESULTS:	
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_DOWNLOADING_MODEL.toString()));
				break;	
			case READ_URL_PARAMETERS:
				break;
			case USER_PRIVILEGES:
				params.add(new SimpleEntry<String, String>(OutboundMessages.USER_PRIVILEGES.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case PROJECT_LOADED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.PROJECT_LOADED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case GEPPETTO_MODEL_LOADED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.GEPPETTO_MODEL_LOADED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case VARIABLE_FETCHED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.VARIABLE_FETCHED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case IMPORT_TYPE_RESOLVED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.IMPORT_TYPE_RESOLVED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_OVER:
				params.add(new SimpleEntry<String, String>(OutboundMessages.SIMULATION_OVER.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;	
			case FIRE_SIM_SCRIPTS:
				params.add(new SimpleEntry<String, String>(OutboundMessages.GET_SCRIPTS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case EXPERIMENT_RUNNING:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case EXPERIMENT_STATUS:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case DOWNLOAD_MODEL:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case DOWNLOAD_PROJECT:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case GET_EXPERIMENT_STATE:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case DELETE_EXPERIMENT:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_CONFIGURATION:
				params.add(new SimpleEntry<String, String>("configuration", (update!=null) ? update : EMPTY_STRING));
				break;
		
			case CLIENT_ID:
				params.add(new SimpleEntry<String, String>("clientID", (update!=null) ? update : EMPTY_STRING));
				break;
			case PROJECT_PERSISTED:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case PROJECT_MADE_PUBLIC:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case PROJECT_PROPS_SAVED:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case EXPERIMENT_PROPS_SAVED:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case DROPBOX_LINKED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.DROPBOX_LINKED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case DROPBOX_UNLINKED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.DROPBOX_UNLINKED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case RESULTS_UPLOADED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.RESULTS_UPLOADED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case MODEL_UPLOADED:
				params.add(new SimpleEntry<String, String>(OutboundMessages.MODEL_UPLOADED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			default:
				params.add(new SimpleEntry<String, String>(type.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
		}
		
		return createTransportMessage(requestID,messageType, params);
	}
	
	/**
	 * Create JSON object with type and parameters
	 * 
	 * @param type - Type of message 
	 * @param params - list of name-value pairs representing parameter names and values
	 * @return
	 */
	private static GeppettoTransportMessage createTransportMessage(String requestID,String type, List<SimpleEntry<String, String>> params){
		GeppettoTransportMessage msg = new GeppettoTransportMessage();
		
		// JSON nested object stored in the data field of the transport message
		JsonObject json = new JsonObject();
		for(SimpleEntry<String, String> param : params)
		{
			json.addProperty(param.getKey(), param.getValue());
		}

		msg.requestID = requestID;
		msg.type = type;
		// data stored as a string (could be anything) - will be interpreted by the client as a json object
		msg.data = json.toString();
		
		return msg;
	}
}
