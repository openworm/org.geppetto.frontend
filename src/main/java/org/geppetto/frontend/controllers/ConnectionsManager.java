package org.geppetto.frontend.controllers;

import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Date;
import java.util.Calendar;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.core.common.GeppettoExecutionException;
import org.geppetto.simulation.manager.GeppettoManager;

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

	private final ConcurrentHashMap<String, ManagerRecord> managers = new ConcurrentHashMap<String, ManagerRecord>();

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
	 * @param String requestID
	 * @param ConnectionHandler instance
	 */
	public void registerHandler(String connectionID, ConnectionHandler instance) throws GeppettoExecutionException 
	{
		if (!managers.containsKey(connectionID)) {
			ManagerRecord newRecord = new ManagerRecord((GeppettoManager) instance.getGeppettoManager());
			managers.put(connectionID, newRecord);
		} else {
			ManagerRecord newRecord = new ManagerRecord((GeppettoManager) instance.getGeppettoManager());
			managers.put(connectionID, newRecord);
			throw new GeppettoExecutionException("The GeppettoManager registered for the session " + connectionID + " has been replaced");
		}
	}
	
	/**
	 * @param String connectionID
	 * @return
	 */
	public GeppettoManager getHandler(String connectionID) throws GeppettoExecutionException 
	{
		if (managers.containsKey(connectionID)) {
			GeppettoManager _manager = managers.get(connectionID).getManagerRecord();
			managers.remove(connectionID);
			return _manager;
		} else {
			throw new GeppettoExecutionException("The Geppetto Manager requested has not been registered.");
		}
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
		// Check all the connections registered, ping who is alive and purge the others
		for(WebsocketConnection client : this.getConnections())
		{
			if (client.getSession().isOpen()) {
				CharBuffer buffer = CharBuffer.wrap("ping");
				client.getSession().getAsyncRemote().sendObject(buffer);
			} else {
				this.removeConnection(client);
			}
			
		}
		
		// To avoid memory consumption we check also the map of geppetto managers stored
		// the instances that are more than 5 minutes older gets removed
		Long now = Calendar.getInstance().getTimeInMillis() / 1000;
		for(String key : managers.keySet()) {
			ManagerRecord value = managers.get(key);
			if ((now - value.getRegistration()) > (5 * 60)) {
				managers.remove(key);
			}
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
			if(websocketConnection.getConnectionID() != null)
			{
				_connections.remove(websocketConnection.getConnectionID());
			}
			else
			{
				//TODO Sometimes for some reason the websocketConnection has null as ID, need to investigate more
				String toRemove = null;
				for(String key : _connections.keySet())
				{
					if(_connections.get(key).equals(websocketConnection))
					{
						toRemove = key;
						break;
					}
				}
				if(toRemove != null)
				{
					_connections.remove(toRemove);
				}
			}
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
	
	private class ManagerRecord {
		private GeppettoManager manager;
		private Long registrationDate;
		
		public ManagerRecord(GeppettoManager manager) {
			this.manager = manager;
			this.registrationDate = Calendar.getInstance().getTimeInMillis() / 1000;
		} 
		
		public Long getRegistration() {
			return registrationDate;
		}
		
		public GeppettoManager getManagerRecord() {
			return manager;
		}
	}
}
