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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Date;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.data.DataManagerHelper;
import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IExperiment;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.core.data.model.IUser;
import org.geppetto.core.manager.IGeppettoManager;
import org.geppetto.core.simulation.IGeppettoManagerCallbackListener;
import org.geppetto.frontend.messages.OutboundMessages;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;

/**
 * Class that handles the Web Socket connections the servlet is receiving.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author matteocantarelli
 * 
 */
public class ConnectionHandler
{

	private static Log _logger = LogFactory.getLog(ConnectionHandler.class);

	//TODO CHECK this is autowired with session scope
	@Autowired
	private IGeppettoManager geppettoManager;

	@Autowired
	private SimulationServerConfig _simulationServerConfig;

	private IGeppettoManagerCallbackListener geppettoManagerCallbackListener;

	private WebsocketConnection websocketConnection;

	/**
	 * @param websocketConnection
	 */
	protected ConnectionHandler(WebsocketConnection websocketConnection)
	{
		this.websocketConnection = websocketConnection;
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}

	/**
	 * @param requestID
	 * @param projectId
	 */
	public void loadProjectFromId(String requestID, String projectId)
	{
		IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
		try
		{
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(Long.parseLong(projectId));
			loadGeppettoProject(requestID, geppettoProject);
		}
		catch(NumberFormatException e)
		{
			sendMessage(requestID, OutboundMessages.ERROR_LOADING_PROJECT,"");
		}
	}

	/**
	 * @param requestID
	 * @param projectContent
	 */
	public void loadProjectFromContent(String requestID, String projectContent)
	{
		IGeppettoProject geppettoProject = DataManagerHelper.getDataManager().getProjectFromJson(getGson(), projectContent);
		loadGeppettoProject(requestID, geppettoProject);
	}

