/**
 * Connectivity widget
 */


forces = {
    createForceLayout: function (context) {

            //TODO: 10/20 categories hardcoded in color scales
            var linkTypeScale = d3.scale.category10()
                .domain(context.dataset.linkTypes);
            var nodeTypeScale = d3.scale.category20()
                .domain(context.dataset.nodeTypes);
            var weightScale = d3.scale.linear()
                .domain(d3.extent(_.pluck(context.dataset.links, 'weight').map(parseFloat)))
                //TODO: think about weight = 0 (do we draw a line?)
                .range([0.5, 4]);

            context.force = d3.layout.force()
                .charge(-250)
                .linkDistance(150)
                .size([context.options.innerWidth, context.options.innerHeight]);

            context.force.nodes(context.dataset.nodes)
                .links(context.dataset.links)
                .start();

            var link = context.svg.selectAll(".link")
                .data(context.dataset.links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke", function (d) {
                    return linkTypeScale(d.type)
                })
                .style("stroke-width", function (d) {
                    return weightScale(d.weight)
                });

            var node = context.svg.selectAll(".node")
                .data(context.dataset.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)  // radius
                .style("fill", function (d) {
                    return nodeTypeScale(d.type);
                })
                .call(context.force.drag);

            node.append("title")
                .text(function (d) {
                    return d.id;
                });

            context.force.on("tick", function () {
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

            var legendPosition = {x: 0.75 * context.options.innerWidth, y: 0};

            //Nodes
            var legendBottom = context.createLegend('legend', nodeTypeScale, legendPosition, 'Cell Types');

            legendPosition.y = legendBottom.y + 15;
            //Links
            context.createLegend('legend2', linkTypeScale, legendPosition, 'Synapse Types');
        }
}