package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.websocket.CloseReason;
import javax.websocket.ContainerProvider;
import javax.websocket.Endpoint;
import javax.websocket.EndpointConfig;
import javax.websocket.MessageHandler;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;
import javax.websocket.server.ServerEndpoint;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.eclipse.emf.common.util.BasicEList;
import org.eclipse.emf.common.util.EList;
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
import org.geppetto.model.datasources.DatasourcesFactory;
import org.geppetto.model.datasources.RunnableQuery;
import org.geppetto.simulation.GeppettoManagerConfiguration;
import org.geppetto.simulation.manager.ExperimentRunManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * Class used to process Web Socket Connections. Messages sent from the connecting clients, web socket connections, are received in here.
 * 
 * @author matteocantarelli
 *
 */
@ServerEndpoint(value = "/GeppettoServlet", configurator = SpringWebsocketConfiguration.class)
public class WebsocketConnection extends Endpoint implements MessageSenderListener
{

	private static Log logger = LogFactory.getLog(WebsocketConnection.class);

	private ConnectionHandler connectionHandler;

	private String connectionID;

	@Autowired
	private DefaultMessageSenderFactory messageSenderFactory;

	private MessageSender messageSender;

	@Autowired
	private IGeppettoManager geppettoManager;

	@Autowired
	private GeppettoManagerConfiguration geppettoManagerConfiguration;

