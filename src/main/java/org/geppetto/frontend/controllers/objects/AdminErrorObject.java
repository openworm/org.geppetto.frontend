package org.geppetto.frontend.controllers.objects;

public class AdminErrorObject {
	
	private String login;
	private String name;
	private String error;
	private String experiment;
	private String simulator;
	
	public String getLogin() {
		return login;
	}
	public void setLogin(String login) {
		this.login = login;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}
	public String getExperiment() {
		return experiment;
	}
	public void setExperiment(String experiment) {
		this.experiment = experiment;
	}
	public String getSimulator() {
		return simulator;
	}
	public void setSimulator(String simulator) {
		this.simulator = simulator;
	}
}
