package org.geppetto.frontend.controllers;

import java.io.IOException;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * @author matteocantarelli
 *
 */
public class ConnectionsManager
{

	private static Log _logger = LogFactory.getLog(ConnectionsManager.class);

	private static ConnectionsManager connectionsManager;

	private final AtomicInteger connectionsCounter = new AtomicInteger(0);

	private final ConcurrentHashMap<String, WebsocketConnection> _connections = new ConcurrentHashMap<String, WebsocketConnection>();

	/**
	 * @return
	 */
	public static ConnectionsManager getInstance()
	{
		if(connectionsManager == null)
		{
			connectionsManager = new ConnectionsManager();
		}
		return connectionsManager;
	}

	/**
	 * Add new connection to list of current ones
	 * 
	 * @param websocketConnection
	 *            - New connection to be added to current ones
	 */
	public String addConnection(WebsocketConnection websocketConnection)
	{
		String id = getNewConnectionId();

		_connections.put(id, websocketConnection);

		purgeLostConnections();

		_logger.info("New websocket connection " + websocketConnection.getConnectionID());

		return id;
	}

	/**
	 * 
	 */
	private void purgeLostConnections()
	{
		List<WebsocketConnection> toBeRemoved = new ArrayList<WebsocketConnection>();
		for(WebsocketConnection client : this.getConnections())
		{
			CharBuffer buffer = CharBuffer.wrap("ping");
			try
			{
				client.getWsOutbound().writeTextMessage(buffer);
			}
			catch(IOException e)
			{
				_logger.error("Unable to communicate with client " + e.getMessage() + ". Removing connection.");
				toBeRemoved.add(client);
			}
		}
		for(WebsocketConnection client : toBeRemoved)
		{
			this.removeConnection(client);
		}
	}

	/**
	 * Remove connection from list of current ones.
	 * 
	 * @param websocketConnection
	 *            - Connection to be removed
	 */
	public void removeConnection(WebsocketConnection websocketConnection)
	{
		if(_connections.contains(websocketConnection))
		{
			_connections.remove(websocketConnection.getConnectionID());
			_logger.info("Websocket connection removed " + websocketConnection.getConnectionID());
		}
	}

	/**
	 * Return all the current web socket connections
	 * 
	 * @return
	 */
	public Collection<WebsocketConnection> getConnections()
	{
		return Collections.unmodifiableCollection(_connections.values());
	}

	/**
	 * @return
	 */
	private String getNewConnectionId()
	{
		return "Connection" + connectionsCounter.incrementAndGet();
	}
}
