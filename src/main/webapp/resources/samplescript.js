Simulation.load("https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/GEPPETTO.xml");

G.wait(100);

Simulation.start();

G.wait(3000);

Simulation.pause();

G.wait(1000);

Simulation.stop();

G.wait(2000);

Simulation.load("https://raw.github.com/openworm/org.geppetto.samples/master/NeuroML/Purkinje/GEPPETTO.xml");

G.wait(2000);

Simulation.load("https://raw.github.com/openworm/org.geppetto.samples/master/SPH/ElasticSmall/GEPPETTO.xml");

Simulation.start();
