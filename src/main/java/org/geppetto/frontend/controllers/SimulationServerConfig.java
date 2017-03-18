package org.geppetto.frontend.controllers;

/**
 * Configuration class to keep track of simulation server mode
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class SimulationServerConfig {
	
	/*
	 * Different states the simulation server can be in
	 */
	public enum ServerBehaviorModes {
		OBSERVE, MULTIUSER
	}
	
	private ServerBehaviorModes serverBehaviorMode;
	
	private String loadedScene;
	
	private boolean isSimulationLoaded;
	
	public boolean isSimulationLoaded() {
		return isSimulationLoaded;
	}

	/**
	 * Keeps track if simulation server has model loaded
	 * 
	 * @param isSimulationLoaded
	 */
	public void setIsSimulationLoaded(boolean isSimulationLoaded) {
		this.isSimulationLoaded = isSimulationLoaded;
	}

	public String getLoadedScene() {
		return loadedScene;
	}

	/**
	 * Stores the current simulation loaded as JSON string. 
	 * 
	 * @param loadedScene
	 */
	public void setLoadedScene(String loadedScene) {
		this.loadedScene = loadedScene;
	}

	/**
	 * Keeps track of current behavior of simulation server
	 * 
	 * @param serverBehaviorMode
	 */
	public void setServerBehaviorMode(ServerBehaviorModes serverBehaviorMode){
		this.serverBehaviorMode = serverBehaviorMode;
	}
	
	public ServerBehaviorModes getServerBehaviorMode(){
		return this.serverBehaviorMode;
	}
}
