module( "Commands Test", {
    setup: function() {
        //ok( true, "one extra assert per test" );
    }, teardown: function() {
        //ok( true, "and one extra assert after each test" );
    }
});

test( "Global Object Test", function() {
	
	equal(G.getCurrentSimulation(), "No Simulation to get as none is running", "No simulation, passed.");
	    
	equal(G.clear(), "Console history cleared", "Console cleared");
});

test( "Simulation Test", function() {
	equal(getSimulationStatus(), Simulation.StatusEnum.INIT, "Simulation in initial conditions, passed.");
	Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
	equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
	Simulation.start();
	equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
	Simulation.pause();
	equal( getSimulationStatus(),Simulation.StatusEnum.PAUSED, "Simulation Paused, passed");
	Simulation.stop();
	equal( getSimulationStatus(),Simulation.StatusEnum.STOPPED, "Simulation Stopped, passed");	
});