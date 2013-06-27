package org.geppetto.frontend;

import java.io.IOException;
import java.nio.CharBuffer;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.simulation.ISimulationCallbackListener;

/**
 * Implementation of ISimulationCallbackListener interface. Receives updates from
 * the simulation, which are then sent to the running clients.  
 *
 */
public class SimulationListenerImpl implements ISimulationCallbackListener{

	private static Log logger = LogFactory.getLog(SimulationListenerImpl.class);

	private SimulationVisitorsHandler simConnectionHandler;
	
	public SimulationListenerImpl(SimulationVisitorsHandler simConnectionHandler){
		this.simConnectionHandler = simConnectionHandler;
	}
	
	@Override
	public void updateReady(String update) {
		long start=System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: "+dateFormatted);
		for (GeppettoVisitorWebSocket connection : simConnectionHandler.getConnections())
		{
			try
			{
				CharBuffer buffer = CharBuffer.wrap(update);
				connection.getWsOutbound().writeTextMessage(buffer);
			}
			catch (IOException ignore)
			{
				logger.error(ignore.getMessage());
			}
		}
		logger.info("Simulation Frontend Update Finished: Took:"+(System.currentTimeMillis()-start));
	}

}
