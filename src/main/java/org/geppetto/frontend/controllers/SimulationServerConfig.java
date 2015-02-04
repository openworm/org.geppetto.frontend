/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 - 2015 OpenWorm.
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
