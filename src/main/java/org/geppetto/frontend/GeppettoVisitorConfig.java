package org.geppetto.frontend;

/**
 * Configuration class to keep track of simulation run mode
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 *
 */
public class GeppettoVisitorConfig {

	public enum RunMode {
		DEFAULT, CONTROLLING, OBSERVING
	}
	
	private RunMode currentRunMode;
	
	public RunMode getCurrentRunMode(){
		return currentRunMode;
	}
	
	public void setCurrentRunMode(RunMode currentRunMode){
		this.currentRunMode = currentRunMode;
	}
}
