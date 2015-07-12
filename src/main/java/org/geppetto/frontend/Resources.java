package org.geppetto.frontend;

/*
 * Stores different messages that can be send to the client
 */
public enum Resources {
	ERROR_LOADING_PROJECT_MESSAGE("Invalid project file. "+
			"Double check the information you have entered and try again."),

	ERROR_DOWNLOADING_MODEL("Format not supported"),
	
	UNSUPPORTED_OPERATION("This deployment of Geppetto doesn't support this operation. Contact info@geppetto.org for more information."), 
	VOLATILE_PROJECT("The operation cannot be executed on a volatile project. If you wish to persist the project press the star icon at the top.");
	
	private Resources(final String text) {
		this.text = text;
	}

	private final String text;

	@Override
	public String toString() {
		return text;
	}
}