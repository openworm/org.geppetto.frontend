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
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.frontend.GeppettoTransportMessage;
import org.geppetto.frontend.INBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.messaging.DefaultMessageSender;
import org.geppetto.frontend.messaging.DefaultMessageSenderFactory;
import org.geppetto.frontend.messaging.MessageSenderEvent;
import org.geppetto.frontend.messaging.MessageSenderListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * Class used to process Web Socket Connections. Messages sent from the connecting clients, web socket connections, are received in here.
 * 
 */
public class GeppettoMessageInbound extends MessageInbound implements MessageSenderListener
{

	/*
	 * Keeps track of mode visitor is in, either observing or controlling the simulation
	 */
	public enum VisitorRunMode
	{
		OBSERVING, CONTROLLING, WAITING
	}

	@Autowired
	private ISimulation _simulationService;

	private GeppettoServletController _servletController;
	private final String _client_id;

	protected ApplicationContext applicationContext;

	private VisitorRunMode currentMode = VisitorRunMode.OBSERVING;
	private boolean _isSimulationLoaded;

	@Autowired
	private DefaultMessageSenderFactory _messageSenderFactory;

	private DefaultMessageSender _messageSender;

	public GeppettoMessageInbound(String client_id)
	{
		super();
		this._servletController = GeppettoServletController.getInstance();
		this._client_id = client_id;
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}

	@Override
	protected void onOpen(WsOutbound outbound)
	{
		_messageSender = _messageSenderFactory.getMessageSender(getWsOutbound(), this);
		_servletController.addConnection(this);
		_messageSender.sendMessage(null, OUTBOUND_MESSAGE_TYPES.CLIENT_ID, this._client_id);
	}

	@Override
	protected void onClose(int status)
	{
		_messageSender.shutdown();
		_servletController.removeConnection(this);
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
				_servletController.getVersionNumber(requestID, this);
				break;
			}
			case INIT_URL:
			{
				String urlString = gmsg.data;
				URL url;
				try
				{
					url = new URL(urlString);
					_servletController.load(requestID, urlString, this);
					_messageSender.reset();
					_messageSender.resumeQueuedMessaging();
				}
				catch(MalformedURLException e)
				{
					messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
				}
				break;
			}
			case INIT_SIM:
			{
				String simulation = gmsg.data;
				_servletController.load(requestID, simulation, this);
				break;
			}
			case RUN_SCRIPT:
			{
				String urlString = gmsg.data;
				URL url = null;
				try
				{
					url = new URL(urlString);

					_servletController.sendScriptData(requestID, url, this);

				}
				catch(MalformedURLException e)
				{
					_servletController.messageClient(requestID, this, OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
				}
				break;
			}
			case SIM:
			{
				String url = gmsg.data;
				_servletController.getSimulationConfiguration(requestID, url, this);
				break;
			}
			case START:
			{
				_messageSender.reset();
				_messageSender.resumeQueuedMessaging();
				_servletController.startSimulation(requestID, this);
				break;
			}
			case PAUSE: {
				_messageSender.pauseQueuedMessaging();
				_messageSender.reset();
				_servletController.pauseSimulation(requestID, this);
				break;
			}
			case STOP:
			{
				_servletController.stopSimulation(requestID, this);
				_messageSender.pauseQueuedMessaging();
				_messageSender.reset();
				break;
			}
			case OBSERVE:
			{
				_servletController.observeSimulation(requestID, this);
				break;
			}
			case LIST_WATCH_VARS:
			{
				_servletController.listWatchableVariables(requestID, this);
				break;
			}
			case LIST_FORCE_VARS:
			{
				_servletController.listForceableVariables(requestID, this);
				break;
			}
			case SET_WATCH:
			{
				String watchListsString = gmsg.data;

				try
				{
					_servletController.addWatchLists(requestID, watchListsString, this);
				}
				catch(GeppettoExecutionException e)
				{
					messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_ADDING_WATCH_LIST);
				}
				catch(GeppettoInitializationException e)
				{
					messageClient(requestID, OUTBOUND_MESSAGE_TYPES.ERROR_ADDING_WATCH_LIST);
				}

				break;
			}
			case GET_WATCH:
			{
				_servletController.getWatchLists(requestID, this);
				break;
			}
			case START_WATCH:
			{
				_servletController.startWatch(requestID, this);
				break;
			}
			case STOP_WATCH:
			{
				_servletController.stopWatch(requestID, this);
				break;
			}
			case CLEAR_WATCH:
			{
				_servletController.clearWatchLists(requestID, this);
				break;
			}
			case IDLE_USER:
			{
				_servletController.disableUser(requestID, this);
				break;
			}
			case GET_MODEL_TREE:
			{
				String instancePath = gmsg.data;
				
				_servletController.getModelTree(requestID,instancePath,this);
				break;
			}
			case GET_SUPPORTED_OUTPUTS:
			{
//				String instancePath = gmsg.data;
//				
//				_servletController.getModelTree(requestID,instancePath,this);
				break;
			}
			case WRITE_MODEL:
			{
				
				Map<String, String> parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>() {}.getType());
				_servletController.writeModel(requestID,parameters.get("instancePath"),parameters.get("format"),this);
							
			}
			default:
			{
				// NOTE: no other messages expected for now
			}
		}
	}

	/**
	 * Requests JSONUtility class for a json object with a message to send to the client
	 *
	 * @param requestID
	 *
	 * @param type
	 *            - type of message to be send
	 */
	public void messageClient(String requestID, OUTBOUND_MESSAGE_TYPES type)
	{
		messageClient(requestID, type, null);
	}

	/**
	 * Requests JSONUtility class for a json object with simulation update to be send to the client
	 *
	 * @param requestID
	 *
	 * @param type
	 *            - type of message to be send
	 * @param update
	 *            - update to be sent
	 */
	public void messageClient(String requestID, OUTBOUND_MESSAGE_TYPES type, String update)
	{
		_messageSender.sendMessage(requestID, type, update);
	}

	/**
	 * Handle events from the message sender.
	 *
	 * If there's an error during message transmission then terminate connection.
	 *
	 * @param event event from the message sender.
	 */
	@Override
	public void handleMessageSenderEvent(MessageSenderEvent event) {
		if (event.getType().equals(MessageSenderEvent.Type.MESSAGE_SEND_FAILED)) {
			_messageSender.shutdown();
			_messageSender.removeListener(this);
			_servletController.removeConnection(this);
		}
	}

	public String getConnectionID()
	{
		return _client_id;
	}

	public VisitorRunMode getCurrentRunMode()
	{
		return currentMode;
	}

	public void setVisitorRunMode(VisitorRunMode mode)
	{
		currentMode = mode;
	}

	public ISimulation getSimulationService()
	{
		return this._simulationService;
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
