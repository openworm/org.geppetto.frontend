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
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.core.common.GeppettoInitializationException;
import org.geppetto.core.simulation.ISimulation;
import org.geppetto.core.simulation.ISimulationCallbackListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;

@Configurable
public class SimulationServlet extends WebSocketServlet implements ISimulationCallbackListener
{

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private static Log logger = LogFactory.getLog(SimulationServlet.class);

	@Autowired
	private ISimulation simulationService;

	private final AtomicInteger _connectionIds = new AtomicInteger(0);

	private final ConcurrentHashMap<Integer, SimDataInbound> _connections = new ConcurrentHashMap<Integer, SimDataInbound>();

	@Override
	protected StreamInbound createWebSocketInbound(String subProtocol, HttpServletRequest request)
	{
		return new SimDataInbound(_connectionIds.incrementAndGet());
	}

	@Override
	public void init() throws ServletException
	{
		super.init();
		SpringBeanAutowiringSupport.processInjectionBasedOnCurrentContext(this);
	}

	private Collection<SimDataInbound> getConnections()
	{
		return Collections.unmodifiableCollection(_connections.values());
	}

	private final class SimDataInbound extends MessageInbound
	{

		private final int id;

		private SimDataInbound(int id)
		{
			super();
			this.id = id;
		}

		@Override
		protected void onOpen(WsOutbound outbound)
		{
			_connections.put(Integer.valueOf(id), this);
		}

		@Override
		protected void onClose(int status)
		{
			_connections.remove(Integer.valueOf(id));
		}

		@Override
		protected void onBinaryMessage(ByteBuffer message) throws IOException
		{
			throw new UnsupportedOperationException("Binary message not supported.");
		}

		@Override
		protected void onTextMessage(CharBuffer message)
		{
			try
			{
				String msg = message.toString();
				if (msg.startsWith("init$"))
				{
					// NOTE: we need to init only when the first connection is established
					if(_connections.size() == 1)
					{
						String url = msg.substring(msg.indexOf("$")+1, msg.length());
						try
						{
							simulationService.init(new URL(url), SimulationServlet.this);
						}
						catch(GeppettoInitializationException e)
						{
							throw new RuntimeException(e);
						}
					}
				}
				else if (msg.equals("start"))
				{
					try
					{
						simulationService.start();
					}
					catch(GeppettoExecutionException e)
					{
						throw new RuntimeException(e);
					}
				}
				else if (msg.equals("pause"))
				{
					try
					{
						simulationService.pause();
					}
					catch(GeppettoExecutionException e)
					{
						throw new RuntimeException(e);
					}
				}
				else if (msg.equals("stop"))
				{
					try
					{
						simulationService.stop();
					}
					catch(GeppettoExecutionException e)
					{
						throw new RuntimeException(e);
					}
				}
				else
				{
					// NOTE: no other messages expected for now
				}
			}
			catch (MalformedURLException e)
			{
				logger.error(e.getMessage());
			}
		}
	}

	@Override
	public void updateReady(String update)
	{
		long start=System.currentTimeMillis();
		Date date = new Date(start);
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");
		String dateFormatted = formatter.format(date);
		logger.info("Simulation Frontend Update Starting: "+dateFormatted);
		for (SimDataInbound connection : getConnections())
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
