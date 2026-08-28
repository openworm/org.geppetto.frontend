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

	/*
	 * Retention bounds for GeppettoManagers stashed on abnormal close (VFB2 #458).
	 * Each retained manager pins its session's full Geppetto model (~8.4 MB
	 * observed), so the map must be bounded by count as well as by age: the LB
	 * cookie-sticky resume only works while the original container is alive, and
	 * a reconnect churn burst (~1 abnormal close/second observed) would otherwise
	 * pin hundreds of models inside the 5-minute window.
	 */
	private static final int MAX_RETAINED_MANAGERS = 32;
	private static final long RETENTION_SECONDS = 5 * 60;

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
		/*
		 * Registration happens on every abnormal close, so this is the one place
		 * guaranteed to run during a churn burst - purge expired records and
		 * enforce the count bound here rather than relying on a new connection
		 * arriving to trigger the purge.
		 */
		purgeRetainedManagers();
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

		_logger.debug("New websocket connection " + websocketConnection.getConnectionID());

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
		purgeRetainedManagers();
	}

	/**
	 * Drop retained managers that are past the retention window, then enforce the
	 * count bound by evicting the oldest records first. Nothing here caches query
	 * results - a retained manager holds the session's model so a cookie-stickied
	 * reconnect within the window can resume; query results are never retained
	 * beyond the request that produced them.
	 */
	private void purgeRetainedManagers()
	{
		long now = Calendar.getInstance().getTimeInMillis() / 1000;
		for(String key : managers.keySet()) {
			ManagerRecord value = managers.get(key);
			if (value != null && (now - value.getRegistration()) > RETENTION_SECONDS) {
				managers.remove(key);
			}
		}
		while(managers.size() > MAX_RETAINED_MANAGERS) {
			String oldestKey = null;
			long oldestRegistration = Long.MAX_VALUE;
			for(Map.Entry<String, ManagerRecord> entry : managers.entrySet()) {
				if (entry.getValue().getRegistration() < oldestRegistration) {
					oldestRegistration = entry.getValue().getRegistration();
					oldestKey = entry.getKey();
				}
			}
			if (oldestKey == null || managers.remove(oldestKey) == null) {
				break;
			}
			_logger.warn("Retained GeppettoManager evicted (count bound " + MAX_RETAINED_MANAGERS + " reached): " + oldestKey);
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
			_logger.debug("Websocket connection removed " + websocketConnection.getConnectionID());
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
