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
	
	public enum VisitorRunMode {
		DEFAULT, OBSERVING, CONTROLLING
	}
	 
	private SimulationVisitorsHandler simulationVisitorsHandler;
	private final int id;

	private VisitorRunMode currentMode = VisitorRunMode.DEFAULT;
	
	public GeppettoVisitorWebSocket(int id, SimulationVisitorsHandler simulatoinVisitorsHandler)
	{
		super();
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
			String url = msg.substring(msg.indexOf("$")+1, msg.length());
			simulationVisitorsHandler.initializeSimulation(url,this);
		}
		else if (msg.equals("start"))
		{
			simulationVisitorsHandler.startSimulation(this);
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
