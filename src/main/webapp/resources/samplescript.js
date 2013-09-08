Simulation.load("https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/GEPPETTO.xml");

G.wait(5000);

Simulation.start();

G.wait(3000);

Simulation.pause();

G.wait(1000);

Simulation.stop();

G.wait(2000);

Simulation.start();
