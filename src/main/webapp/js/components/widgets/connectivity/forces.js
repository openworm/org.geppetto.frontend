/**
 * Connectivity widget
 */


define(function (require) {
    return {
        state: {population: false},
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

            context.svg.append("svg:defs").selectAll("marker")
                .data(linkTypeScale.domain())      // Different link/path types can be defined here
                .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", function(d) {
                    return d.reduce((x,y)=>x+y, "");
                })
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
                .attr("refY", 0)
                .attr("stroke", function(d) {
                    return linkTypeScale(d);
                })
                .attr("stroke-opacity", 1)
                .attr("stroke-width", "3px")
                .attr("fill", "none")
                .attr("markerWidth", 3)
                .attr("markerHeight", 3)
                .attr("orient", "auto")
                .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");


            context.force = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(-250))
                .force("link", d3.forceLink().id(function (d) { return d.index; }))
                .force("center", d3.forceCenter(context.options.innerWidth / 2, context.options.innerHeight / 2));

	    //add encompassing group for the zoom
	    var g = context.svg.append("g")
		.attr("class", "everything");

            if (this.state.population) {
                var links = context.dataset.populationLinks;
                var nodes = context.dataset.populationNodes;
            } else {
                var links = context.dataset.links;
                var nodes = context.dataset.nodes;
            }

            var link = g.selectAll(".link")
                .data(links)
                .enter().append("svg:path")
                .attr("class", "link")
                .attr("marker-end", function(d) {
                    return "url(#"+d.type.reduce((x,y)=>x+y,"")+")"
                })
                .style("stroke", function (d) {
                    return linkTypeScale(d.type)
                })
                .style("stroke-width", function (d) {
                    return weightScale(d.weight)
                });

            var node_max = Math.max.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));
            var node_min = Math.min.apply(null, nodes.map(n => n.n).filter(x => typeof x != 'undefined'));

            var node_scale = function(r) {
                var min_out = 5; var max_out = 10;
                var x = Math.pow(max_out/min_out, 1/(node_max-node_min));
                var k = min_out/(x**node_min);
                return k*x**r;
            }

            var node = g.selectAll(".node")
                .data(nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", function (d) {
                    return d.n ? node_scale(d.n) : 5;
                })  // radius
                .style("fill", function (d) {
                    return nodeTypeScale(d.type);
                })
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
            var legendBottom = context.createLegend('legend', nodeTypeScale, legendPosition, 'Cell Types');

            legendPosition.y = legendBottom.y + 15;
            //Links
            context.createLegend('legend2', linkTypeScale, legendPosition, 'Synapse Types');

            context.force.nodes(nodes).on("tick", function () {
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
                        that.state.population = true;
		    }
		    else {
			that.state.population = false;
		    }
		    ctx.createLayout();
		}
	    } (context, this));

        }
    }
});