	/**
	 * @param requestID
	 * @param urlString
	 */
	public void loadProjectFromURL(String requestID, String urlString)
	{
		URL url;
		try
		{
			url = new URL(urlString);
			BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream()));
			IGeppettoProject geppettoProject = DataManagerHelper.getDataManager().getProjectFromJson(getGson(), reader);
			loadGeppettoProject(requestID, geppettoProject);
		}
		catch(IOException e)
		{
			sendMessage(requestID, OutboundMessages.ERROR_LOADING_PROJECT,"");
		}
	}

	/**
	 * @param requestID
	 * @param geppettoProject
	 */
	public void loadGeppettoProject(String requestID, IGeppettoProject geppettoProject)
	{
		try
		{
			// TODO: get the user from somewhere
			IUser user = null;
			geppettoManager.loadProject(requestID, geppettoProject, geppettoManagerCallbackListener);

			postLoadProject(requestID);

		}
		catch(MalformedURLException | GeppettoInitializationException | GeppettoExecutionException e)
		{
			_logger.info("Could not load geppetto project", e);
			sendMessage(requestID, OutboundMessages.ERROR_LOADING_PROJECT,"");
		}

	}

	/**
	 * @return
	 */
	private Gson getGson()
	{
		GsonBuilder builder = new GsonBuilder();
		builder.registerTypeAdapter(Date.class, new JsonDeserializer<Date>()
		{
			@Override
			public Date deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException
			{
				return new Date(json.getAsJsonPrimitive().getAsLong());
			}
		});
		return builder.create();
	}

	/**
	 * @return
	 */
	public SimulationServerConfig getSimulationServerConfig()
	{
		return _simulationServerConfig;
	}

	// SIM TODO: This method is reading the script from a Geppetto model once project is loaded and send it to the client.
	// Execute this logic once either the project is loaded or an experiment is loaded.
	/**
	 * Runs scripts that are specified in the simulation
	 * 
	 * @param requestID
	 *            - requestID received from client
	 * @param messageInbound
	 *            - the Geppetto message inbound
	 */
	private void postLoadProject(String requestID)
	{

		sendMessage(requestID, OutboundMessages.PROJECT_LOADED, "");
	}

	/**
	 * Run the Experiment
	 */
	public void runExperiment(String requestID, long experimentID, long projectId)
	{
		try
		{
			IGeppettoDataManager dataManager = DataManagerHelper.getDataManager();
			IGeppettoProject geppettoProject = dataManager.getGeppettoProjectById(projectId);
			IExperiment theExperiment = null;
			// Look for experiment that matches id passed
			for(IExperiment e : geppettoProject.getExperiments())
			{
				if(e.getId() == experimentID)
				{
					// The experiment is found
					theExperiment = e;
				}
			}

			// TODO: get the user from somewhere
			IUser user = null;
			// run the matched experiment
			if(theExperiment == null)
			{
				this.geppettoManager.runExperiment(requestID, user, theExperiment);
			}
			else
			{
				// TODO: Can the case of the user requestin to run experiment
				// that isn't in project ever happen
			}

			// TODO: Launch scripts when an experiment starts running
			// JsonObject scriptsJSON = new JsonObject();
			//
			// JsonArray scriptsArray = new JsonArray();
			// for(URL scriptURL : messageInbound.getSimulationService().getScripts())
			// {
			// JsonObject script = new JsonObject();
			// script.addProperty("script", scriptURL.toString());
			//
			// scriptsArray.add(script);
			// }
			// scriptsJSON.add("scripts", scriptsArray);
			//
			// // notify client if there are scripts
			// if(messageInbound.getSimulationService().getScripts().size() > 0)
			// {
			// messageClient(requestID, messageInbound, OUTBOUND_MESSAGE_TYPES.FIRE_SIM_SCRIPTS, scriptsJSON.toString());
			// }
		}
		catch(GeppettoInitializationException e)
		{
			throw new RuntimeException(e);
		}
	}



	/**
	 * Adds watch lists with variables to be watched
	 * 
	 * @throws GeppettoExecutionException
	 * @throws JsonProcessingException
	 * @throws GeppettoInitializationException
	 */
	public void setWatchedVariables(String requestID, String jsonLists) throws GeppettoExecutionException, GeppettoInitializationException
	{
		// List<String> lists = fromJSON(new TypeReference<List<String>>()
		// {
		// }, jsonLists);
		//
		// visitor.getSimulationService().setWatchedVariables(lists);
		//
		// // serialize watch-lists
		// ObjectMapper mapper = new ObjectMapper();
		// String serializedLists;
		// try
		// {
		// serializedLists = mapper.writer().writeValueAsString(lists);
		// }
		// catch(JsonProcessingException e)
		// {
		// throw new GeppettoExecutionException(e);
		// }
		//
		// // message the client the watch lists were added
		// messageClient(requestID, OUTBOUND_MESSAGE_TYPES.SET_WATCHED_VARIABLES, serializedLists);

	}

	/**
	 * instructs simulation to clear watch lists
	 */
	public void clearWatchLists(String requestID)
	{
		// visitor.getSimulationService().clearWatchLists();
		//
		// // message the client the watch lists were cleared
		// messageClient(requestID, OUTBOUND_MESSAGE_TYPES.CLEAR_WATCH);
	}





	public void getSimulationConfiguration(String requestID, String url, WebsocketConnection visitor)
	{
		// TODO: Fix for showing project configuration
		// String simulationConfiguration;
		//
		// try
		// {
		// simulationConfiguration = visitor.getSimulationService().getSimulationConfig(new URL(url));
		// messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SIMULATION_CONFIGURATION, simulationConfiguration);
		// }
		// catch(MalformedURLException e)
		// {
		// messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG, e.getMessage());
		// }
		// catch(GeppettoInitializationException e)
		// {
		// messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION_CONFIG, e.getMessage());
		// }
	}

	public void getVersionNumber(String requestID)
	{
		Properties prop = new Properties();

		try
		{
			prop.load(ConnectionHandler.class.getResourceAsStream("/Geppetto.properties"));
			websocketConnection.sendMessage(requestID, OutboundMessages.GEPPETTO_VERSION, prop.getProperty("Geppetto.version"));
		}
		catch(IOException e)
		{
			_logger.error("Unable to read GEPPETTO.properties file");
		}
	}

	public void getModelTree(String requestID, String aspectInstancePath, WebsocketConnection visitor)
	{
		// String modelTree = this._projectManager.
		//
		// // message the client with results
		// this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GET_MODEL_TREE, modelTree);
	}

	public void getSimulationTree(String requestID, String aspectInstancePath, WebsocketConnection visitor)
	{
		// String simulationTree = visitor.getSimulationService().getSimulationTree(aspectInstancePath);
		//
		// // message the client with results
		// this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.GET_SIMULATION_TREE, simulationTree);
	}

	public void writeModel(String requestID, String instancePath, String format, WebsocketConnection visitor)
	{
		// String modelTree = visitor.getSimulationService().writeModel(instancePath, format);
		//
		// // message the client with results
		// this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.WRITE_MODEL, modelTree);
	}

	/**
	 * Sends parsed data from script to visitor client
	 * 
	 * @param requestID
	 *            - Requested ID for process
	 * @param url
	 *            - URL of script location
	 * @param visitor
	 *            - Client doing the operation
	 */
	public void sendScriptData(String requestID, URL url, WebsocketConnection visitor)
	{
		try
		{
			String line = null;
			StringBuilder sb = new StringBuilder();

			BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));

			while((line = br.readLine()) != null)
			{
				sb.append(line + "\n");
			}
			String script = sb.toString();

			sendMessage(requestID, OutboundMessages.RUN_SCRIPT, script);
		}
		catch(IOException e)
		{
			sendMessage(requestID, OutboundMessages.ERROR_READING_SCRIPT, "");
		}
	}

	public static <T> T fromJSON(final TypeReference<T> type, String jsonPacket) throws GeppettoExecutionException
	{
		T data = null;

		try
		{
			data = new ObjectMapper().readValue(jsonPacket, type);
		}
		catch(Exception e)
		{
			throw new GeppettoExecutionException("could not de-serialize json");
		}
		return data;
	}

	public void userBecameIdle(String requestID)
	{
		ConnectionsManager.getInstance().removeConnection(websocketConnection);
		// TODO what do we do?
	}

	public void setParameters(String requestID, String modelPath, Map<String, String> parameters, WebsocketConnection visitor)
	{

		// boolean parametersSet = visitor.getSimulationService().setParameters(modelPath, parameters);
		//
		// // return successful message if set parameter succeeded
		// if(parametersSet)
		// {
		// this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.SET_PARAMETERS);
		// }
		// else
		// {
		// String message = "Model Service for " + modelPath + " doesn't support SetParameters feature";
		// // no parameter feature supported by this model service
		// this.messageClient(requestID, visitor, OUTBOUND_MESSAGE_TYPES.NO_FEATURE, message);
		// }
	}

	/**
	 * @param requestID
	 * @param type
	 * @param message
	 */
	public void sendMessage(String requestID, OutboundMessages type, String message)
	{
		websocketConnection.sendMessage(requestID, type, message);
	}
}
