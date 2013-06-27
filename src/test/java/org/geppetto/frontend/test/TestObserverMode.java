package org.geppetto.frontend.test;

import static org.junit.Assert.assertEquals;

import org.geppetto.core.simulator.ISimulator;
import org.geppetto.frontend.GeppettoVisitorConfig.RunMode;
import org.geppetto.frontend.GeppettoVisitorWebSocket;
import org.geppetto.frontend.SimulationVisitorsHandler;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Test Unit class to test Observer Mode functionality
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class TestObserverMode {

	@Autowired
	private ISimulator service;
	
	/*
	 * Create two connections to represent multiple visitors to geppetto
	 */
	GeppettoVisitorWebSocket connection1 = new GeppettoVisitorWebSocket(0, SimulationVisitorsHandler.getInstance());
	GeppettoVisitorWebSocket connection2 = new GeppettoVisitorWebSocket(1, SimulationVisitorsHandler.getInstance());

	@Test
	public void testSetRunModes(){
		assertEquals(connection1.getCurrentRunMode(), RunMode.DEFAULT);
		assertEquals(connection2.getCurrentRunMode(), RunMode.DEFAULT);
		
		connection1.setRunMode(RunMode.CONTROLLING);
		
		assertEquals(connection1.getCurrentRunMode(), RunMode.CONTROLLING);
		
		connection2.setRunMode(RunMode.OBSERVING);
		
		assertEquals(connection2.getCurrentRunMode(), RunMode.OBSERVING);
	}
}
