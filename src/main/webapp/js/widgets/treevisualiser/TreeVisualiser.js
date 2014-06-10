/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
/**
 * Tree Visualiser Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
		
		datasets: [],
		
		defaultTreeVisualiserOptions:  {
			mode: "d3", // Options: d3, dat
			width: 400,
			autoPlace: false
		},
		
		initialize : function(options){
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.render();
			this.setSize(500,500);

			this.options = this.defaultTreeVisualiserOptions;
			
			if (this.options.mode == 'dat'){
				this.gui = new dat.GUI({
					width : this.options.width,
					autoPlace: this.options.autoPlace
				});
				
	//			Testing Data
	//			this.generateTestTreeForDAT();
	
	//			Testing With Real Data
	//			this.generateRealDataTestTreeForDAT();
				
	//			Testing With Variable
	//			this.setData("hhcell");
				
				this.dialog.append(this.gui.domElement);
			}
			else if (this.options.mode == 'd3'){
	//			Testing Data
//				this.generateTestTreeForD3();
				
	//			Testing With Real Data
	//			this.generateRealDataTestTreeForD3();
				
	//			Testing With Variable
				this.setData("hhcell");
			}
			
		},
		
		setData : function(state, options){
			// If no options specify by user, use default options
			if(options != null) {
				this.options = options;
			}

			if (state!= null) {	
				var dataset = {variableToDisplay:'', data:{}, links:[], nodes:{}, isDisplayed:false, svg:null, force:null};
				if (typeof(state) === 'string'){
					dataset.variableToDisplay = state;
					this.datasets.push(dataset);
				}
				else{
					dataset.data = state;
					var parent = '';
					if (this.options.mode == 'dat'){
						parent = this.gui;
					}	
					
					this.prepareTree(parent, state, dataset);
//					dataset.links = treeVariables.links;
//					dataset.nodes = treeVariables.nodes;
					this.datasets.push(dataset);
					this.paintTree();
				}
			}

			return "Metadata or variables to display added to tree visualiser";
		},
		
		prepareTree: function(parent, data, dataset){
			if (this.options.mode == 'dat'){
				for (var key in data){
					if (data[key] !== null && typeof data[key] === 'object'){
						parentFolder = parent.addFolder(key);
						this.prepareTree(parentFolder, data[key]);
					}
					else{
						if (data[key] === null){data[key] = '';}
						parent.add(data,key).listen();
					}
				}
			}
			else if (this.options.mode == 'd3'){
				for (var key in data){
					nodeName = (parent != '')?parent + "." + key:key;
					if (data[key] !== null && typeof data[key] === 'object'){
						dataset.nodes[nodeName] = {name: key};
						if (parent != ''){
							var link = {};
							link.source = dataset.nodes[parent];
							link.target = dataset.nodes[nodeName];
							link.type = "suit";
							dataset.links.push(link);
						}
						this.prepareTree(nodeName, data[key], dataset);
					}
					else{
						if (data[key] === null){data[key] = '';}
						dataset.nodes[nodeName] = {name: key + "=" + data[key]};
						if (parent != ''){
							var link = {};
							link.source = dataset.nodes[parent];
							link.target = dataset.nodes[nodeName];
							link.type = "suit";
							dataset.links.push(link);
						}
						
					}
					
				}
			}
		},
		
		updateData: function(){
			for(var key in this.datasets) {
				dataset = this.datasets[key];
				
				if (dataset.variableToDisplay != null){
					newdata = this.getState(GEPPETTO.Simulation.watchTree, dataset.variableToDisplay);
					if (this.options.mode == 'dat'){
						if (!dataset.isDisplayed){
							dataset.data = newdata;
							this.prepareTree(this.gui, dataset.data);
							dataset.isDisplayed = true;
						}
						else{
							$.extend(true, dataset.data, newdata);
						}
					}
					else if (this.options.mode == 'd3'){
						if (!dataset.isDisplayed){
							dataset.data = newdata;
							this.prepareTree('', dataset.data, dataset);
							this.paintTree();
						}
						else{
							$.extend(true, dataset.data, newdata);
							dataset.links = [];
							dataset.nodes = {};
							this.prepareTree('', dataset.data, dataset);
							
							var nodes = dataset.force.nodes();
							$.extend(true, nodes, d3.values(dataset.nodes));
							dataset.svg.selectAll("text").data(nodes).text(function(d) { return d.name; });
						}
					}
				}
			}
		},
		
		paintTree: function(){
			if (this.options.mode == 'd3'){
				for(var key in this.datasets) {
					dataset = this.datasets[key];
					if (dataset.nodes != {} && dataset.links != []){
						if (!dataset.isDisplayed){
							dataset.isDisplayed = true;
							
							var width = 860,
							    height = 500;
				
							var force = d3.layout.force()
							    .nodes(d3.values(dataset.nodes))
							    .links(dataset.links)
							    .size([width, height])
							    .linkDistance(60)
							    .charge(-300)
							    .on("tick", tick)
							    .start();
				
							var svg = d3.select("#"+this.id).append("svg")
							    .attr("width", width)
							    .attr("height", height);
				
							// Per-type markers, as they don't inherit styles.
							svg.append("defs").selectAll("marker")
							    .data(["suit", "licensing", "resolved"])
							  .enter().append("marker")
							    .attr("id", function(d) { return d; })
							    .attr("viewBox", "0 -5 10 10")
							    .attr("refX", 15)
							    .attr("refY", -1.5)
							    .attr("markerWidth", 6)
							    .attr("markerHeight", 6)
							    .attr("orient", "auto")
							  .append("path")
							    .attr("d", "M0,-5L10,0L0,5");
				
							var path = svg.append("g").selectAll("path")
							    .data(force.links())
							  .enter().append("path")
							    .attr("class", function(d) { return "link " + d.type; })
							    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
				
							var circle = svg.append("g").selectAll("circle")
							    .data(force.nodes())
							  .enter().append("circle")
							    .attr("r", 6)
							    .call(force.drag);
				
							var text = svg.append("g").selectAll("text")
							    .data(force.nodes())
							  .enter().append("text")
							    .attr("x", 8)
							    .attr("y", ".31em")
							    .text(function(d) { return d.name; });
							
							dataset.svg = svg;
							dataset.force = force;
				
							// Use elliptical arc path segments to doubly-encode directionality.
							function tick() {
							  path.attr("d", linkArc);
							  circle.attr("transform", transform);
							  text.attr("transform", transform);
							}
				
							function linkArc(d) {
							  var dx = d.target.x - d.source.x,
							      dy = d.target.y - d.source.y,
							      dr = Math.sqrt(dx * dx + dy * dy);
							  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
							}
				
							function transform(d) {
							  return "translate(" + d.x + "," + d.y + ")";
							}
						}
					}	
				}	
			}	
		},
		
		generateRealDataTestTreeForDAT: function(){
			this.setData(this.getTestingData());
		},
		
		generateRealDataTestTreeForDAT2: function(){
			this.setData(this.getTestingData2());
		},
		
		generateRealDataTestTreeForD3: function(){
			this.setData(this.getTestingData());
		},
		
		getTestingData: function(){
			return {"electrical":
			{"hhpop":[
				       {"bioPhys1":
				          	{"membraneProperties":
				          		{"naChans":
				          			{"gDensity":{"value":4.1419823201649315,"unit":null,"scale":null},
				          			"na":{
				          				"m":
				          					{"q":{"value":0.21040640018173135,"unit":null,"scale":null}},
				          				"h":
				          					{"q":{"value":0.4046102327961389,"unit":null,"scale":null}}}},
				          		"kChans":
				          			{"k":
				          				{"n":
				          					{"q":{"value":0.42015716873953574,"unit":null,"scale":null}}}}}},
				       "spiking":{"value":0,"unit":null,"scale":null},
				       "v":{"value":-0.047481204346777425,"unit":null,"scale":null}}
				       ]
					}
			};
		},
		
		getTestingData2: function(){
			return {"electrical2":
			{"hhpop":[
				       {"bioPhys1":
				          	{"membraneProperties":
				          		{"naChans":
				          			{"gDensity":{"value":4.1419823201649315,"unit":null,"scale":null},
				          			"na":{
				          				"m":
				          					{"q":{"value":0.21040640018173135,"unit":null,"scale":null}},
				          				"h":
				          					{"q":{"value":0.4046102327961389,"unit":null,"scale":null}}}},
				          		"kChans":
				          			{"k":
				          				{"n":
				          					{"q":{"value":0.42015716873953574,"unit":null,"scale":null}}}}}},
				       "spiking":{"value":0,"unit":null,"scale":null},
				       "v":{"value":-0.047481204346777425,"unit":null,"scale":null}}
				       ]
					}
			};
		}
		

	});
});