package org.geppetto.frontend.controllers.objects;

public class AdminSimulationObject {
	
	private String login;
	private String name;
	private String experimentLastRun;
	private String experiment;
	private String simulator;
	private String storage;
	private String experimentsAndSimulators;
	
	public String getExperimentsAndSimulators() {
		return experimentsAndSimulators;
	}
	public void setExperimentsAndSimulators(String experimentsAndSimulators) {
		this.experimentsAndSimulators = experimentsAndSimulators;
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
	public String getStorage() {
		return storage;
	}
	public void setStorage(String storage) {
		this.storage = storage;
	}
}
