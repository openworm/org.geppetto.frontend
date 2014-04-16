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
	public static GeppettoTransportMessage getTransportMessage(String requestID, OUTBOUND_MESSAGE_TYPES type, String update){

		String messageType = type.toString();
		
		List<SimpleEntry<String, String>> params = new ArrayList<SimpleEntry<String, String>>();

		switch(type){
			case RELOAD_CANVAS:
				break;	
			case ERROR:
				params.add(new SimpleEntry<String, String>("message", update));
				break;
			case ERROR_LOADING_SIMULATION:
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_LOADING_SIMULATION_MESSAGE.toString()));
				break;
			case ERROR_ADDING_WATCH_LIST:
				params.add(new SimpleEntry<String, String>("message", Resources.ERROR_ADDING_WATCH_MESSAGE.toString()));
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
			case SIMULATOR_FULL:
				params.add(new SimpleEntry<String, String>("simulatorFull",  (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_LOADED:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.SIMULATION_LOADED.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_OVER:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.SIMULATION_OVER.toString(),  (update!=null) ? update : EMPTY_STRING));
				break;	
			case FIRE_SIM_SCRIPTS:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.GET_SCRIPTS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_STARTED:
				break;
			case LOAD_MODEL:
			case SCENE_UPDATE:
				params.add(new SimpleEntry<String, String>("update", (update!=null) ? update : EMPTY_STRING));
				break;
			case SIMULATION_CONFIGURATION:
				params.add(new SimpleEntry<String, String>("configuration", (update!=null) ? update : EMPTY_STRING));
				break;
			case GEPPETTO_VERSION:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.GEPPETTO_VERSION.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case RUN_SCRIPT:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.RUN_SCRIPT.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case LIST_WATCH_VARS:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.LIST_WATCH_VARS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case LIST_FORCE_VARS:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.LIST_FORCE_VARS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case GET_WATCH_LISTS:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.GET_WATCH_LISTS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case START_WATCH:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.GET_WATCH_LISTS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case SET_WATCH_LISTS:
				params.add(new SimpleEntry<String, String>(OUTBOUND_MESSAGE_TYPES.GET_WATCH_LISTS.toString(), (update!=null) ? update : EMPTY_STRING));
				break;
			case CLIENT_ID:
				params.add(new SimpleEntry<String, String>("clientID", (update!=null) ? update : EMPTY_STRING));
				break;
			default:
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
