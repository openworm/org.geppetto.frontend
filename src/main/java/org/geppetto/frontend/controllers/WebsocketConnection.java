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
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.utilities.URLReader;
import org.geppetto.frontend.messages.GeppettoTransportMessage;
import org.geppetto.frontend.messages.InboundMessages;
import org.geppetto.frontend.messages.OutboundMessages;
import org.geppetto.frontend.messaging.DefaultMessageSenderFactory;
import org.geppetto.frontend.messaging.MessageSender;
import org.geppetto.frontend.messaging.MessageSenderEvent;
import org.geppetto.frontend.messaging.MessageSenderListener;
import org.geppetto.simulation.manager.ExperimentRunManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * Class used to process Web Socket Connections. Messages sent from the connecting clients, web socket connections, are received in here.
 * 
 * @author matteocantarelli
 *
 */
public class WebsocketConnection extends MessageInbound implements MessageSenderListener
{

	private static Log logger = LogFactory.getLog(WebsocketConnection.class);

	private ConnectionHandler connectionHandler;

	private String connectionID;

	protected ApplicationContext applicationContext;

	@Autowired
	private DefaultMessageSenderFactory messageSenderFactory;

	private MessageSender messageSender;

	@Autowired
	private IGeppettoManager geppettoManager;

	public WebsocketConnection()
	{
		super();
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
		// FIXME Matteo: The following line is in the wrong place but any proper place seems to break DataNucleus.
		// By calling getInstance on the ExperimentRunManager we are initializing it since the first time getInstance
		// is called we check the database to see if there are any experiments queued that should be executed.
		// Calling getInstance on ExperimentRunManager triggers this process. Ideally the ExperimentRunManager
		// should be a spring bean with scope singleton but when the different parts of the application were trying to use
		// it autowired the application was hanging without exceptions or error...so this class became a traditional
		// singleton. Ideally the singleton should be initialized as soon as the geppetto server starts, for this reason an
		// ApplicationListenerBean was added. Unfortunately if the ExperimentRunManager is initialized before the bundle is
		// started DataNucleus starts giving problems. In the initializaton of ExperimentRunManager there is a method called
		// loadExperiment which queries the database to fetch the projects. After hours of investigation turns out that if
		// a query is performed before the bundle is started then DataNucleus will subsequently have problems when performing
		// perist opeartions, complaining that classes are not resolved and throwing ClassNotResolvedException. The issue
		// was manifesting itself as soon as something was getting persisted, e.g. calling setActiveExperiment on a project.
		// The downside of this line being here, beside being obviously the wrong place is that the ExperimentRunManager
		// will get initialized only AFTER someone connects, so there has to be at least one connection before geppetto
		// starts running experiments, this is as likely to happen as ugly.
		ExperimentRunManager.getInstance();
		// End of the rant, I hope the above will sound silly and wrong in the future. Matteo
		this.connectionHandler = new ConnectionHandler(this, geppettoManager);
	}

	@Override
	protected void onOpen(WsOutbound outbound)
	{
		messageSender = messageSenderFactory.getMessageSender(getWsOutbound(), this);
		connectionID = ConnectionsManager.getInstance().addConnection(this);
		sendMessage(null, OutboundMessages.CLIENT_ID, connectionID);
	}

	@Override
	protected void onClose(int status)
	{
		messageSender.shutdown();
		connectionHandler.closeProject();
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
		messageSender.sendMessage(requestID, type, message);
	}

	/**
	 * @param requestID
	 * @param type
	 * @param message
	 */
	public void sendBinaryMessage(String requestID, Path path)
	{
		messageSender.sendFile(path);
	}

