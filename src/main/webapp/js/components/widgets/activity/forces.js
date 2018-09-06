/**
 * Connectivity widget
 */


define(function (require) {
    return {
        createForceLayout: function (context) {
            var d3 = require("d3");
            var _ = require('underscore');

            //TODO: 10/20 categories hardcoded in color scales
            var linkTypeScale = d3.scaleOrdinal(d3.schemeCategory10)
                .domain(context.dataset.linkTypes);
            var nodeTypeScale = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);
            var weightScale = d3.scaleLinear()
                .domain(d3.extent(_.pluck(context.dataset.links, 'weight').map(parseFloat)))
                //TODO: think about weight = 0 (do we draw a line?)
                .range([0.5, 4]);

            context.force = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(-250))
                .force("link", d3.forceLink().id(function (d) { return d.index; }))
                .force("center", d3.forceCenter(context.options.innerWidth / 2, context.options.innerHeight / 2));

	    //add encompassing group for the zoom
	    var g = context.svg.append("g")
		.attr("class", "everything");

            var link = g.selectAll(".link")
                .data(context.dataset.links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke", function (d) {
                    return linkTypeScale(d.type)
                })
                .style("stroke-width", function (d) {
                    return weightScale(d.weight)
                });

            var node = g.selectAll(".node")
                .data(context.dataset.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)  // radius
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

            context.force.nodes(context.dataset.nodes).on("tick", function () {
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
            context.force.force("link").links(context.dataset.links);
        }
    }
});