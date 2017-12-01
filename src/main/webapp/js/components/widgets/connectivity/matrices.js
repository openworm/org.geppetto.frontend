/**
 * Connectivity widget
 */
define(function (require) {

    return {
	createMatrixLayout: function (context) {
	    var d3 = require("d3");

	    var margin = { top: 45, right: 10, bottom: 10, left: 15 };
	    var legendWidth = 120;

	    var matrixDim = (context.options.innerHeight < (context.options.innerWidth - legendWidth)) ? (context.options.innerHeight) : (context.options.innerWidth - legendWidth);

	    var x = d3.scaleBand().range([0, matrixDim - margin.top]),
		// Opacity
		z = d3.scaleLinear().domain([0, 4]).clamp(true),
		// Colors
		c = d3.scaleOrdinal(d3.schemeCategory10);

	    var labelTop = margin.top - 25;
            var defaultTooltipText = "Hover the squares to see the connections.";
	    var tooltip = context.svg
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + labelTop + ")")
		.append("text")
		.attr('class', 'connectionlabel')
		.text(defaultTooltipText);

	    var container = context.svg
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	    var matrix = [];
	    var nodes = context.dataset.nodes;
	    var root = context.dataset.root;
	    var n = nodes.length;

	    // Compute index per node.
	    nodes.forEach(function (node, i) {
		node.pre_count = 0;
		node.post_count = 0;
		matrix[i] = d3.range(n).map(function (j) {
		    return { x: j, y: i, z: 0 };
		});
	    });

	    // Convert links to matrix; count pre / post conns.
	    context.dataset.links.forEach(function (link) {
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

	    var rect = container
		.append("rect")
		.attr("class", "background")
		.attr("width", matrixDim - margin.left - 30)
		.attr("height", matrixDim - margin.top);

            // we store the 'conn' key in case we want to
            // eg. conditionally colour the indicator if there
            // are actually connections in that row/column
            var pre = nodes.map(function(x,i) { return {id: x.id, conn: matrix[i].filter(function(d) { return d.z; }).length > 0}});
            var matrixT = matrix[0].map(function(col, i) {
                return matrix.map(function(row) {
                    return row[i];
                })
            });
            var post = nodes.map(function(x,i) { return {id: x.id, conn: matrixT[i].filter(function(d) { return d.z; }).length > 0}});

            var popNameFromId = function(id) {
                return eval(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(id)[0]).getParent().getName();
            };

            var mouseoverCell = function(msg) {
		d3.select(this.parentNode.appendChild(this)).transition().duration(100).
		    style('stroke-opacity', 1).style('stroke', 'white').style('stroke-width', 2);
		d3.select("body").style('cursor', 'pointer');
		return tooltip.transition().duration(100).text(msg);
            }

            var mouseoutCell = function() {
		d3.select(this).transition().duration(100).style('stroke-opacity', 0).style('stroke', 'white');
		d3.select("body").style('cursor', 'default');
		return tooltip.text(defaultTooltipText);
	    };

            var popIndicator = function(pos, colormap, w, h) {
                return function(d,i) {
                    d3.select(this).selectAll(".cell")
                        .data(d)
			.enter().append("rect")
			.attr("class", "cell")
			.attr(pos, function (d, i) {
			    return x(i);
			})
			.attr("width", w)
		        .attr("height", h)
			.attr("title", function (d) {
			    return d.id;
			})
			.style("fill", function (d) {
                            return colormap(popNameFromId(d.id));
			})
                        .style("stroke", function (d) {
                            return colormap(popNameFromId(d.id));
			})
                        .on("mouseover", function(d){ $.proxy(mouseoverCell, this)(popNameFromId(d.id)) })
			.on("mouseout", $.proxy(mouseoutCell))
                };
            };

            var colormap = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);
            var postMargin = parseInt(rect.attr("width"))/pre.length;
            var preMargin = parseInt(rect.attr("height"))/post.length;

            var postPop = container.selectAll(".postPop")
                .data([post])
                .enter()
                .append("g")
                .attr("class", "postPop")
                .attr("transform", "translate(0,-10)")
                .each(popIndicator("x", colormap, postMargin, 5));
            var prePop = container.selectAll(".prePop")
                .data([pre])
                .enter()
                .append("g")
                .attr("class", "prePop")
                .attr("transform", "translate(-10,0)")
                .each(popIndicator("y", colormap, 5, preMargin));

	    var row = container.selectAll(".row")
		.data(matrix)
		.enter().append("g")
		.attr("class", "row")
		.attr("transform", function (d, i) {
		    return "translate(0," + x(i) + ")";
		})
		.each(row);

	    row.append("line")
		.attr("x2", context.options.innerWidth);

	    var column = container.selectAll(".column")
		.data(matrix)
		.enter().append("g")
		.attr("class", "column")
		.attr("transform", function (d, i) {
		    return "translate(" + x(i) + ")rotate(-90)";
		});

	    column.append("line")
		.attr("x1", -context.options.innerWidth);

	    context.createLegend('legend', colormap, { x: matrixDim, y: 0 });

	    //Sorting matrix entries by criteria specified via combobox
	    var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 32) + 'px;',
		class: 'connectivity-ordering'
	    }).appendTo(context.connectivityContainer);

	    var orderCombo = $('<select/>');
	    $.each(sortOptions, function (k, v) {
		$('<option/>', { value: k, text: v }).appendTo(orderCombo);
	    });
	    orderContainer.append($('<span/>', {
		id: 'matrix-sorter',
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

                    t.selectAll(".postPop .cell")
			.delay(function (d, i) {
			    return x(i) * 4;
			})
			.attr("x", function (d, i) {
			    return x(i);
			});

                    t.selectAll(".prePop .cell")
			.delay(function (d, i) {
			    return x(i) * 4;
			})
			.attr("y", function (d, i) {
			    return x(i);
			});

		    t.selectAll(".column")
			.delay(function (d, i) {
			    return x(i) * 4;
			})
			.attr("transform", function (d, i) {
			    return "translate(" + x(i) + ")rotate(-90)";
			});
		}
	    } (context.svg));

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
		    .attr("width", x.bandwidth())
		    .attr("height", x.bandwidth())
		    .attr("title", function (d) {
			return d.id;
		    })
			//.style("fill-opacity", function(d) { return z(d.z); })
		    .style("fill", function (d) {
			return c(d.z);
		    })
		    .on("click", function (d) {
			GEPPETTO.SceneController.deselectAll();
			//Ideally instead of hiding the connectivity lines we'd show only the ones connecting the two cells, also we could higlight the connection.
			eval(root.getId() + "." + nodes[d.x].id).select();
			eval(root.getId() + "." + nodes[d.x].id).showConnectionLines(false);
			eval(root.getId() + "." + nodes[d.y].id).select();
			eval(root.getId() + "." + nodes[d.y].id).showConnectionLines(false);
		    })
		    .on("mouseover", function (d) { $.proxy(mouseoverCell, this)(nodes[d.y].id + " is connected to " + nodes[d.x].id); })
		    .on("mouseout", $.proxy(mouseoutCell));
	    }
	}
    }

});
