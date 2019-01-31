/**
 * Connectivity widget
 */


define(function (require) {
    return {
        attraction: 5000,
        repulsion: -1000,
        state: {population: true},
        createForceLayout: function (context) {
            var d3 = require("d3");
            var _ = require('underscore');

            //TODO: 10/20 categories hardcoded in color scales
            var linkTypeScale = d3.scaleOrdinal(context.linkColors)
                .domain(context.dataset.linkTypes);
            var nodeTypeScale = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeAccent);
            var weightScale = d3.scaleLinear()
                .domain(d3.extent(_.pluck(context.dataset.links, 'weight').map(parseFloat)))
                //TODO: think about weight = 0 (do we draw a line?)
                .range([0.5, 4]);

            //if (context.force) context.force.stop();

	    //add encompassing group for the zoom
	    var g = context.svg.append("g")
		.attr("class", "everything");

            if (!context.attraction)
                context.attraction = 5000;
            if (!context.repulsion)
                context.repulsion = -1000;
            
            if (context.dataset.populationLinks.filter(l => !l.weight).length > 0)
                context.populateWeights(context.dataset.populationLinks);

            if (context.dataset.links.filter(l => !l.weight).length > 0)
                context.populateWeights(context.dataset.links);

            if (this.state.population) {
                var links = [];
                for (link of context.dataset.populationLinks)
                    links.push(Object.assign({}, link));
                /*var tmpLinks = [];
                    for (var i=0; i<context.dataset.populationLinks.length; ++i) {
                        var matches = tmpLinks
                            .filter(x => JSON.stringify(x.type)==JSON.stringify(context.dataset.populationLinks[i].type));
                        if (matches.length==0)
                            tmpLinks.push(context.dataset.populationLinks[i]);
                    }*/
                /*links.sort(l => l.type[0]);
                links = links.filter(
                    function(x,i) {
                        if (i>0) {
                            return links[i-1].source!=x.source && links[i-1].target!=x.target;
                        } else {
                            return 1;
                        }
                        });*/

                var tmpLinks = [];
                for (key of Object.keys(context.projectionSummary)) {
                    var prepost = key.split(',');
                    tmpLinks.push(links.filter(function(l) {
                        if (typeof l.target.type === 'undefined')
                            return context.dataset.populationNodes[l.source].type + ',' + context.dataset.populationNodes[l.target].type === key;
                        else
                            return l.target.type === prepost[1] && l.source.type === prepost[0];
                    })[0]);
                }
                tmpLinks = tmpLinks.filter(x=>x);
                for (key of Object.keys(context.projectionSummary)) {
                    var w = context.dataset.populationLinks.filter(function(l) {
                        if (typeof l.target.type === 'undefined')
                        { return context.dataset.populationNodes[l.target].type + ',' + context.dataset.populationNodes[l.source].type === key; }
                        else
                        { return l.target.type + ',' + l.source.type === key; } }).reduce((acc,cur)=>acc+cur.weight,0);
                    //var w = context.dataset.links.filter(l => l.source.type+','+l.target.type === key).reduce((acc, cur) => acc + cur.weight, 0);
                    if (tmpLinks.filter(function(l) {
                        if (typeof l.target.type === 'undefined') {
                            return context.dataset.populationNodes[l.target].type + ',' + context.dataset.populationNodes[l.source].type === key;
                        } else {
                            return l.target.type + ',' + l.source.type === key;
                        }
                    }).length > 0) {
                        var index = tmpLinks.map(function(l) {
                            if (typeof l.target.type === 'undefined') {
                                return context.dataset.populationNodes[l.target].type + ',' + context.dataset.populationNodes[l.source].type === key;
                            } else {
                                return l.target.type + ',' + l.source.type === key;
                            }
                        }).indexOf(true);
                        tmpLinks[index].weight = w;
                    }
                }
                links = tmpLinks;
                var nodes = context.dataset.populationNodes;
            } else {
                var links = context.dataset.links;
                var nodes = context.dataset.nodes;
            }

            //distance(function(d) { return d.id; }).strength(function (d) { if(links[0] != 1) { return d.n } else { return 0 }; }))
            // id(function(d) { return d.id; }).
            

            var exp_scale = function(min_out, max_out, min_in, max_in, x) {
                if (max_in == min_in)
                    return 5*min_out;
                else {
                    var n = Math.pow(max_out/min_out, 1/(max_in-min_in));
                    var k = min_out/(n**min_in);
                    return k*n**x;
                }
            };

            var lin_scale = function(min_out, max_out, min_in, max_in, x) {
                if (max_in == min_in)
                    return 1;
                var m = (max_out - min_out)/(max_in - min_in);
                return m*(x-max_in)+max_out;
            };

            var node_min = Math.min.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));
            var node_max = Math.max.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));
            var scale_node = function(x) {
                return exp_scale(50, 100, node_min, node_max, x);
            }

            var link_min = Math.min.apply(null, links.filter(l => l.target!==l.source).map(l => l.weight).filter(w => typeof w != 'undefined'));
            var link_max = Math.max.apply(null, links.filter(l => l.target!==l.source).map(l => l.weight).filter(w => typeof w != 'undefined'));
            var scale_link = function(x) {
                return lin_scale(1, 50, link_min, link_max, x);
            }

            d3.select(".everything").selectAll(".link").remove();

            /*context.svg.append("svg:defs").selectAll("marker")
                .data(links)      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", function(d) {
                    return d.type.reduce((x,y)=>x+y, "");
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 0)
                .attr("refY", 0)
                .attr("stroke", function(d) {
                    return d.type ? nodeTypeScale(d.type) : "none"; //linkTypeScale(d.type);
                })
                .attr("stroke-opacity", function (d) {
                    return d.weight ? (function(x){ return lin_scale(0, 1, link_min, link_max, x) })(d.weight) : 0;
                })
                .attr("stroke-width", "0px")
                .attr("fill", "none")
                .attr("markerWidth", 3)
                .attr("markerHeight", 3)
                .attr("orient", "auto")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");*/

            var link = g.selectAll(".link")
                .data(links)
                .enter().append("svg:path")
                .attr("class", "link")
                /*.attr("marker-end", function(d) {
                    return "url(#"+d.type.reduce((x,y)=>x+y,"")+")"
                })*/
                .style("stroke", function (d) {
                    return d.source.type ? nodeTypeScale(d.source.type) : nodeTypeScale(nodes[d.source].type); //linkTypeScale(d.type);
                })
                .style("stroke-opacity", function (d) {
                    return 1; // d.weight ? (function(x){ return exp_scale(0.3, 1, link_min, link_max, x) })(d.weight) : 1;
                })
                .style("stroke-width", function (d) {
                    return d.weight ? scale_link(d.weight) : 1;
                });
            
            var node = g.selectAll(".node")
                .data(nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", function (d) {
                    return d.n ? scale_node(d.n) : 20;
                })  // radius
                .style("fill", function (d) {
                    return nodeTypeScale(d.type);
                })
                .style("stroke", "#000000")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            node.append("title")
                .text(function (d) {
                    return d.id;
                });

            function dragstarted(d) {
                if (!d3.event.active) context.force.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            function dragended(d) {
                if (!d3.event.active) context.force.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

	    var zoom_handler = d3.zoom()
		.on("zoom", zoom_actions);
	    function zoom_actions(){
		g.attr("transform", d3.event.transform);
	    }
            zoom_handler(context.svg);

            var legendPosition = { x: 0.75 * context.options.innerWidth, y: 0 };

            //Nodes
            //var legendBottom = context.createLegend('legend', nodeTypeScale, legendPosition, 'Cell Types');

            //legendPosition.y = legendBottom.y + 15;
            //Links
            //context.createLegend('legend2', linkTypeScale, legendPosition, 'Synapse Types');
            context.force = d3.forceSimulation()
                .force("charge", (function(){
                    return d3.forceManyBody().strength(context.repulsion);
                }).bind(this)())
                .force("link", d3.forceLink().strength((function(d) {
                    if (d.weight) { if(parseInt(d.weight)<0) { return parseInt(d.weight)/(-1*context.attraction); } else { return parseInt(d.weight)/context.attraction; }} else { return 1/10; }
                }).bind(this)))
                .force("center", d3.forceCenter(context.options.innerWidth / 2, context.options.innerHeight / 2))
                .nodes(nodes);
            
            /*context.force.on("tick", function () {
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
            });*/

            var firstCall = true;
            /*var start = function(node, link) {
                if (firstCall) {
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
                    firstCall = false;
                }
                var ticksPerRender = 10;
                requestAnimationFrame(function render() {
                    for (var i = 0; i < ticksPerRender; i++) {
                        context.force.tick();
                    }
                    link.attr("d", function(d) {
                        //return "M0,-5L10,0L0,5";
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        return "M" +
                            d.source.x + "," +
                            d.source.y + "A" +
                            dr + "," + dr + " 0 0,1 " +
                            d.target.x + "," +
                            d.target.y;
                    });
                    
                    node.attr("cx", function (d) {
                        return d.x;
                    })
                        .attr("cy", function (d) {
                            return d.y;
                        });
                    
                    if (context.force.alpha() > 0) {
                        requestAnimationFrame(render);
                    }
                })
                };*/

             function tick() {
                link.attr("d", function(d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return "M" +
                        d.source.x + "," +
                        d.source.y + "A" +
                        dr + "," + dr + " 0 0,1 " +
                        d.target.x + "," +
                        d.target.y;
                });

                node.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            }

            context.force.on("tick", tick);
            context.force.force("link").links(links);

//            context.force.on("tick", function() { start(node, link); });

            var optionsContainer = $('<div/>', {
		id: context.id + "-options",
                style: 'width:' + context.options.innerWidth + 'px;margin-left: 10px;top:' + context.options.innnerHeight-50 + 'px;',
		class: 'connectivity-options'
	    }).appendTo(context.connectivityContainer);

            var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'float: left;',
		class: 'connectivity-orderby'
	    }).appendTo(optionsContainer);

            var populationCheckbox = $('<input type="checkbox" id="population" name="population" value="population">');
	    if (this.state.population)
		populationCheckbox.attr("checked", "checked");
	    orderContainer.append(populationCheckbox);
	    orderContainer.append($('<label for="population" class="population-label">Show populations</label>'));

	    populationCheckbox.on("change", function (ctx, that) {
		return function () {
		    if (this.checked) {
                        ctx.force.stop();
                        that.state.population = true;
		    }
		    else {
                        ctx.force.stop();
			that.state.population = false;
		    }
		    ctx.createLayout();
                    ctx.force.restart();
		}
	    } (context, this));

        }
    }
});
