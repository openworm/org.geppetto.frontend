package org.geppetto.frontend.admin;

public class AdminSimulationObject {
	
	private String login;
	private String name;
	private String experimentLastRun;
	private String experiment;
	private String simulator;
	private String status;
	private String project;
	private String error;
	
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}

	public String getProject() {
		return project;
	}
	public void setProject(String project) {
		this.project = project;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
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
	public String getExperimentLastRun() {
		return experimentLastRun;
	}
	public void setExperimentLastRun(String experimentLastRun) {
		this.experimentLastRun = experimentLastRun;
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
