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

    return Widget.View.extend({

        dataset: {},

        defaultConnectivityOptions: {
            width: 660,
            height: 500,
            layout: "matrix", //[matrix, force, hive, chord]
            //TODO: Those are not sane defaults.
            //      Once things have types, we should ideally use sthing like  x.getType()
            nodeType: function (node) {
                if(typeof node.getPath === "function"){
                    return node.getPath().split('_')[0]
                } else {
                    return node.getId().split('_')[0]
                }
            },
            linkWeight: function (conn) {
                return 1
            },
            linkType: function (conn) {
                return 1
            }
        },

        initialize: function (options) {
            this.options = options;

            Widget.View.prototype.initialize.call(this, options);
            this.setOptions(this.defaultConnectivityOptions);

            this.render();
            this.setSize(options.height, options.width);

            this.connectivityContainer = $("#" + this.id);
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

            this.createDataFromConnections();

            this.createLayout();

            //return "Metadata or variables added to connectivity widget";
            return this;
        },

        createDataFromConnections: function () {

            if (this.dataset["root"].getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
                var subInstances = this.dataset["root"].getChildren();
                this.dataset["nodes"] = [];
                this.dataset["links"] = [];

                for (var k=0; k<subInstances.length; k++) {
                    var subInstance = subInstances[k];
                    this.createNode(subInstance.getId(), this.options.nodeType(subInstance));

                    // get children that are connections
                    var connections = this.getConnectionChildren(subInstance);
                    for (var x = 0; x<connections.length; x++) {
                        var connectionItem = connections[x];

                        var source = connectionItem.getA();
                        var target = connectionItem.getB();
                        var sourceId = source.getElements()[source.getElements().length - 1].getPath();
                        var targetId = target.getElements()[source.getElements().length - 1].getPath();

                        this.createNode(targetId, this.options.nodeType(target.getElements()[source.getElements().length - 1]));
                        this.createLink(sourceId, targetId, this.options.linkType(connectionItem), this.options.linkWeight(connectionItem));
                    }

                }
            }
            this.dataset.nodeTypes = _.uniq(_.pluck(this.dataset.nodes, 'type'));
            this.dataset.linkTypes = _.uniq(_.pluck(this.dataset.links, 'type'));
        },

        // gets children of the given entity if their type is 'connection'
        getConnectionChildren: function (instance) {
            var connections = [];
            var children = instance.getChildren();
            for(var i=0; i<children.length; i++){
                if(children[i].getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE){
                    connections.push(children[i]);
                }
            }
            return connections;
        },

        //TODO: move to graph utils to package, maybe consider jsnetworkx?
        // this is very rough, we should think about directionality and weights...
        calculateNodeDegrees: function (normalize) {
            var indegrees = _.countBy(this.dataset.links, function (link) {
                return link.source
            });
            var outdegrees = _.countBy(this.dataset.links, function (link) {
                return link.target
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

        generateChordMatrix: function () {
            var that = this;
            var matrix = [];

            var type2type = {};

            // {type_i: {postType_j: counts, ...}, ...}
            var typesZeros = _.map(this.dataset.nodeTypes, function (type) {
                return [type, 0]
            });
            this.dataset.nodeTypes.forEach(function (type) {
                var initCounts = _.object(typesZeros);
                var linksFromType = _.filter(that.dataset.links, function (link) {
                    return that.dataset.nodes[link.source].type === type
                });
                type2type[type] = _.extend(initCounts, _.countBy(linksFromType, function (link) {
                    return that.dataset.nodes[link.target].type
                }));
            });

            var numNodesOfType = _.countBy(this.dataset.nodes, function (node) {
                return node.type
            });
            //unconnected nodes of all types
            var discNodes = _.filter(this.dataset.nodes, function (node) {
                return node.degree == 0
            });
            var numDiscByType = _.countBy(discNodes, function (node) {
                return node.type
            });

            this.dataset.nodeTypes.forEach(function (type, idx, nodeTypes) {
                var numConn = [];
                nodeTypes.forEach(function (innerType) {
                    //normalization should be optional
                    //numConn.push[type2type.innerType] / numNodesOfType[type];
                    numConn.push(type2type[type][innerType]);
                });
                numConn.push(numDiscByType[type] ? numDiscByType[type] : 0);
                matrix.push(numConn);
            });
            // row of zeros for unconnected nodes
            var zeroes = [];
            for (var i = 0; i <= this.dataset.nodeTypes.length; i++) {
                zeroes.push(0)
            }
            matrix.push(zeroes);
            return matrix;
        },

        //TODO: move force, hive, matrix to objects
        createLayout: function () {
            $('#' + this.id + " svg").remove();

            this.options.innerWidth = this.connectivityContainer.innerWidth() - this.widgetMargin;
            this.options.innerHeight = this.connectivityContainer.innerHeight() - this.widgetMargin;

            this.svg = d3.select("#" + this.id)
                .append("svg")
                .attr("width", this.options.innerWidth)
                .attr("height", this.options.innerHeight);

            switch (this.options.layout) {
                case 'matrix':
                    this.createMatrixLayout();
                    break;
                case 'force':
                    this.createForceLayout();
                    break;
                case 'hive':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(true);
                    this.createHiveLayout();
                    break;
                case 'chord':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(false);
                    this.createChordLayout(this.generateChordMatrix());
                    break;
            }
        },

        createForceLayout: function () {

            //TODO: 10/20 categories hardcoded in color scales
            var linkTypeScale = d3.scale.category10()
                .domain(this.dataset.linkTypes);
            var nodeTypeScale = d3.scale.category20()
                .domain(this.dataset.nodeTypes);
            var weightScale = d3.scale.linear()
                .domain(d3.extent(_.pluck(this.dataset.links, 'weight').map(parseFloat)))
                //TODO: think about weight = 0 (do we draw a line?)
                .range([0.5, 4]);

            this.force = d3.layout.force()
                .charge(-250)
                .linkDistance(150)
                .size([this.options.innerWidth, this.options.innerHeight]);

            this.force.nodes(this.dataset.nodes)
                .links(this.dataset.links)
                .start();

            var link = this.svg.selectAll(".link")
                .data(this.dataset.links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke", function (d) {
                    return linkTypeScale(d.type)
                })
                .style("stroke-width", function (d) {
                    return weightScale(d.weight)
                });

            var node = this.svg.selectAll(".node")
                .data(this.dataset.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)  // radius
                .style("fill", function (d) {
                    return nodeTypeScale(d.type);
                })
                .call(this.force.drag);

            node.append("title")
                .text(function (d) {
                    return d.id;
                });

            this.force.on("tick", function () {
                link.attr("x1", function (d) {
                    return d.source.x;
                })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                node.attr("cx", function (d) {
                    return d.x;
                })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            });

            var legendPosition = {x: 0.75 * this.options.innerWidth, y: 0};

            //Nodes
            var legendBottom = this.createLegend('legend', nodeTypeScale, legendPosition, 'Cell Types');

            legendPosition.y = legendBottom.y + 15;
            //Links
            this.createLegend('legend2', linkTypeScale, legendPosition, 'Synapse Types');
        },


        createMatrixLayout: function () {

            var margin = {top: 30, right: 10, bottom: 10, left: 3};
            var legendWidth = 120;

            var matrixDim = (this.options.innerHeight < (this.options.innerWidth - legendWidth)) ? (this.options.innerHeight) : (this.options.innerWidth - legendWidth);

            var x = d3.scale.ordinal().rangeBands([0, matrixDim - margin.top]),
            // Opacity
                z = d3.scale.linear().domain([0, 4]).clamp(true),
            // Colors
                c = d3.scale.category10();

            this.svg
                .style("padding-left", margin.left + "px")
                .style("padding-top", margin.top + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var matrix = [];
            var nodes = this.dataset.nodes;
            var root = this.dataset.root;
            var n = nodes.length;

            // Compute index per node.
            nodes.forEach(function (node, i) {
                node.pre_count = 0;
                node.post_count = 0;
                matrix[i] = d3.range(n).map(function (j) {
                    return {x: j, y: i, z: 0};
                });
            });

            // Convert links to matrix; count pre / post conns.
            this.dataset.links.forEach(function (link) {
                //TODO: think about zero weight lines
                //matrix[link.source][link.target].z = link.weight ? link.type : 0;
                matrix[link.source][link.target].z = link.type;
                nodes[link.source].pre_count += 1;
                nodes[link.target].post_count += 1;
            });

            //Sorting matrix entries.
            //TODO: runtime specified sorting criteria
            var sortOptions = {
                'id': 'By entity name',
                'pre_count': 'By # pre',
                'post_count': 'By # post'
            };
            //  Precompute the orders.
            var orders = {
                id: d3.range(n).sort(function (a, b) {
                    return d3.ascending(nodes[a].id, nodes[b].id);
                }),
                pre_count: d3.range(n).sort(function (a, b) {
                    return nodes[b].pre_count - nodes[a].pre_count;
                }),
                post_count: d3.range(n).sort(function (a, b) {
                    return nodes[b].post_count - nodes[a].post_count;
                }),
                //community: d3.range(n).sort(function(a, b) { return nodes[b].community - nodes[a].community; }),
            };
            // Default sort order.
            x.domain(orders.id);

            var rect = this.svg
                .append("rect")
                .attr("class", "background")
                .attr("width", matrixDim - margin.left)
                .attr("height", matrixDim - margin.top);

            var row = this.svg.selectAll(".row")
                .data(matrix)
                .enter().append("g")
                .attr("class", "row")
                .attr("transform", function (d, i) {
                    return "translate(0," + x(i) + ")";
                })
                .each(row);

            row.append("line")
                .attr("x2", this.options.innerWidth);

            var column = this.svg.selectAll(".column")
                .data(matrix)
                .enter().append("g")
                .attr("class", "column")
                .attr("transform", function (d, i) {
                    return "translate(" + x(i) + ")rotate(-90)";
                });

            column.append("line")
                .attr("x1", -this.options.innerWidth);

            var tooltip = this.svg
                .append("text")
                .attr("x", 0)
                .attr("y", -10)
                .attr('class', 'connectionlabel')
                .text("Hover the squares to see the connections.");

            this.createLegend('legend', c, {x: matrixDim, y: 0});

            //Sorting matrix entries by criteria specified via combobox
            var orderContainer = $('<div/>', {
                id: this.id + '-ordering',
                style: 'width:' + legendWidth + 'px;left:' + (matrixDim + this.widgetMargin) + 'px;top:' + (matrixDim - 32) + 'px;',
                class: 'connectivity-ordering'
            }).appendTo(this.connectivityContainer);

            var orderCombo = $('<select/>');
            $.each(sortOptions, function (k, v) {
                $('<option/>', {value: k, text: v}).appendTo(orderCombo);
            });
            orderContainer.append($('<span/>', {
                class: 'connectivity-ordering-label',
                text: 'Order by:'
            }).append(orderCombo));

            orderCombo.on("change", function (svg) {
                return function () {
                    x.domain(orders[this.value]);

                    var t = svg.transition().duration(2500);
                    t.selectAll(".row")
                        .delay(function (d, i) {
                            return x(i) * 4;
                        })
                        .attr("transform", function (d, i) {
                            return "translate(0," + x(i) + ")";
                        })
                        .selectAll(".cell")
                        .delay(function (d) {
                            return x(d.x) * 4;
                        })
                        .attr("x", function (d) {
                            return x(d.x);
                        });

                    t.selectAll(".column")
                        .delay(function (d, i) {
                            return x(i) * 4;
                        })
                        .attr("transform", function (d, i) {
                            return "translate(" + x(i) + ")rotate(-90)";
                        });
                }
            }(this.svg));

            // Draw squares for each connection
            function row(row) {
                var cell = d3.select(this).selectAll(".cell")
                    .data(row.filter(function (d) {
                        return d.z;
                    })) //only paint conns
                    .enter().append("rect")
                    .attr("class", "cell")
                    .attr("x", function (d) {
                        return x(d.x);
                    })
                    .attr("width", x.rangeBand())
                    .attr("height", x.rangeBand())
                    .attr("title", function (d) {
                        return d.id;
                    })
                    //.style("fill-opacity", function(d) { return z(d.z); })
                    .style("fill", function (d) {
                        return c(d.z);
                    })
                    .on("click", function (d) {
                        G.unSelectAll();
                        //Ideally instead of hiding the connectivity lines we'd show only the ones connecting the two cells, also we could higlight the connection.
                        eval(root.name + "." + nodes[d.x].id).select();
                        eval(root.name + "." + nodes[d.x].id).showConnectionLines(false);
                        eval(root.name + "." + nodes[d.y].id).select();
                        eval(root.name + "." + nodes[d.y].id).showConnectionLines(false);
                    })
                    .on("mouseover", function (d) {
                        d3.select(this.parentNode.appendChild(this)).transition().duration(100).style({
                            'stroke-opacity': 1,
                            'stroke': 'white',
                            'stroke-width': '2'
                        });
                        d3.select("body").style('cursor', 'pointer');
                        return tooltip.transition().duration(100).text(nodes[d.y].id + " is connected to " + nodes[d.x].id);
                    })
                    .on("mouseout", function () {
                        d3.select(this).transition().duration(100).style({'stroke-opacity': 0, 'stroke': 'white'});
                        d3.select("body").style('cursor', 'default');
                        return tooltip.text("");
                    });
            }
        },

        createHiveLayout: function () {

            innerRadius = 20,
                outerRadius = 180;

            var angle = d3.scale.ordinal().domain(d3.range(this.dataset.nodeTypes.length + 1)).rangePoints([0, 2 * Math.PI]),
                quali_angle = d3.scale.ordinal().domain(this.dataset.nodeTypes).rangeBands([0, 2 * Math.PI]);
            radius = d3.scale.linear().range([innerRadius, outerRadius]),
                linkTypeScale = d3.scale.category10().domain(this.dataset.linkTypes);
            nodeTypeScale = d3.scale.category20().domain(this.dataset.nodeTypes);

            var nodes = this.dataset.nodes,
                links = [];
            this.dataset.links.forEach(function (li) {
                if (typeof li.target !== "undefined") {
                    links.push({source: nodes[li.source], target: nodes[li.target], type: li.type});
                }
            });

            var svg = this.svg.append("g")
                .attr("transform", "translate(" + this.options.innerWidth / 2 + "," + this.options.innerHeight / 2 + ")");

            svg.selectAll(".axis")
                .data(d3.range(this.dataset.nodeTypes.length))
                .enter().append("line")
                .attr("class", "axis")
                .attr("transform", function (d) {
                    return "rotate(" + degrees(angle(d)) + ")";
                })
                .attr("x1", radius.range()[0])
                .attr("x2", radius.range()[1]);

            svg.selectAll(".link")
                .data(links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.hive.link()
                    .angle(function (d) {
                        return quali_angle(d.type);
                    })
                    .radius(function (d) {
                        return radius(d.degree);
                    }))
                .style("stroke", function (d) {
                    return linkTypeScale(d.type);
                });

            var node = svg.selectAll(".node")
                .data(nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "rotate(" + degrees(quali_angle(d.type)) + ")";
                })
                .attr("cx", function (d) {
                    return radius(d.degree);
                })
                .attr("r", 5)
                .style("fill", function (d) {
                    return nodeTypeScale(d.type);
                });

            node.append("title")
                .text(function (d) {
                    return d.id;
                });

            function degrees(radians) {
                return radians / Math.PI * 180 - 90;
            }
        },

        createChordLayout: function (matrix) {

            var innerRadius = Math.min(this.options.innerWidth, this.options.innerHeight) * .41,
                outerRadius = innerRadius * 1.05;

            var fill = d3.scale.category20b()
                .domain(d3.range(this.dataset.nodeTypes.length));

            var svg = this.svg.append("g")
                .attr("transform", "translate(" + this.options.innerWidth / 2 + "," + this.options.innerHeight / 2 + ")");

            var chord = d3.layout.chord()
                .padding(.05)
                .sortSubgroups(d3.descending)
                .matrix(matrix);

            var filtered_groups = function () {
                return chord.groups().filter(function (el) {
                    return el.value > 0
                })
            };

            svg.append("g").selectAll("path")
                .data(filtered_groups)
                .enter().append("path")
                .style("fill", function (d) {
                    return fill(d.index);
                })
                .style("stroke", function (d) {
                    return fill(d.index);
                })
                .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
                .on("mouseover", fade(.1))
                .on("mouseout", fade(1));


            var ticks = svg.append("g").selectAll("g")
                .data(filtered_groups)
                .enter().append("g").selectAll("g")
                .data(groupTicks)
                .enter().append("g")
                .attr("transform", function (d) {
                    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + outerRadius + ",0)";
                });

            ticks.append("line")
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 0)
                .attr("class", "chord-tick");
            //.style("stroke", "#000");

            ticks.append("text")
                .attr("class", "chord-tick-scale")
                .attr("x", 8)
                .attr("dy", ".35em")
                .attr("transform", function (d) {
                    return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
                })
                .style("text-anchor", function (d) {
                    return d.angle > Math.PI ? "end" : null;
                })
                .text(function (d) {
                    return d.label;
                });


            svg.append("g")
                .attr("class", "chord")
                .selectAll("path")
                .data(function () {
                    return chord.chords().filter(function (el) {
                        return chord.groups()[el.target.index].value > 0
                    })
                })
                .enter().append("path")
                .attr("d", d3.svg.chord().radius(innerRadius))
                .style("fill", function (d) {
                    return fill(d.target.index);
                })
                .style("opacity", 1);


            function groupTicks(d) {
                var k = (d.endAngle - d.startAngle) / d.value;
                return d3.range(0, d.value, 10).map(function (v, i) {
                    return {
                        angle: v * k + d.startAngle,
                        label: i % 5 ? null : v
                    };
                });
            }

            function fade(opacity) {
                return function (g, i) {
                    svg.selectAll(".chord path")
                        .filter(function (d) {
                            return d.source.index != i && d.target.index != i;
                        })
                        .transition()
                        .style("opacity", opacity);
                };
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
            if (options != null) {
                $.extend(this.options, options);
            }
        },
    });
});
