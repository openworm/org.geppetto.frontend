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
 * Connectivity Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 * @author borismarin
 */

define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');
    var Instance = require('model/Instance');
    require('jsx!mixins/bootstrap/modal')

    return Widget.View.extend({

        dataset: {},

        defaultConnectivityOptions: {
            width: 660,
            height: 500,
            layout: "matrix", //[matrix, force, hive, chord]
            nodeType: function (node) {
                if (node instanceof Instance) {
                    return node.getType().getId();
                } else {
                    return node.getPath().split('_')[0];
                }
            },
            linkWeight: function (conn) {
                return 1;
            },
            linkType: function (conn) {
                return 1;
            }
        },


        initialize: function (options) {
            this.options = options;

            Widget.View.prototype.initialize.call(this, options);
            this.setOptions(this.defaultConnectivityOptions);

            this.render();
            this.setSize(options.height, options.width);

            this.connectivityContainer = $("#" + this.id);

            var that=this;
            this.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                that.configViaGUI();
            }));

        },

        setSize: function (h, w) {
            Widget.View.prototype.setSize.call(this, h, w);
            if (this.svg != null) {
                //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
                var width = this.size.width - 20;
                var height = this.size.height - 20;
                if (this.options.layout == 'matrix') {
                    $('#' + this.id + '-ordering').remove();
                }
                this.createLayout();
            }
        },

        setData: function (root, options) {
            this.setOptions(options);
            this.dataset = {};
            this.mapping = {};
            this.mappingSize = 0;
            this.dataset["root"] = root;
            this.widgetMargin = 20;

            if(this.createDataFromConnections()){
            	this.createLayout();	
            }


            return this;
        },

        createDataFromConnections: function () {
        	
            //TODO: Hardcoded NeuroML stuff
            if(Model.neuroml.connection){
            	
            	var connectionVariables = Model.neuroml.connection.getVariableReferences();
            	if(connectionVariables.length>0) {

		            if (this.dataset["root"].getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
		                var subInstances = this.dataset["root"].getChildren();
		                this.dataset["nodes"] = [];
		                this.dataset["links"] = [];
		
		                for (var k = 0; k < subInstances.length; k++) {
		                    var subInstance = subInstances[k];
		                    if (subInstance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
		                        var populationChildren = subInstance.getChildren();
		                        for (var l = 0; l < populationChildren.length; l++) {
		                            var populationChild = populationChildren[l];
		                            this.createNode(populationChild.getId(), this.options.nodeType(populationChild));
		                        }
		
		                    }
		                }

		                for(var x=0; x<connectionVariables.length; x++){
	                        var connectionVariable = connectionVariables[x];
	
	                        var source = connectionVariable.getA();
	                        var target = connectionVariable.getB();
	                        var sourceId = source.getElements()[source.getElements().length - 1].getPath();
	                        var targetId = target.getElements()[source.getElements().length - 1].getPath();
	
	                        this.createLink(sourceId, targetId, this.options.linkType(connectionVariable), this.options.linkWeight(connectionVariable));
		                }
		            }
                	
		            this.dataset.nodeTypes = _.uniq(_.pluck(this.dataset.nodes, 'type'));
		            this.dataset.linkTypes = _.uniq(_.pluck(this.dataset.links, 'type'));
		            return true;
                }
            
            }
            
            return false;

        },


        //TODO: move graph utils to module, maybe consider jsnetworkx?
        // this is very rough, we should think about directionality and weights...
        calculateNodeDegrees: function (normalize) {
            var indegrees = _.countBy(this.dataset.links, function (link) {
                return link.source;
            });
            var outdegrees = _.countBy(this.dataset.links, function (link) {
                return link.target;
            });
            var maxDeg = 1;
            this.dataset.nodes.forEach(function (node, idx) {
                var idg = (typeof indegrees[idx] === 'undefined') ? 0 : indegrees[idx];
                var odg = (typeof outdegrees[idx] === 'undefined') ? 0 : outdegrees[idx];
                node.degree = idg + odg;
                if (node.degree > maxDeg) {
                    maxDeg = node.degree;
                }
            });
            if (normalize) {
                this.dataset.nodes.forEach(function (node) {
                    node.degree /= maxDeg;
                });
            }
        },

        createLayout: function () {
            $('#' + this.id + " svg").remove();
            $('#' + this.id + " #matrix-sorter").remove();

            this.options.innerWidth = this.connectivityContainer.innerWidth() - this.widgetMargin;
            this.options.innerHeight = this.connectivityContainer.innerHeight() - this.widgetMargin;

            this.svg = d3.select("#" + this.id)
                .append("svg")
                .attr("width", this.options.innerWidth)
                .attr("height", this.options.innerHeight);

            switch (this.options.layout) {
                case 'matrix':
                    matrices.createMatrixLayout(this);
                    break;
                case 'force':
                    forces.createForceLayout(this);
                    break;
                case 'hive':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(true);
                    hives.createHiveLayout(this);
                    break;
                case 'chord':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(false);
                    chords.createChordLayout(this);
                    break;
            }
        },


        createLegend: function (id, colorScale, position, title) {

            var ret;
            //TODO: boxes should scale based on number of items
            var colorBox = {size: 20, labelSpace: 4};
            var padding = {x: colorBox.size, y: 2 * colorBox.size};

            //TODO: is it sane not to draw the legend if there is only one category?
            if (colorScale.domain().length > 1) {
                var horz, vert;
                var legendItem = this.svg.selectAll(id)
                    .data(colorScale.domain())
                    .enter().append('g')
                    .attr('transform', function (d, i) {
                        var height = colorBox.size + colorBox.labelSpace;
                        horz = colorBox.size + position.x + padding.x;
                        vert = i * height + position.y + padding.y;
                        return 'translate(' + horz + ',' + vert + ')';
                    });

                // coloured squares
                legendItem.append('rect')
                    .attr('width', colorBox.size)
                    .attr('height', colorBox.size)
                    .style('fill', function (d) {
                        return colorScale(d);
                    })
                    .style('stroke', function (d) {
                        return colorScale(d);
                    });

                // labels
                legendItem.append('text')
                    .attr('x', colorBox.size + colorBox.labelSpace)
                    .attr('y', colorBox.size - colorBox.labelSpace)
                    .attr('class', 'legend-text')
                    .text(function (d) {
                        return d;
                    });

                // title
                if (typeof title != 'undefined') {
                    this.svg.append('text')
                        .text(title)
                        .attr('class', 'legend-title')
                        .attr('x', position.x + 2 * padding.x)
                        .attr('y', position.y + 0.75 * padding.y);
                }
                ret = {x: horz, y: vert};
            }

            return ret;

        },


        createNode: function (id, type) {
           if (!(id in this.mapping)) {
                var nodeItem = {
                    id: id,
                    type: type,
                };
                this.dataset["nodes"].push(nodeItem);

                this.mapping[nodeItem["id"]] = this.mappingSize;
                this.mappingSize++;
            }
        },

        createLink: function (sourceId, targetId, type, weight) {
            var linkItem = {
                source: this.mapping[sourceId],
                target: this.mapping[targetId],
                type: type,
                weight: weight
            };
            this.dataset["links"].push(linkItem);
        },

        /**
         *
         * Set the options for the connectivity widget
         *
         * @command setOptions(options)
         * @param {Object} options - options to modify the plot widget
         */
        setOptions: function (options) {
            function strToFunc(body){
                return new Function('x', 'return ' + body + ';');
            }
            if (options != null) {
                if(typeof options.linkType === 'string')
                    options.linkType = strToFunc(options.linkType);
                if(typeof options.nodeType === 'string')
                    options.nodeType = strToFunc(options.nodeType);
                if(typeof options.linkWeight === 'string')
                    options.linkWeight = strToFunc(options.linkWeight);
                $.extend(this.options, options);
            }
        },

        /* TODO: Replace spread until jsdocs supports it
        getHelp: function(){
            function dedent(callSite, ...args) {
                function format(str) {
                    let size = -1;
                    return str.replace(/\n(\s+)/g, (m, m1) => {
                        if (size < 0)
                            size = m1.replace(/\t/g, "    ").length;
                        return "\n" + m1.slice(Math.min(m1.length, size));
                    });
                }
                if (typeof callSite === "string")
                    return format(callSite);
                if (typeof callSite === "function")
                    return (...args) => format(callSite(...args));
                let output = callSite
                    .slice(0, args.length + 1)
                    .map((text, i) => (i === 0 ? "" : args[i - 1]) + text)
                    .join("");
                return format(output);
            }
            var help = {
                'matrix':dedent(`
                    ### Adjacency matrix
                `),
                'chord': dedent(`
                    ### Chord Diagram
                    Hover over populations ("slices") to highlight incoming / outgoing connections.
                    - Control-hover: outgoing connections
                    - Shift-hover: incoming connections
                `),
                'hive':dedent(`
                        ### Hive Plot
                `),
                'force':dedent(`
                        ### Force Directed Graph Drawing
                `),
            }

            return '## Connectivity Widget\n' + help[this.options.layout];
        },
        */
        
        createLayoutSelector: function() {

            function imgPath(path){
                return 'geppetto/js/widgets/connectivity/images/' + path;
            };

            var layoutOptions = [
                 {id: "matrix", label: 'Adjacency matrix', description:
                     "A coloured square at row 𝒊, column 𝒋 represents a " +
                     "directed connection from node 𝒋 to node 𝒊.",
                     img: imgPath('matrix.svg')},
                 {id: "force", label: 'Force-directed layout', description:
                     "Draw circles for nodes, lines for connections, disregarding " +
                     "spatial information.",
                     img: imgPath('force.svg')},
                 {id: "hive",  label: 'Hive plot', description:
                     "Axes correspond to node categories, arcs to connections." +
                     "The position of each node along an axis is determined by " +
                     "the total number of connections it makes.",
                     img: imgPath('hive.svg')},
                 {id: "chord", label:'Chord diagram', description:
                     "Circular slices correspond to node categories, chords to " +
                     "connections. A gap between slice and chord indicate an " +
                     "incoming connection. Use ctrl(shift) + mouse hover to " +
                     "hide incoming(outgoing) connections from a population.",
                     img: imgPath('chord.svg')}
             ];
            var container = $('<div>').addClass('card-deck-wrapper');
            $('<p class="card-wrapper-title">How would you like to represent your network?</p>').appendTo(container);
            var deck = $('<div>').addClass('card-deck').appendTo(container);

            function createCard(cardData){
                return $('<div>', {class: 'card', id: cardData.id})
                        .append($('<img>', {
                            class: 'card-img-top center-block',
                            src: cardData.img,
                        }))
                        .append($('<h4>', {
                            class: 'card-title',
                            text: cardData.label
                        }))
                        .append($('<p>', {
                            class: 'card-text',
                            text: cardData.description
                        }));
            }

            for(layout in layoutOptions){
                deck.append(createCard(layoutOptions[layout]));
            }

            return container;
        },

        configViaGUI : function() {
            var that = this;
            var firstClick=false;
            var modalContent=$('<div class="modal fade" id="connectivity-config-modal"></div>')
                                .append(this.createLayoutSelector()[0].outerHTML).modal();
            function handleFirstClick(event) {
                //TODO: Hardcoded NeuroML stuff
                var netTypes = GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.network)
                var netInstances = _.flatten(_.map(netTypes, function(x){return GEPPETTO.ModelFactory.getAllInstancesOf(x)}));
                function synapseFromConnection(conn) {
                	
                	var synapses=GEPPETTO.ModelFactory.getAllVariablesOfType(conn.getParent(),GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse);
                	if(synapses.length>0){
                		return synapses[0].getId();
                	}
                	else{
                		return "Gap junction";
                	}
                };
                that.setData(netInstances[0], {layout: event.currentTarget.id, linkType: synapseFromConnection}); //TODO: add option to select what to plot if #netInstance>1?
                firstClick=true;
            }
            
            function clickHandler(event) {
            	if(!firstClick){
            		handleFirstClick(event);
            		setTimeout(function() { firstClick=false;}, 200); //closes the window to click again (dbclick)
            	}
            	else{
            		modalContent.modal('hide');
            		firstClick=false;
            	}
            }


            modalContent.find('.card').on('click', clickHandler);
        }
    });
});
