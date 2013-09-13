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

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;

import com.google.gson.JsonObject;

/**
 * Utility class to create JSON objects to be send to the clients. 
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class JSONUtility {

	private static JSONUtility instance;
	
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
	public JsonObject getJSONObject(OUTBOUND_MESSAGE_TYPES type){

		JsonObject json = null;

		String messageType = type.toString();
		
		List<SimpleEntry<String, String>> params = new ArrayList<SimpleEntry<String, String>>();

		switch(type){
			case RELOAD_CANVAS:
				break;	
			case ERROR_LOADING_SIMULATION:
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_LOADING_SIMULATION_MESSAGE.toString()));
				break;
			case OBSERVER_MODE:
				params.add(new SimpleEntry<String, String>("alertMessage", Resources.SIMULATION_CONTROLLED.toString()));
				params.add(new SimpleEntry<String, String>("popoverMessage", Resources.GEPPETO_SIM_INFO.toString()));
				break;
			case READ_URL_PARAMETERS:
				break;
			case SERVER_UNAVAILABLE:
				params.add(new SimpleEntry<String, String>("message", Resources.SERVER_UNAVAILABLE.toString()));
				break;
			case SERVER_AVAILABLE:
				params.add(new SimpleEntry<String, String>("message", Resources.SERVER_AVAILABLE.toString()));
				break;
			case SIMULATION_LOADED:
				break;
			case SIMULATION_STARTED:
				break;
			default:
				break;
		}
		
		// keep this as separate statement to facilitate debug
		json = createJSONMessage(messageType, params);
		
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
	public JsonObject getJSONObject(OUTBOUND_MESSAGE_TYPES type, String update) {
		JsonObject json = null;

		String messageType = type.toString();
		
		List<SimpleEntry<String, String>> params = new ArrayList<SimpleEntry<String, String>>();

		switch(type){
			case LOAD_MODEL:
				params.add(new SimpleEntry<String, String>("entities", update));
				break;
			case SCENE_UPDATE:
				params.add(new SimpleEntry<String, String>("entities", update));
				break;
			case SIMULATION_CONFIGURATION:
				params.add(new SimpleEntry<String, String>("configuration", update));
			case GEPPETTO_VERSION:
				params.add(new SimpleEntry<String, String>("version", update));
			default:
				break;
		}
		
		// keep this as separate statement to facilitate debug
		json = createJSONMessage(messageType, params);
		
		return json;
	}

	/**
	 * Create JSON object with type and parameters
	 * 
	 * @param type - Type of message 
	 * @param params - list of name-value pairs representing parameter names and values
	 * @return
	 */
	public JsonObject createJSONMessage(String type, List<SimpleEntry<String, String>> params){
		//JSON object used to send message to client
		JsonObject json = new JsonObject();
		json.addProperty("type", type);
		
		for(SimpleEntry<String, String> param : params)
		{
			json.addProperty(param.getKey(), param.getValue());
		}

		return json;
	}
}