	/**
	 * Receives message(s) from client.
	 * 
	 * @throws IOException
	 */
	@Override
	protected void onTextMessage(CharBuffer message) throws IOException
	{
		String msg = message.toString();

		Map<String, String> parameters;
		long experimentId = -1;
		long projectId = -1;
		String instancePath = null;

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
			case NEW_EXPERIMENT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.newExperiment(requestID, projectId);
				break;
			}
			case LOAD_PROJECT_FROM_URL:
			{
				connectionHandler.loadProjectFromURL(requestID, gmsg.data);
				messageSender.reset();
				break;
			}
			case LOAD_PROJECT_FROM_ID:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				if(parameters.containsKey("experimentId"))
				{
					experimentId = Long.parseLong(parameters.get("experimentId"));
				}
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.loadProjectFromId(requestID, projectId, experimentId);
				messageSender.reset();
				break;
			}
			case LOAD_PROJECT_FROM_CONTENT:
			{
				connectionHandler.loadProjectFromContent(requestID, gmsg.data);
				messageSender.reset();
				break;
			}
			case PERSIST_PROJECT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.persistProject(requestID, projectId);
				break;
			}
			case SAVE_PROJECT_PROPERTIES:
			{
				ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
				connectionHandler.saveProjectProperties(requestID, receivedObject.projectId, receivedObject.properties);
				break;
			}
			case SAVE_EXPERIMENT_PROPERTIES:
			{
				ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
				connectionHandler.saveExperimentProperties(requestID, receivedObject.projectId, receivedObject.experimentId, receivedObject.properties);
				break;
			}
			case LOAD_EXPERIMENT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.loadExperiment(requestID, experimentId, projectId);
				break;
			}
			case GET_SCRIPT:
			{
				String urlString = gmsg.data;
				URL url = null;
				try
				{
					url = URLReader.getURL(urlString);

					connectionHandler.sendScriptData(requestID, url, this);

				}
				catch(MalformedURLException e)
				{
					sendMessage(requestID, OutboundMessages.ERROR_READING_SCRIPT, "");
				}
				break;
			}
			case PLAY_EXPERIMENT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.playExperiment(requestID, experimentId, projectId);
				break;
			}
			case DELETE_EXPERIMENT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.deleteExperiment(requestID, experimentId, projectId);
				break;
			}
			case RUN_EXPERIMENT:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				connectionHandler.runExperiment(requestID, experimentId, projectId);
				break;
			}
			case SET_WATCHED_VARIABLES:
			{
				ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
				try
				{
					connectionHandler.setWatchedVariables(requestID, receivedObject.variables, receivedObject.experimentId, receivedObject.projectId, receivedObject.watch);
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
			case GET_SUPPORTED_OUTPUTS:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				instancePath = parameters.get("instancePath");
				connectionHandler.getSupportedOuputs(requestID, instancePath, experimentId, projectId);
				break;
			}
			case DOWNLOAD_MODEL:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				instancePath = parameters.get("instancePath");
				String format = parameters.get("format");
				connectionHandler.downloadModel(requestID, instancePath, format, experimentId, projectId);
				break;
			}
			case SET_PARAMETERS:
			{
				ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
				connectionHandler.setParameters(requestID, receivedObject.modelParameters, receivedObject.projectId, receivedObject.experimentId);
				break;
			}
			case LINK_DROPBOX:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				String key = parameters.get("key");
				connectionHandler.linkDropBox(requestID, key);
				break;
			}
			case UNLINK_DROPBOX:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				String key = parameters.get("key");
				connectionHandler.unLinkDropBox(requestID, key);
				break;
			}
			case UPLOAD_MODEL:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				String format = parameters.get("format");
				String aspectPath = parameters.get("aspectPath");
				connectionHandler.uploadModel(aspectPath, projectId, experimentId, format);
				break;
			}
			case UPLOAD_RESULTS:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				String format = parameters.get("format");
				String aspectPath = parameters.get("aspectPath");
				connectionHandler.uploadResults(aspectPath, projectId, experimentId, format);
				break;
			}
			case DOWNLOAD_RESULTS:
			{
				parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
				{
				}.getType());
				experimentId = Long.parseLong(parameters.get("experimentId"));
				projectId = Long.parseLong(parameters.get("projectId"));
				String format = parameters.get("format");
				String aspectPath = parameters.get("aspectPath");
				connectionHandler.downloadResults(requestID, aspectPath, projectId, experimentId, format);
				break;
			}
			case EXPERIMENT_STATUS:
			{
				connectionHandler.checkExperimentStatus(requestID, gmsg.data);
				break;
			}
			case FETCH_VARIABLE:
			{
				GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
				connectionHandler.fetchVariable(requestID, receivedObject.projectId, receivedObject.experimentId, receivedObject.dataSourceId, receivedObject.variableId);
				break;
			}
			case RESOLVE_IMPORT_TYPE:
			{
				GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
				connectionHandler.resolveImportType(requestID, receivedObject.projectId, receivedObject.experimentId, receivedObject.path);
				break;
			}
			default:
			{
				// NOTE: no other messages expected for now
			}
		}
	}

	/**
	 * @return
	 */
	public String getConnectionID()
	{
		return connectionID;
	}

	/**
	 * Handle events from the message sender.
	 *
	 * If there's an error during message transmission then terminate connection.
	 *
	 * @param event
	 *            event from the message sender.
	 */
	@Override
	public void handleMessageSenderEvent(MessageSenderEvent event)
	{
		if(event.getType().equals(MessageSenderEvent.Type.MESSAGE_SEND_FAILED))
		{
			messageSender.shutdown();
			messageSender.removeListener(this);
			ConnectionsManager.getInstance().removeConnection(this);
		}
	}

	class ReceivedObject
	{
		Long projectId;
		Long experimentId;
		List<String> variables;
		boolean watch;
		Map<String, String> modelParameters;
		Map<String, String> properties;
	}

	class GeppettoModelAPIParameters
	{
		Long projectId;
		Long experimentId;
		String dataSourceId;
		String path;
		String variableId;
	}

}
