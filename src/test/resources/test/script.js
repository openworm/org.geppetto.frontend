G.addWidget(6);
Connectivity1.setName("Connectivity matrix");
Connectivity1.setData(acnet2,{linkType:function(c){return c.getSubNodesOfDomainType('Synapse')[0].id}});
G.addWidget(1);
Popup1.setMessage(Project.getActiveExperiment().getDescription());
Popup1.setName("Description");
Connectivity1.setPosition(780,182)
G.incrementCameraPan(-0.1, 0)
Connectivity1.setPosition(645,210)
Popup1.setPosition(641,78)
Popup1.setSize(110.80000019073486,665.8000001907349)
acnet2.baskets_12_0.electrical.select()

acnet2.baskets_12_0.electrical.getSimulationTree();
G.addWidget(0);
Plot1.setName("Primary Auditory Cortext Network - Basket Cell - Voltage");
options = {yaxis:{min:-.1,max:0.1},xaxis:{min:0,max:400,show:false}};
Plot1.setOptions(options);
Plot1.setPosition(113, 90);
Plot1.setSize(230,445);
Plot1.plotData(acnet2.baskets_12_0.electrical.SimulationTree.bask[0].v);

Project.getActiveExperiment().play({playAll:true});