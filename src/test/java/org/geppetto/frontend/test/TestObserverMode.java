package org.geppetto.frontend.test;

import static org.junit.Assert.assertEquals;

import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.geppetto.frontend.GeppettoVisitorConfig.RunMode;
import org.geppetto.frontend.GeppettoVisitorWebSocket;
import org.geppetto.frontend.SimulationVisitorsHandler;
import org.junit.Test;

/**
 * Test Unit class to test Observer Mode functionality
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class TestObserverMode {

	
	//Define a test servlet 
	private TestSimulationServlet testSimulationServlet = new TestSimulationServlet();
	
	/*
	 * Create two connections to represent multiple visitors to geppetto
	 */
	private GeppettoVisitorWebSocket connection1 = new GeppettoVisitorWebSocket(0, SimulationVisitorsHandler.getInstance());
	private GeppettoVisitorWebSocket connection2 = new GeppettoVisitorWebSocket(1, SimulationVisitorsHandler.getInstance());
	
	@Test
	public void testSetRunModes(){
		
		assertEquals(connection1.getCurrentRunMode(), RunMode.DEFAULT);
		assertEquals(connection2.getCurrentRunMode(), RunMode.DEFAULT);
		
		connection1.setRunMode(RunMode.CONTROLLING);
		
		assertEquals(connection1.getCurrentRunMode(), RunMode.CONTROLLING);
		
		connection2.setRunMode(RunMode.OBSERVING);
		
		assertEquals(connection2.getCurrentRunMode(), RunMode.OBSERVING);
	}
	
	private class TestSimulationServlet extends WebSocketServlet{

		private final AtomicInteger _connectionIds = new AtomicInteger(0);
		
		@Override
		protected StreamInbound createWebSocketInbound(String subProtocol,
				HttpServletRequest request) {
			return new GeppettoVisitorWebSocket(_connectionIds.incrementAndGet(), SimulationVisitorsHandler.getInstance());
		}
		
	}
}