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

import com.google.gson.JsonObject;

/**
 * Utility class to create JSON objects to be send to the clients. 
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class JSONUtility {

	private static JSONUtility instance;

	/*
	 * Stores different types of messages that can be send to the clients
	 */
	public enum MESSAGES_TYPES {
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
		CLEAR_CANVAS("clear_canvas"),
		SIMULATION_CONFIGURATION("simulation_configuration"),
		ERROR_LOADING_SIMULATION_CONFIG("error_loading_simulation_config");

		private MESSAGES_TYPES(final String text) {
			this.text = text;
		}

		private final String text;

		@Override
		public String toString() {
			return text;
		}

	}

	public static JSONUtility getInstance() {
		if(instance == null) {
			instance = new JSONUtility();
		}
		return instance;
	}

	/**
	 * Create JSON object with appropriate message for its type
	 * 
	 * @param type - Type of message of requested
	 * @return
	 */
	public JsonObject getJSONObject(MESSAGES_TYPES type){

		JsonObject json = null;

		String messageType = type.toString();

		switch(type){

		case CLEAR_CANVAS:
			json = createJSONMessage(messageType);
			break;	
		case ERROR_LOADING_SIMULATION:
			json =
			createJSONMessage(messageType, "message", Resources.ERROR_LOADING_SIMULATION_MESSAGE.toString());
			break;
		case OBSERVER_MODE:
			json =
			createJSONMessage(messageType, "alertMessage", Resources.SIMULATION_CONTROLLED.toString(), "popoverMessage", Resources.GEPPETO_SIM_INFO.toString());
			break;
		case READ_URL_PARAMETERS:
			json = createJSONMessage(messageType);
			break;
		case SERVER_UNAVAILABLE:
			json =
			createJSONMessage(messageType, "message", Resources.SERVER_UNAVAILABLE.toString());
			break;
		case SERVER_AVAILABLE:
			json =
			createJSONMessage(messageType, "message", Resources.SERVER_AVAILABLE.toString());
			break;
		case SIMULATION_LOADED:
			json =
			createJSONMessage(messageType);
			break;
		case SIMULATION_STARTED:
			json =
			createJSONMessage(messageType);
			break;
		default:
			break;
		}

		return json;
	}

	/**
	 * Create JSON object for appropriate message type, overloaded with extra parameter
	 * to add to JSON object.
	 * 
	 * @param type - Type of message requested
	 * @param update - Parameter requested to be part of JSON object
	 * @return
	 */
	public JsonObject getJSONObject(MESSAGES_TYPES type, String update) {
		JsonObject json = null;

		String messageType = type.toString();

		switch(type){
		
		case LOAD_MODEL:
			json = createJSONMessage(messageType, "entities", update);
			break;

		case SCENE_UPDATE:
			json = createJSONMessage(messageType, "entities", update);
			break;
			
		case SIMULATION_CONFIGURATION:
			json = createJSONMessage(messageType, "configuration", update);

		default:
			break;

		}

		return json;
	}

	/**
	 * Create JSON object with no parameters only type
	 * 
	 */
	public JsonObject createJSONMessage(String type){
		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);

		return json;
	}

	/**
	 * Create JSON object with type and parameters
	 * 
	 * @param type - Type of message 
	 * @param name - name of first parameter
	 * @param param - actual parameter
	 * @return
	 */
	public JsonObject createJSONMessage(String type, String name, String param){
		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);
		json.addProperty(name, param);	

		return json;
	}


	/**
	 * Creates a JSONObject for type with two parameters.
	 * 
	 * @param type - Type of message
	 * @param name1 - name of first parameter
	 * @param param1 - first parameter
	 * @param name2 - name of second parameter
	 * @param param2 - second parameter
	 * @return
	 */
	public JsonObject createJSONMessage(String type, String name1, String param1, String name2, String param2){

		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);
		json.addProperty(name1,param1);
		json.addProperty(name2, param2);

		return json;
	}
}
