test( "Simulation Test", function() {

	equal(Simulation.getStatus(), Simulation.StatusEnum.INIT, "Simulation in initial conditions, passed.");
	Simulation.load();
	equal( Simulation.getStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
});