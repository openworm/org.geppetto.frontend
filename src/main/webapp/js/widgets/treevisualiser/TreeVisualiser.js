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
		
		data: {},
		variableToDisplay: null,
		isDisplayed: false,
		
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
			this.setSize(100,300);

			this.options = this.defaultTreeVisualiserOptions;
			
			if (this.options.mode == 'dat'){
				this.gui = new dat.GUI({
					width : this.options.width,
					autoPlace: this.options.autoPlace
				});
				
	//			Testing Data
	//			this.generateTestTreeForDAT();
	
	//			Testing With Real Data
	//			this.generateRealDataTestTree();
				
	//			Testing With Variable
				this.setData("hhcell");
				
				this.dialog.append(this.gui.domElement);
			}
			else if (this.options.mode == 'd3'){
				this.generateTestTreeFor3D();
			}
			
		},
		
		setData : function(state, options){
			// If no options specify by user, use default options
			if(options != null) {
				this.options = options;
			}

			if (state!= null) {					
				if (typeof(state) === 'string'){
					this.variableToDisplay = state;
				}
				else{
					this.data = state;
					if (this.options.mode == 'dat'){
						this.displayTree(this.gui, this.data);
					}	
					else if (this.options.mode == 'd3') {
						
					}
				}
			}

			return "Metadata or variables to display added to tree visualiser";
		},
		
		displayTree: function(parent, data){
			for (var key in data){
				if (data[key] !== null && typeof data[key] === 'object'){
					parentFolder = parent.addFolder(key);
					this.displayTree(parentFolder, data[key]);
				}
				else{
					if (data[key] === null){data[key] = 'Null';}
					parent.add(data,key).listen();
				}
			}
		},
		
		updateData: function(){
			if (this.variableToDisplay != null){
				newdata = this.getState(GEPPETTO.Simulation.watchTree, this.variableToDisplay);
				if (!this.isDisplayed){
					this.data = newdata;
					this.displayTree(this.gui, this.data);
					this.isDisplayed = true;
				}
				else{
					$.extend(true, this.data, newdata);
				}
			}
		},
		generateTestTreeFor3D: function(){
				//this.dialog.append(this.gui.domElement);
				// http://blog.thomsonreuters.com/index.php/mobile-patent-suits-graphic-of-the-day/
				var links = [
				  {source: "Microsoft", target: "Amazon", type: "licensing"},
				  {source: "Microsoft", target: "HTC", type: "licensing"},
				  {source: "Samsung", target: "Apple", type: "suit"},
				  {source: "Motorola", target: "Apple", type: "suit"},
				  {source: "Nokia", target: "Apple", type: "resolved"},
				  {source: "HTC", target: "Apple", type: "suit"},
				  {source: "Kodak", target: "Apple", type: "suit"},
				  {source: "Microsoft", target: "Barnes & Noble", type: "suit"},
				  {source: "Microsoft", target: "Foxconn", type: "suit"},
				  {source: "Oracle", target: "Google", type: "suit"},
				  {source: "Apple", target: "HTC", type: "suit"},
				  {source: "Microsoft", target: "Inventec", type: "suit"},
				  {source: "Samsung", target: "Kodak", type: "resolved"},
				  {source: "LG", target: "Kodak", type: "resolved"},
				  {source: "RIM", target: "Kodak", type: "suit"},
				  {source: "Sony", target: "LG", type: "suit"},
				  {source: "Kodak", target: "LG", type: "resolved"},
				  {source: "Apple", target: "Nokia", type: "resolved"},
				  {source: "Qualcomm", target: "Nokia", type: "resolved"},
				  {source: "Apple", target: "Motorola", type: "suit"},
				  {source: "Microsoft", target: "Motorola", type: "suit"},
				  {source: "Motorola", target: "Microsoft", type: "suit"},
				  {source: "Huawei", target: "ZTE", type: "suit"},
				  {source: "Ericsson", target: "ZTE", type: "suit"},
				  {source: "Kodak", target: "Samsung", type: "resolved"},
				  {source: "Apple", target: "Samsung", type: "suit"},
				  {source: "Kodak", target: "RIM", type: "suit"},
				  {source: "Nokia", target: "Qualcomm", type: "suit"}
				];

				var nodes = {};

				// Compute the distinct nodes from the links.
				links.forEach(function(link) {
				  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
				  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
				});

				var width = 960,
				    height = 500;

				var force = d3.layout.force()
				    .nodes(d3.values(nodes))
				    .links(links)
				    .size([width, height])
				    .linkDistance(60)
				    .charge(-300)
				    .on("tick", tick)
				    .start();

				var svg = d3.select(this.id).append("svg")
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
		},
		
		generateTestTreeForDAT: function(){
			var FizzyText = function() {
			  this.message = 'dat.gui';
			  this.speed = 0.8;
			  this.displayOutline = false;
			};
			
			var text = new FizzyText();
			this.gui.add(text, 'message');
			this.gui.add(text, 'speed', -5, 5);
			this.gui.add(text, 'displayOutline');	
		},
		
		generateRealDataTestTree: function(){
			data = {"electrical":
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
			
			this.setData(data);
		}
		

	});
});