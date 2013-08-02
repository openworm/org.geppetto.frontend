/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011, 2013 OpenWorm.
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
package org.geppetto.frontend.test;

import static org.junit.Assert.assertEquals;

import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.geppetto.frontend.GeppettoVisitorWebSocket;
import org.geppetto.frontend.GeppettoVisitorWebSocket.VisitorRunMode;
import org.geppetto.frontend.SimulationServerConfig;
import org.geppetto.frontend.SimulationServerConfig.ServerBehaviorModes;
import org.geppetto.frontend.SimulationListener;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
/**
 * Test Unit class to test Observer Mode functionality
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 *
 */
@RunWith(SpringJUnit4ClassRunner.class)  
@ContextConfiguration("classpath:test-app-config.xml")  
public class TestObserverMode {

	
	@Autowired
	private SimulationServerConfig simulationServerConfig;
		
	/*
	 * Create two connections to represent multiple visitors to geppetto
	 */
	private GeppettoVisitorWebSocket connection1 = new GeppettoVisitorWebSocket(0, SimulationListener.getInstance());
	private GeppettoVisitorWebSocket connection2 = new GeppettoVisitorWebSocket(1, SimulationListener.getInstance());
	
	
	@Test
	public void testServerBehavior(){
				
		assertEquals(simulationServerConfig.getServerBehaviorMode(), SimulationServerConfig.ServerBehaviorModes.OBSERVE);
		
		connection1.setVisitorRunMode(VisitorRunMode.CONTROLLING);
		connection2.setVisitorRunMode(VisitorRunMode.OBSERVING);
		
		assertEquals(connection1.getCurrentRunMode(), VisitorRunMode.CONTROLLING);
		assertEquals(connection2.getCurrentRunMode(), VisitorRunMode.OBSERVING);
		
		simulationServerConfig.setServerBehaviorMode(ServerBehaviorModes.CONTROLLED);
		
		assertEquals(simulationServerConfig.getServerBehaviorMode(), SimulationServerConfig.ServerBehaviorModes.CONTROLLED);
	}
	
	private class TestSimulationServlet extends WebSocketServlet{

		private final AtomicInteger _connectionIds = new AtomicInteger(0);
		
		@Override
		protected StreamInbound createWebSocketInbound(String subProtocol,
				HttpServletRequest request) {
			return new GeppettoVisitorWebSocket(_connectionIds.incrementAndGet(), SimulationListener.getInstance());
		}
		
	}
}