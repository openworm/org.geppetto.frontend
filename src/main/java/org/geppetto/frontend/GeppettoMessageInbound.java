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
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.Gson;

/**
 * Class used to process Web Socket Connections. 
 * Messages sent from the connecting clients, web socket connections,
 * are received in here.
 *
 */
public class GeppettoMessageInbound extends MessageInbound
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

	public GeppettoMessageInbound(int id, SimulationListener listener)
	{
		super();
		this.id = id;
		simulationListener = listener;
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
	 * @throws JsonProcessingException 
	 */
	@Override
	protected void onTextMessage(CharBuffer message) throws JsonProcessingException
	{
		String msg = message.toString();
		
		// de-serialize JSON
		GeppettoTransportMessage gmsg = new Gson().fromJson(msg, GeppettoTransportMessage.class);
		
		// switch on message type
		// NOTE: each message handler knows how to interpret the GeppettoMessage data field
		switch(INBOUND_MESSAGE_TYPES.valueOf(gmsg.type.toUpperCase()))
		{
			case GEPPETTO_VERSION:
			{				
				simulationListener.getVersionNumber(this);
				break;
			}
			case INIT_URL:
			{
				String urlString = gmsg.data;
				URL url;
				try {
					url = new URL(urlString);
					simulationListener.initializeSimulation(url,this);
				} catch (MalformedURLException e) {
					simulationListener.messageClient(this,OUTBOUND_MESSAGE_TYPES.ERROR_LOADING_SIMULATION);
				}
				break;
			}
			case INIT_SIM:
			{
				String simulation = gmsg.data;
				simulationListener.initializeSimulation(simulation, this);
				break;
			}
			case RUN_SCRIPT:
			{
				String urlString = gmsg.data;
				URL url = null; 
				try{
					url = new URL(urlString);
				}
				catch(MalformedURLException e){
					simulationListener.messageClient(this,OUTBOUND_MESSAGE_TYPES.ERROR_READING_SCRIPT);
				}
				
				simulationListener.getScriptData(url,this);
				break;
			}
			case SIM:
			{
				String url = gmsg.data;
				simulationListener.getSimulationConfiguration(url, this);
				break;
			}
			case START:
			{
				simulationListener.startSimulation(this);
				break;
			}
			case PAUSE:
			{
				simulationListener.pauseSimulation();
				break;
			}
			case STOP:
			{
				simulationListener.stopSimulation();
				break;
			}
			case OBSERVE:
			{
				simulationListener.observeSimulation(this);
				break;
			}
			case LIST_WATCH_VARS:
			{
				simulationListener.listWatchableVariables(this);
				break;
			}
			case LIST_FORCE_VARS:
			{
				simulationListener.listForceableVariables(this);
				break;
			}
			case SET_WATCH:
			{
				// TODO: pass watch list parameter
				simulationListener.addWatchLists();
				break;
			}
			case START_WATCH:
			{
				simulationListener.startWatch();
				break;
			}
			case STOP_WATCH:
			{
				simulationListener.stopWatch();
				break;
			}
			case CLEAR_WATCH:
			{
				simulationListener.clearWatchLists();
				break;
			}
			default:
			{
				// NOTE: no other messages expected for now
			}
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
