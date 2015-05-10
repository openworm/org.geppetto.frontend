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
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.frontend.messages.GeppettoTransportMessage;
import org.geppetto.frontend.messages.InboundMessages;
import org.geppetto.frontend.messages.OutboundMessages;
import org.geppetto.frontend.messages.TransportMessageFactory;
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

	private static Log logger = LogFactory.getLog(WebsocketConnection.class);

	private ConnectionHandler connectionHandler;

	private String connectionID;

	protected ApplicationContext applicationContext;

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
		sendMessage(null, OutboundMessages.CLIENT_ID, connectionID);
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
	 * @param requestID
	 * @param type
	 * @param message
	 */
	public void sendMessage(String requestID, OutboundMessages type, String message)
	{
		// get transport message to be sent to the client
		GeppettoTransportMessage transportMsg = TransportMessageFactory.getTransportMessage(requestID, type, message);
		String msg = new Gson().toJson(transportMsg);

		try
		{
			long startTime = System.currentTimeMillis();
			CharBuffer buffer = CharBuffer.wrap(msg);
			getWsOutbound().writeTextMessage(buffer);
			String debug = ((long) System.currentTimeMillis() - startTime) + "ms were spent sending a message of " + msg.length() / 1024 + "KB to the client";
			logger.info(debug);
		}
		catch(IOException ignore)
		{
			logger.error("Unable to communicate with client " + ignore.getMessage());
			ConnectionsManager.getInstance().removeConnection(this);
		}
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
		switch(InboundMessages.valueOf(gmsg.type.toUpperCase()))
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
					sendMessage(requestID, OutboundMessages.ERROR_READING_SCRIPT, "");
				}
				break;
			}
			case SIM:
			{
				// TODO Check will this disappear?
				// String url = gmsg.data;
				// connectionHandler.getSimulationConfiguration(requestID, url, this);
				break;
			}
			case RUN:
			{
				String data = gmsg.data;
				// TODO extract experimentId and projectId from data
				long experimentId = 0;
				long projectId = 0;
				connectionHandler.runExperiment(requestID, experimentId, projectId);
				break;
			}
			case OBSERVE:
			{
				// TODO Send an error, observer mode not supported anymore
				break;
			}
			case SET_WATCHED_VARIABLES:
			{
				String watchListsString = gmsg.data;

				try
				{
					connectionHandler.setWatchedVariables(requestID, watchListsString);
				}
				catch(GeppettoExecutionException e)
				{
					sendMessage(requestID, OutboundMessages.ERROR_SETTING_WATCHED_VARIABLES, "");
				}
				catch(GeppettoInitializationException e)
				{
					sendMessage(requestID, OutboundMessages.ERROR_SETTING_WATCHED_VARIABLES, "");
				}

				break;
			}
			case CLEAR_WATCHED_VARIABLES:
			{
				connectionHandler.clearWatchLists(requestID);
				break;
			}
			case IDLE_USER:
			{
				connectionHandler.userBecameIdle(requestID);
				break;
			}
			case GET_MODEL_TREE:
			{
				String instancePath = gmsg.data;

				connectionHandler.getModelTree(requestID, instancePath);
				break;
			}
			case GET_SIMULATION_TREE:
			{
				String instancePath = gmsg.data;

				connectionHandler.getSimulationTree(requestID, instancePath);
				break;
			}
			case GET_SUPPORTED_OUTPUTS:
			{
				// String instancePath = gmsg.data;
				//
				// _servletController.getModelTree(requestID,instancePath);
				break;
			}
			case WRITE_MODEL:
			{

				Map<String, String> parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				connectionHandler.writeModel(requestID, parameters.get("instancePath"), parameters.get("format"));

			}
			case SET_PARAMETERS:
			{
				Map<String, String> parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());

				String modelPath = parameters.get("model");
				// remove model path from parameters map that was sent from server
				parameters.remove(modelPath);
				connectionHandler.setParameters(requestID, modelPath, parameters);
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

}
