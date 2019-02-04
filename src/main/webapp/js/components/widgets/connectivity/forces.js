/**
 * Connectivity widget
 */


define(function (require) {
    return {
        attraction: 0.0002,
        repulsion: 5000,
        state: {filter: 'projection', population: true, linkFilter: 0},
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
                context.attraction = 0.0002;
            if (!context.repulsion)
                context.repulsion = 5000;
            
            if (context.dataset.populationLinks.filter(l => !l.weight).length > 0)
                context.populateWeights(context.dataset.populationLinks);

            if (context.dataset.links.filter(l => !l.weight).length > 0)
                context.populateWeights(context.dataset.links);

            if (this.state.population) {
                var links = [];
                for (link of context.dataset.populationLinks)
                    links.push(Object.assign({}, link));   

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
                links = links.filter((function(l) {
                    return Connectivity1.projectionTypeSummary[this.state.filter].indexOf(l.type[0]) > -1;
                }).bind(this));
                var nodes = context.dataset.populationNodes;
            } else {
                var links = context.dataset.links.filter((function(l) {
                    return Connectivity1.projectionTypeSummary[this.state.filter].indexOf(l.type[0]) > -1;
                }).bind(this));
                var nodes = context.dataset.nodes;
            }

            var exp_scale = function(min_out, max_out, min_in, max_in, x) {
                if (max_in == min_in)
                    return (min_out+max_out)/2;
                else {
                    var n = Math.pow(max_out/min_out, 1/(max_in-min_in));
                    var k = min_out/(n**min_in);
                    return k*n**x;
                }
            };

            var lin_scale = function(min_out, max_out, min_in, max_in, x) {
                if (max_in == min_in)
                    return (min_out+max_out)/2;
                var m = (max_out - min_out)/(max_in - min_in);
                return m*(x-max_in)+max_out;
            };

            var node_min = Math.min.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));
            var node_max = Math.max.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));
            var scale_node = function(x) {
                return lin_scale(50, 100, node_min, node_max, x);
            }

            var link_min = Math.min.apply(null, links.map(l => l.weight<0 ? -1*l.weight : l.weight).filter(w => typeof w != 'undefined'));
            var link_max = Math.max.apply(null, links.map(l => l.weight<0 ? -1*l.weight : l.weight).filter(w => typeof w != 'undefined'));
            var scale_link = function(x) {
                return lin_scale(10, 50, link_min, link_max, x);
            }

            d3.select(".everything").selectAll(".link").remove();

            context.svg.append("svg:defs").selectAll("marker")
                .data(links)      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", function(d) {
                    if (d.source.type) {
                        return d.source.type + ',' + d.target.type;
                    } else {
                        return nodes[d.source].type + "," + nodes[d.target].type; //d.type.reduce((x,y)=>x+y, "");
                    }
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", function(d) {
                    return 20;
                    //return d.target.n ? scale_node(d.target.n)/2 : scale_node(nodes[d.target].n)/2;
                    //return d.target.n ? scale_node(d.target.n)/scale_link(links.filter(l=>l.target===d.target && l.source===d.source)[0].weight) : scale_node(nodes[d.target].n)/scale_link(links.filter(l=>l.target===d.target && l.source===d.source)[0].weight);
                })
                .attr("refY", function(d) {
                    return 0; //return d.target.n ? scale_node(d.target.n) : 20;
                })
                .attr("stroke", function(d) {
                    return d.source.type ? nodeTypeScale(d.source.type) : nodeTypeScale(nodes[d.source].type);
                })
                .attr("stroke-opacity", (function (d) {
                    return 1;
                }).bind(this))
                .attr("stroke-width", "1px")
                .attr("fill", function(d) {
                    return d.source.type ? nodeTypeScale(d.source.type) : nodeTypeScale(nodes[d.source].type);
                })
                .attr("markerWidth", (function(d) {
                    var w = d.weight<0 ? -1*d.weight : d.weight;
                    return scale_link(w)>=parseFloat(this.state.linkFilter) ? scale_node(d.target.n ? d.target.n : nodes[d.target].n)-2 : 0; 
                }).bind(this))
                .attr("markerHeight", function(d) {
                    return scale_node(d.target.n ? d.target.n : nodes[d.target].n)-2;
                })
                .attr("orient", "auto")
                .attr("markerUnits", "userSpaceOnUse")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

            var link = g.selectAll(".link")
                .data(links)
                .enter().append("svg:path")
                .attr("class", "link")
                .attr("marker-end", function(d) {
                    if (nodes[d.source].type === nodes[d.target].type)
                        return "none";
                    else if (d.source.type)
                        return "url(#" + d.source.type + "," + d.target.type + ")";
                    else
                        return "url(#"+ nodes[d.source].type + "," + nodes[d.target].type + ")";
                    //return "url(#"+d.type.reduce((x,y)=>x+y,"")+")"
                })
                .style("stroke", function (d) {
                    return d.source.type ? nodeTypeScale(d.source.type) : nodeTypeScale(nodes[d.source].type); //linkTypeScale(d.type);
                })
                .style("stroke-opacity", (function (d) {
                    var w = d.weight<0 ? -1*d.weight : d.weight;
                    return scale_link(w)>=parseFloat(this.state.linkFilter) ? 1 : 0; 
                }).bind(this))
                .style("stroke-width", function (d) {
                    //return 10;
                    return d.weight ? scale_link(d.weight<0 ? -1*d.weight : d.weight) : 1;
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
                    return d3.forceManyBody().strength(-1*context.repulsion);
                }).bind(this)())
                .force("link", d3.forceLink().strength((function(d) {
                    if (d.weight) { if(parseInt(d.weight)<0) { return parseInt(d.weight)*-1*context.attraction; } else { return parseInt(d.weight)*context.attraction; }} else { return 1/10; }
                }).bind(this)))
                .force("center", d3.forceCenter(context.options.innerWidth / 2, context.options.innerHeight / 2))
                .nodes(nodes);
            
             function tick() {
                 link.attr("d", function(d) {
                     var x1 = d.source.x,
                         y1 = d.source.y,
                         x2 = d.target.x,
                         y2 = d.target.y,
                         dx = x2 - x1,
                         dy = y2 - y1,
                         dr = Math.sqrt(dx * dx + dy * dy)/0.5,
                         drx = dr,
                         dry = dr,
                         xRotation = 0, // degrees
                         largeArc = 0, // 1 or 0
                         sweep = 1; // 1 or 0

                     // Self edge.
                     if ( x1 === x2 && y1 === y2 ) {
                         // Fiddle with this angle to get loop oriented.
                         xRotation = -45;

                         // Needs to be 1.
                         largeArc = 1;

                         // Change sweep to change orientation of loop. 
                         //sweep = 0;

                         // Make drx and dry different to get an ellipse
                        // instead of a circle.
                        drx = 150;
                        dry = 150;

                        // For whatever reason the arc collapses to a point if the beginning
                        // and ending points of the arc are the same, so kludge it.
                        x2 = x2 + 1;
                        y2 = y2 + 1;
                    } 

                     return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
                    /*return "M" +
                        d.source.x + "," +
                        d.source.y + "A" +
                        dr + "," + dr + " 0 0,1 " +
                        d.target.x + "," +
                        d.target.y;*/
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
                //style: 'width:' + context.options.innerWidth + 'px;margin-left: 10px;top:' + context.options.innnerHeight-50 + 'px;',
                style: 'margin-left: 10px;top:' + context.options.innerHeight-50 + 'px;',
		class: 'connectivity-options'
	    }).appendTo(context.connectivityContainer);

            var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'float: left;',
		class: 'connectivity-orderby'
	    }).appendTo(optionsContainer);

            
            // connection type selector
            var typeOptions = {
		'projection': 'Chemical',
		'gapJunction': 'Gap Junctions',
		'continuousProjection': 'Continuous'
	    };

	    var typeContainer = $('<div/>', {
		id: context.id + '-type',
                style: 'float: left; width: 70%; margin-left: 1.6em',
		//style: 'position: absolute; width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 80) + 'px;',
		class: 'types'
	    }).appendTo(optionsContainer);

	    var typeCombo = $('<select/>', {
                style: 'margin-left: 0.5em;'
            });
	    $.each(typeOptions, (function (k, v) {
		$('<option/>', { value: k, text: v, disabled: (context.projectionTypeSummary[k].length == 0) }).appendTo(typeCombo);
	    }).bind(this));
            typeCombo.val(this.state.filter);
	    typeContainer.append($('<span/>', {
		id: 'type-selector',
		class: 'type-selector-label',
		text: 'Projection Filter:'
	    }).append(typeCombo));

	    typeCombo.on("change", function(ctx, that) {
                return function () {
                    that.state.filter = this.value;
                    ctx.createLayout(that.state);
                }
            } (context, this));


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

            
            var attractionSlide = $('<input type="range" max="0.001" min="0.00001" step="1e-9" id="attraction" name="attraction" value="0.0002">');
	    if (context.attraction)
		attractionSlide.attr("value", context.attraction);
            attractionSlide.on("change", function(ctx, that) {
                return function() {
                    ctx.attraction = this.value;
                    ctx.createLayout();
                }
            } (context, this));
	    typeContainer.append(attractionSlide);
	    typeContainer.append($('<label for="attraction" class="attraction-label">Link Strength</label>'));

            var repulsionSlide = $('<input type="range" min="1000" max="100000" id="repulsion" name="repulsion" value="5000">');
	    if (context.repulsion)
		repulsionSlide.attr("value", context.repulsion);
            repulsionSlide.on("change", function(ctx, that) {
                return function() {
                    ctx.repulsion = this.value;
                    ctx.createLayout();
                }
            } (context, this));
	    typeContainer.append(repulsionSlide);
            typeContainer.append($('<label for="repulsion" class="repulsion-label">Node Repulsion</label>'));

            var linkSlide = $('<input type="range" min="' + (scale_link(link_min)-2) + '" max="' + (scale_link(link_max)+2) + '" id="link" name="link" value="' + (scale_link(link_min)-2) + '">');
	    if (this.state.linkFilter)
		linkSlide.attr("value", this.state.linkFilter);
            linkSlide.on("change", function(ctx, that) {
                return function() {
                    that.state.linkFilter = this.value;
                    ctx.createLayout();
                }
            } (context, this));
	    typeContainer.append(linkSlide);
            typeContainer.append($('<label for="link" class="link-label">Show links</label>'));
        }
    }
});
