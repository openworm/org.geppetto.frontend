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
package org.geppetto.frontend;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;

/**
 * Class used to process Web Socket Connections. 
 * Messages sent from the connecting clients, web socket connections,
 * are received in here.
 *
 */
public class GeppettoVisitorWebSocket extends MessageInbound
{

	/*
	 * Keeps track of mode visitor is in, either observing or controlling 
	 * the simulation
	 */
	public enum VisitorRunMode {
		OBSERVING, CONTROLLING
	}

	private SimulationListener simulationListener;
	private final int id;

	private VisitorRunMode currentMode = VisitorRunMode.OBSERVING;

	public GeppettoVisitorWebSocket(int id, SimulationListener simulatoinVisitorsHandler)
	{
		super();
		this.id = id;
		simulationListener = simulatoinVisitorsHandler;
	}

	@Override
	protected void onOpen(WsOutbound outbound)
	{
		simulationListener.addConnection(this);	
	}

	@Override
	protected void onClose(int status)
	{
		simulationListener.removeConnection(this);
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException
	{
		throw new UnsupportedOperationException("Binary message not supported.");
	}

	/**
	 * Receives message(s) from client. 
	 */
	@Override
	protected void onTextMessage(CharBuffer message)
	{
		String msg = message.toString();
		if (msg.startsWith("init$"))
		{
			String url = msg.substring(msg.indexOf("$")+1, msg.length());
			simulationListener.initializeSimulation(url,this);
		}
		else if (msg.equals("start"))
		{
			simulationListener.startSimulation(this);
		}
		else if (msg.equals("pause"))
		{
			simulationListener.pauseSimulation();
		}
		else if (msg.equals("stop"))
		{
			simulationListener.stopSimulation();
		}
		else if (msg.equals("observe"))
		{					
			simulationListener.observeSimulation(this);
		}
		else
		{
			// NOTE: no other messages expected for now
		}
	}

	public int getConnectionID() {
		return id;
	}

	public VisitorRunMode getCurrentRunMode(){
		return currentMode ;
	}

	public void setVisitorRunMode(VisitorRunMode mode){
		currentMode = mode;
	}

}
