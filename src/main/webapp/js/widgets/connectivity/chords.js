/**
 * Connectivity widget
 */


chords = {
	createChordLayout : function (context) {
		var matrix = this.generateChordMatrix(context);

	    var innerRadius = Math.min(context.options.innerWidth, context.options.innerHeight) * .41,
	        outerRadius = innerRadius * 1.05;

	    var fill = d3.scale.category20b()
	        .domain(d3.range(context.dataset.nodeTypes.length));

	    var svg = context.svg.append("g")
	        .attr("transform", "translate(" + context.options.innerWidth / 2 + "," + context.options.innerHeight / 2 + ")");

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

	generateChordMatrix : function (context) {
	    var matrix = [];

	    var type2type = {};

	    // {type_i: {postType_j: counts, ...}, ...}
	    var typesZeros = _.map(context.dataset.nodeTypes, function (type) {
	        return [type, 0]
	    });
	    context.dataset.nodeTypes.forEach(function (type) {
	        var initCounts = _.object(typesZeros);
	        var linksFromType = _.filter(context.dataset.links, function (link) {
	            return context.dataset.nodes[link.source].type === type
	        });
	        type2type[type] = _.extend(initCounts, _.countBy(linksFromType, function (link) {
	            return context.dataset.nodes[link.target].type
	        }));
	    });

	    var numNodesOfType = _.countBy(context.dataset.nodes, function (node) {
	        return node.type
	    });
	    //unconnected nodes of all types
	    var discNodes = _.filter(context.dataset.nodes, function (node) {
	        return node.degree == 0
	    });
	    var numDiscByType = _.countBy(discNodes, function (node) {
	        return node.type
	    });

	    context.dataset.nodeTypes.forEach(function (type, idx, nodeTypes) {
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
	    for (var i = 0; i <= context.dataset.nodeTypes.length; i++) {
	        zeroes.push(0)
	    }
	    matrix.push(zeroes);
	    return matrix;
	}
}