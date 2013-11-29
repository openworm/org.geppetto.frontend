package org.geppetto.frontend;

/*
 * Stores different messages that can be send to the client
 */
public enum Resources {
	ERROR_LOADING_SIMULATION_MESSAGE("Invalid simulation file. "+
			"Double check the information you have entered and try again."),
	ERROR_ADDING_WATCH_MESSAGE("Could not add watch variables. "+
					"Please make sure the variables you are trying to add exist and use fully qualified paths:\n [aspectid].[variable name]."),
	SIMULATION_CONTROLLED("Another user is in control of starting and stopping the simulation.\n "+
					"You are currently in observer mode."),
	GEPPETO_SIM_INFO("Another user is in control of starting and stopping the simulation.\n "+
					"You are currently in observer mode."),
	SERVER_UNAVAILABLE("The server is currently in use and this " +
						"instance of Geppetto does not support shared mode access" +
						" - you can join the ongoing simulation as an observer "),
	SERVER_AVAILABLE("The current operator left the control of Geppetto." +
						" Refresh your browser to attempt to assume control (first come, first served).");

	private Resources(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}
}