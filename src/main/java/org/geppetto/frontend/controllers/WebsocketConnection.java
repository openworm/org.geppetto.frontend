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
package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.HashMap;
import java.util.Map;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.frontend.GeppettoTransportMessage;
import org.geppetto.frontend.INBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * Class used to process Web Socket Connections. Messages sent from the connecting clients, web socket connections, are received in here.
 * 
 */
public class WebsocketConnection extends MessageInbound
{

	private ConnectionHandler connectionHandler;
	
	private String connectionID;

	protected ApplicationContext applicationContext;

	private boolean _isSimulationLoaded;
	
	private IGeppettoProject geppettoProject;

	public WebsocketConnection()
	{
		super();
		this.connectionHandler = new ConnectionHandler(this);
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}

	@Override
	protected void onOpen(WsOutbound outbound)
	{
		connectionID = ConnectionsManager.getInstance().addConnection(this);
		connectionHandler.messageClient(null, OUTBOUND_MESSAGE_TYPES.CLIENT_ID, connectionID);
	}

	@Override
	protected void onClose(int status)
	{
		ConnectionsManager.getInstance().removeConnection(this);
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException
	{
		throw new UnsupportedOperationException("Binary message not supported.");
	}

	/**
	 * Receives message(s) from client.
	 * 
	 * @throws JsonProcessingException
	 */
	@Override
	protected void onTextMessage(CharBuffer message) throws JsonProcessingException
	{
		String msg = message.toString();

		// de-serialize JSON
		GeppettoTransportMessage gmsg = new Gson().fromJson(msg, GeppettoTransportMessage.class);

		String requestID = gmsg.requestID;

		// switch on message type
		// NOTE: each message handler knows how to interpret the GeppettoMessage data field
		switch(INBOUND_MESSAGE_TYPES.valueOf(gmsg.type.toUpperCase()))
		{
			case GEPPETTO_VERSION:
			{
				connectionHandler.getVersionNumber(requestID);
				break;
			}
			case LOAD_PROJECT_FROM_URL:
			{
				connectionHandler.loadProjectFromURL(requestID, gmsg.data);
				break;
			}
			case LOAD_PROJECT_FROM_ID:
			{
				connectionHandler.loadProjectFromId(requestID, gmsg.data);
				break;
			}
			case LOAD_PROJECT_FROM_CONTENT:
			{
				connectionHandler.loadProjectFromContent(requestID, gmsg.data);
				break;
			}
			case RUN_SCRIPT:
			{
				String urlString = gmsg.data;
				URL url = null;
				try
				{
					url = new URL(urlString);

					connectionHandler.sendScriptData(requestID, url, this);

				}
				catch(MalformedURLException e)
				{
					connectionHandler.messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
				}
				break;
			}
			case SIM:
			{
				String url = gmsg.data;
				connectionHandler.getSimulationConfiguration(requestID, url, this);
				break;
			}
			case RUN:
			{
				connectionHandler.runExperiment(requestID,01,geppettoProject, this);
				break;
			}
			case OBSERVE:
			{
				connectionHandler.observeSimulation(requestID, this);
				break;
			}
			case SET_WATCH:
			{
				String watchListsString = gmsg.data;

				try
				{
					connectionHandler.setWatchedVariables(requestID, watchListsString, this);
				}
				catch(GeppettoExecutionException e)
				{
					connectionHandler.messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_SETTING_WATCHED_VARIABLES);
				}
				catch(GeppettoInitializationException e)
				{
					connectionHandler.messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_SETTING_WATCHED_VARIABLES);
				}

				break;
			}
			case CLEAR_WATCH:
			{
				connectionHandler.clearWatchLists(requestID, this);
				break;
			}
			case IDLE_USER:
			{
				connectionHandler.userBecameIdle(requestID, this);
				break;
			}
			case GET_MODEL_TREE:
			{
				String instancePath = gmsg.data;

				connectionHandler.getModelTree(requestID, instancePath, this);
				break;
			}
			case GET_SIMULATION_TREE:
			{
				String instancePath = gmsg.data;

				connectionHandler.getSimulationTree(requestID, instancePath, this);
				break;
			}
			case GET_SUPPORTED_OUTPUTS:
			{
				// String instancePath = gmsg.data;
				//
				// _servletController.getModelTree(requestID,instancePath,this);
				break;
			}
			case WRITE_MODEL:
			{

				Map<String, String> parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				connectionHandler.writeModel(requestID, parameters.get("instancePath"), parameters.get("format"), this);

			}
			case SET_PARAMETERS:
			{
				Map<String, String> parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());

				String modelPath = parameters.get("model");
				// remove model path from parameters map that was sent from server
				parameters.remove(modelPath);
				connectionHandler.setParameters(requestID, modelPath, parameters, this);
			}
			default:
			{
				// NOTE: no other messages expected for now
			}
		}
	}


	public String getConnectionID()
	{
		return connectionID;
	}

	public boolean isSimulationLoaded()
	{
		return _isSimulationLoaded;
	}

	public void setIsSimulationLoaded(boolean loaded)
	{
		this._isSimulationLoaded = loaded;
	}

}
