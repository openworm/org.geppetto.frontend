package org.geppetto.frontend;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.frontend.GeppettoVisitorConfig.RunMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

import com.google.gson.JsonObject;

/**
 * Class used to process Web Socket Connections. 
 * Messages sent from the connecting clients, web socket connections,
 * are received in here.
 *
 */
public class GeppettoVisitorWebSocket extends MessageInbound
{

	private static Log logger = LogFactory.getLog(GeppettoVisitorWebSocket.class);
	
	@Autowired
	private GeppettoVisitorConfig geppettoVisitorConfig;
	 
	private SimulationVisitorsHandler simulationVisitorsHandler;
	private final int id;

	private RunMode currentMode = RunMode.DEFAULT;
	
	public GeppettoVisitorWebSocket(int id, SimulationVisitorsHandler simulatoinVisitorsHandler)
	{
		super();
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
		this.id = id;
		simulationVisitorsHandler = simulatoinVisitorsHandler;
	}

	@Override
	protected void onOpen(WsOutbound outbound)
	{
		simulationVisitorsHandler.addConnection(this);	
	}

	@Override
	protected void onClose(int status)
	{
		simulationVisitorsHandler.removeConnection(this);
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException
	{
		throw new UnsupportedOperationException("Binary message not supported.");
	}

	@Override
	protected void onTextMessage(CharBuffer message)
	{
		String msg = message.toString();
		if (msg.startsWith("init$"))
		{
			//Couple of scenarios could initialize the simulation
			//Keep flag to initialize simulation later
			boolean canInitializeSim = false;
			
			switch(currentMode){
							
				case CONTROLLING:
					//User in control loading another model, clean canvas before doing so
					canInitializeSim = true;
					updateControllerScene();
					break;
				
				case OBSERVING:
					//Notify simulation controls are not available
					simulationVisitorsHandler.simulationControlsUnavailable(this);
					break;
					
				case DEFAULT:
					//Default user can only initialize it if it's not already in use
					if(!simulationVisitorsHandler.isSimulationInUse()){
						canInitializeSim = true;
					}
					break;
			}
			
			//Only visitors in default or controlling mode can initialize the simulation 
			if(canInitializeSim){
				String url = msg.substring(msg.indexOf("$")+1, msg.length());
				simulationVisitorsHandler.initializeSimulation(url,this);
				setRunMode(GeppettoVisitorConfig.RunMode.CONTROLLING);
				
				//notify any observers that simulation has been re started
				simulationVisitorsHandler.updateObserversScenes();
			}
		}
		else if (msg.equals("start"))
		{
			simulationVisitorsHandler.startSimulation();
		}
		else if (msg.equals("pause"))
		{
			simulationVisitorsHandler.pauseSimulation();
		}
		else if (msg.equals("stop"))
		{
			simulationVisitorsHandler.stopSimulation();
		}
		else if (msg.equals("observe"))
		{					
			simulationVisitorsHandler.observeSimulation(this);
			setRunMode(GeppettoVisitorConfig.RunMode.OBSERVING);
		}
		else
		{
			// NOTE: no other messages expected for now
		}
	}

	public int getConnectionID() {
		return id;
	}
	
	public GeppettoVisitorConfig.RunMode getCurrentRunMode(){
		return currentMode ;
	}
	
	public void setRunMode(GeppettoVisitorConfig.RunMode mode){
		currentMode = mode;
	}
	
	/**
	 * Clear the canvas of scene. Used when loading another model
	 */
	public void updateControllerScene(){
		//JSON object used to send message to observer(s)' clients
		JsonObject json = new JsonObject();
		json.addProperty("type", "clean_canvas");

		//Notify all observers
		simulationVisitorsHandler.messageClient(this,json.toString());
	}
}