	private Session userSession;
	
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
		this.connectionHandler = new ConnectionHandler(this, geppettoManager,geppettoManagerConfiguration);
	}


	@OnOpen
	public void onOpen(Session session, EndpointConfig config) {
	    this.userSession = session;

	    //Expanding binary message buffer size
		WebSocketContainer wsContainer =
				ContainerProvider.getWebSocketContainer();
		wsContainer.setDefaultMaxBinaryMessageBufferSize(9999999);
		wsContainer.setDefaultMaxTextMessageBufferSize(9999999);
		userSession.setMaxTextMessageBufferSize(9999999);
		userSession.setMaxBinaryMessageBufferSize(9999999);
		logger.info("Session Binary size >> " + userSession.getMaxBinaryMessageBufferSize());
		logger.info("Session Text size >> " + userSession.getMaxTextMessageBufferSize());

		messageSender = messageSenderFactory.getMessageSender(userSession, this);
		// User permissions are sent when socket is open
		this.connectionHandler.checkUserPrivileges(null);
		connectionID = ConnectionsManager.getInstance().addConnection(this);
		sendMessage(null, OutboundMessages.CLIENT_ID, connectionID);

		logger.info("Open Connection ..."+userSession.getId());
		
		session.addMessageHandler(new WebsocketMessageHandler(session,this));
	}

	@OnClose
	public void onClose(Session session, CloseReason closeReason) {
		super.onClose(session, closeReason);
		messageSender.shutdown();
		connectionHandler.closeProject();
		logger.info("Closed Connection ..."+userSession.getId());
	}
	
	@OnError
	public void onError(Session session, Throwable thr) {
		logger.info("Error Connection ..."+userSession.getId()+ " error: " + thr.getMessage());
	}
	
	@OnMessage
	public void broadcastSnapshot(ByteBuffer data, Session session) throws IOException {
	    logger.info("broadcastBinary: " + data);
        session.getBasicRemote().sendBinary(data);

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
	
	class WebsocketMessageHandler implements MessageHandler.Whole<String> {

		final Session session;
		final WebsocketConnection websocketConnection;
		
		public WebsocketMessageHandler(Session session, WebsocketConnection websocketConnection) {
			this.session = session;
			this.websocketConnection = websocketConnection;
		}
		
		@Override
		public void onMessage(String message) {
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
				case USER_PRIVILEGES:
				{
					connectionHandler.checkUserPrivileges(requestID);
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
				case NEW_EXPERIMENT_BATCH:
				{
					BatchExperiment receivedObject = new Gson().fromJson(gmsg.data, BatchExperiment.class);
					connectionHandler.newExperimentBatch(requestID, receivedObject.projectId, receivedObject);
					break;
				}
				case CLONE_EXPERIMENT:
				{
					parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
					{
					}.getType());
					projectId = Long.parseLong(parameters.get("projectId"));
					experimentId = Long.parseLong(parameters.get("experimentId"));
					connectionHandler.cloneExperiment(requestID, projectId, experimentId);
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
				case MAKE_PROJECT_PUBLIC:
				{
					parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
					{
					}.getType());
					projectId = Long.parseLong(parameters.get("projectId"));
					boolean isPublic = Boolean.parseBoolean(parameters.get("isPublic"));
					connectionHandler.makeProjectPublic(requestID, projectId, isPublic);
					break;
				}
				case DOWNLOAD_PROJECT:
				{
					parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
					{
					}.getType());
					projectId = Long.parseLong(parameters.get("projectId"));
					connectionHandler.downloadProject(requestID, projectId);
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
					GetScript receivedObject = new Gson().fromJson(gmsg.data, GetScript.class);
					connectionHandler.sendScriptData(requestID, receivedObject.projectId, receivedObject.scriptURL, this.websocketConnection);
					break;
				}
				case GET_DATA_SOURCE_RESULTS:
				{
					URL url = null;
					String dataSourceName;
					try
					{
						parameters = new Gson().fromJson(gmsg.data, new TypeToken<HashMap<String, String>>()
						{
						}.getType());
						url = URLReader.getURL(parameters.get("url"));
						dataSourceName = parameters.get("data_source_name");

						connectionHandler.sendDataSourceResults(requestID, dataSourceName, url, this.websocketConnection);

					}
					catch(IOException e)
					{
						sendMessage(requestID, OutboundMessages.ERROR_READING_SCRIPT, "");
					}
					break;
				}
				case GET_EXPERIMENT_STATE:
				{
					ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
					connectionHandler.getExperimentState(requestID, receivedObject.experimentId, receivedObject.projectId, receivedObject.variables);
					break;
				}
				case DELETE_EXPERIMENT:
				{
					ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
					connectionHandler.deleteExperiment(requestID, receivedObject.experimentId, receivedObject.projectId);
					break;
				}
				case RUN_EXPERIMENT:
				{
					ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
					connectionHandler.runExperiment(requestID, receivedObject.experimentId, receivedObject.projectId);
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
				case SET_EXPERIMENT_VIEW:
				{
					ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
					connectionHandler.setExperimentView(requestID, receivedObject.view, receivedObject.projectId, receivedObject.experimentId);
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
	                        case GET_DROPBOX_TOKEN:
	                        {
	                            //ReceivedObject receivedObject = new Gson().fromJson(gmsg.data, ReceivedObject.class);
	                                connectionHandler.getDropboxToken(requestID);
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
					connectionHandler.fetchVariable(requestID, receivedObject.projectId, receivedObject.dataSourceId, receivedObject.variableId);
					break;
				}
				case RESOLVE_IMPORT_TYPE:
				{
					GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
					connectionHandler.resolveImportType(requestID, receivedObject.projectId, receivedObject.paths);
					break;
				}
				case RESOLVE_IMPORT_VALUE:
				{
					GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
					connectionHandler.resolveImportValue(requestID, receivedObject.projectId, receivedObject.experimentId, receivedObject.path);
					break;
				}
				case RUN_QUERY:
				{
					GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
					connectionHandler.runQuery(requestID, receivedObject.projectId, convertRunnableQueriesDataTransferModel(receivedObject.runnableQueries));
					break;
				}
				case RUN_QUERY_COUNT:
				{
					GeppettoModelAPIParameters receivedObject = new Gson().fromJson(gmsg.data, GeppettoModelAPIParameters.class);
					connectionHandler.runQueryCount(requestID, receivedObject.projectId, convertRunnableQueriesDataTransferModel(receivedObject.runnableQueries));
					break;
				}
				default:
				{
					// NOTE: no other messages expected for now
				}
			}
		}
	}

	/**
	 * @param runnableQueries
	 * @return A list based on the EMF class. It's not possible to use directly the EMF class as Gson requires fields with public access modifiers which breaks EMF encapsulation
	 */
	private List<RunnableQuery> convertRunnableQueriesDataTransferModel(List<RunnableQueryDT> runnableQueries)
	{
		EList<RunnableQuery> runnableQueriesEMF = new BasicEList<RunnableQuery>();

		for(RunnableQueryDT dt : runnableQueries)
		{
			RunnableQuery rqEMF = DatasourcesFactory.eINSTANCE.createRunnableQuery();
			rqEMF.setQueryPath(dt.queryPath);
			rqEMF.setTargetVariablePath(dt.targetVariablePath);
			runnableQueriesEMF.add(rqEMF);
		}
		return runnableQueriesEMF;
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
		String view;
	}

	class GetScript
	{
		Long projectId;
		String scriptURL;
	}

	class BatchExperiment
	{
		Long projectId;
		List<NewExperiment> experiments;
	}

	class NewExperiment
	{
		String name;
		List<String> watchedVariables;
		Map<String, String> modelParameters;
		Map<String, String> simulatorParameters;
		Float duration;
		Float timeStep;
		String simulator;
		String aspectPath;
	}

	class GeppettoModelAPIParameters
	{
		Long projectId;
		Long experimentId;
		String dataSourceId;
		List<String> paths;
		String path;
		String[] variableId;
		List<RunnableQueryDT> runnableQueries;
	}

	class RunnableQueryDT
	{
		String targetVariablePath;
		String queryPath;
	}

	public Session getSession() {
		return this.userSession;
	}
}
