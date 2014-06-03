Simulation.addWatchLists([{name:"hhvars",variablePaths:["hhcell.electrical.hr_chaotic_pop[0].x", "hhcell.electrical.hr_chaotic_pop[0].y", "hhcell.electrical.hr_chaotic_pop[0].z"]}]);
Simulation.startWatch();
Simulation.start();


//Adding Plot 1

G.addWidget(2);

Scatter3d1.setName("Hodgkin-Huxley Spiking Neuron");

//options = {yaxis:{min:-.1,max:0.1},xaxis:{min:0,max:400,show:false}};

//Plot1.setOptions(options);
Scatter3d1.setPosition(113, 90);
Scatter3d1.setSize(230,445); 
//Scatter3d1.plotData(["hhcell.electrical.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q", "hhcell.electrical.hhpop[0].bioPhys1.membraneProperties.naChans.na.m.q","hhcell.electrical.hhpop[0].bioPhys1.membraneProperties.kChans.k.n.q"]);
Scatter3d1.plotData(["hhcell.electrical.hr_chaotic_pop[0].x", "hhcell.electrical.hr_chaotic_pop[0].y", "hhcell.electrical.hr_chaotic_pop[0].z"]);


