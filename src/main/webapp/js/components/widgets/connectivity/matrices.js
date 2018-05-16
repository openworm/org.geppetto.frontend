/**
 * Connectivity widget
 */
define(function (require) {
    var d3 = require("d3");
    var d3Scale = require("d3-scale");
    return {
	weight: false,
	linkColormaps: {},
	projectionSummary: {},
	getProjectionSummary: function() {
	    var projSummary = {};
	    var projs = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.projection);
	    for (var i=0; i<projs.length; ++i) {
		var proj = projs[i];
		if (proj.getMetaType() === GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
		    // too convoluted, could we have model interpreter return the synapse at a stable path, like post/presynapticPopulation?
		    var synapse = proj.getVariables().filter((x)=> {
			if (typeof x.getType().getSuperType().getPath === 'function')
			    return x.getType().getSuperType().getPath() === "Model.neuroml.synapse"
		    })[0];
		    // synapse undefined here => electrical projection, since currently the synapse attr is not given in the
		    // <electricalProjection/> tag but in the <electricalConnectionInstance(W)/> tag.
		    // in any case, we are currently ignoring electrical projections, but FIXME
		    if (typeof synapse === 'undefined')
			continue;
		    else {
			var preId = proj.presynapticPopulation.pointerValue.getWrappedObj().path.split('(')[0];
			var postId = proj.postsynapticPopulation.pointerValue.getWrappedObj().path.split('(')[0];
			var data = {id: proj.getId(), synapse: synapse, pre: proj.presynapticPopulation, post: proj.postsynapticPopulation};
			if (typeof projSummary[[preId, postId]] === 'undefined')
			    projSummary[[preId, postId]] = [data];
			else
			    projSummary[[preId, postId]].push(data);
		    }
		}
	    }
	    return projSummary;
	},
	linkSynapse: function (conn) {
	    if (typeof this.projectionSummary === 'undefined' || Object.keys(this.projectionSummary).length === 0)
		this.projectionSummary = this.getProjectionSummary();
	    var preId = conn.getA().getPath().split("[")[0];
	    var postId = conn.getB().getPath().split("[")[0];
	    if (typeof this.projectionSummary[[preId, postId]] !== 'undefined')
		return this.projectionSummary[[preId, postId]]
		.map(p => p.synapse)
		.filter(s => typeof s !== 'undefined');
	    else
		return [];
        },
	linkWeight: function (conn) {
	    if (this.linkSynapse(conn).length > 0) {
		var weightIndex = conn.getInitialValues().map(x => x.value.eClass).indexOf("Text");
		var weight = 1;
		if (weightIndex > -1)
		    weight = parseFloat(conn.getInitialValues()[weightIndex].value.text);
		var gbases = this.linkSynapse(conn).map(c => (typeof c.getType().gbase !== 'undefined') ? c.getType().gbase : 1);
		var scale = gbases.map(g => { if (typeof g.getUnit === 'function' && g.getUnit() === 'S') { return 1e9; } else { return 1; } });
		return gbases.map((g, i) => {
		    if (typeof g.getInitialValue === 'function')
			return weight * scale[i] * g.getInitialValue();
		    else
			return weight * scale[i] * g;
		}).reduce((x,y) => x+y, 0);
	    }
	    else
		return 0;
	},
	linkErev: function (conn) {
	    if (this.linkSynapse(conn).length > 0) {
		var erevs = this.linkSynapse(conn).map(c => (typeof c.getType().erev !== 'undefined') ? c.getType().erev : 1);
		var scale = erevs.map(e => { if (typeof e.getUnit === 'function' && e.getUnit() === 'V') { return 1e3; } else { return 1; } });
		return erevs.map((e, i) => {
		    if (typeof e.getInitialValue === 'function')
			return scale[i] * e.getInitialValue();
		    else
			return scale[i] * e;
		}).reduce((x,y) => x+y, 0);
	    }
	    else
		return 0;
	},
	populateWeights: function(links) {
	    for (var i in links) {
		links[i].weight =  this.linkWeight(links[i].conn);
		links[i].erev = this.linkErev(links[i].conn);
	    }
	},
	weightColormaps: function(links) {
	    var exc_threshold = -70; // >-70 mV => excitatory
	    var exc_conns = links.filter(l => (l.erev >= exc_threshold) && (l.weight >= 0));
	    var inh_conns = links.filter(l => (l.erev < exc_threshold) || (l.weight < 0));
	    var weights_exc = Array.from(new Set(exc_conns.map(c => c.weight))).filter(x => x != 0);
	    var weights_inh = Array.from(new Set(inh_conns.map(c => (c.weight >= 0) ? c.weight : -1*c.weight))).filter(x => x != 0);
	    var colormaps = {};
	    var baseColormap = d3.scaleLinear()
		.range([d3.cubehelix(0, 1, 0.5), d3.cubehelix(240, 1, 0.5)])
		.interpolate(d3.interpolateCubehelixLong);
	    if (weights_exc.length > 0) {
		var min_exc = Math.min.apply(null, weights_exc);
		var max_exc = Math.max.apply(null, weights_exc);
		colormaps.exc = baseColormap.copy().domain([min_exc, max_exc]);
	    }
	    if (weights_inh.length > 0) {
		var min_inh = Math.min.apply(null, weights_inh);
		var max_inh = Math.max.apply(null, weights_inh);
		colormaps.inh = baseColormap.copy().domain([min_inh, max_inh]);
	    }
	    return colormaps;
	},
	createMatrixLayout: function (context) {
	    var d3 = require("d3");

	    var margin = { top: 45, right: 10, bottom: 10, left: 25 };
	    var legendWidth = context.legendWidth;

	    var matrixDim = (context.options.innerHeight < (context.options.innerWidth - legendWidth)) ? (context.options.innerHeight) : (context.options.innerWidth - legendWidth);

	    var x = d3.scaleBand().range([0, matrixDim - margin.top]);
	    var z = d3.scaleLinear().domain([0, 4]).clamp(true);

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

            var legendDiv = context.svg.append('div').attr('class', 'legend');
            //var legendDiv = d3.select('#' + this.id).append('div').attr('class', 'legend');

	    var matrix = [];
	    var nodes = context.dataset.nodes;
            var links = context.dataset.links;
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
	    context.dataset.links.forEach((function (link) {
		//TODO: think about zero weight lines
		//matrix[link.source][link.target].z = link.weight ? link.type : 0;
		if (this.weight) {
		    matrix[link.source][link.target].z = link.weight;
		    matrix[link.source][link.target].type = link.erev >= -70 ? 'exc' : 'inh';
		}
		else {
		    matrix[link.source][link.target].z = link.type;
		    delete matrix[link.source][link.target].type;
		}
		nodes[link.source].pre_count += 1;
		nodes[link.target].post_count += 1;
	    }).bind(this));

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
		.attr("width", matrixDim - margin.left - 20)
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
                return id.split('[')[0];
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

            var nodeColormap = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);
	    this.linkColormaps = (function() {
		if (this.weight)
		    return this.weightColormaps(context.dataset.links);
		else
		    return d3.scaleOrdinal(d3.schemeCategory10).domain(Array.from(new Set(context.dataset.links.map(x => x.type))));
	    }).bind(this)();

            var postMargin = parseInt(rect.attr("width"))/pre.length;
            var preMargin = parseInt(rect.attr("height"))/post.length;
	    var popIndicatorSize = 10;

            var postPop = container.selectAll(".postPop")
                .data([post])
                .enter()
                .append("g")
                .attr("class", "postPop")
                .attr("transform", "translate(0,-20)")
                .each(popIndicator("x", nodeColormap, postMargin, popIndicatorSize));

            var prePop = container.selectAll(".prePop")
                .data([pre])
                .enter()
                .append("g")
                .attr("class", "prePop")
                .attr("transform", "translate(-20,0)")
                .each(popIndicator("y", nodeColormap, popIndicatorSize, preMargin));

	    var rowFn = row(this.linkColormaps);
	    var row = container.selectAll(".row")
		.data(matrix)
		.enter().append("g")
		.attr("class", "row")
		.attr("transform", function (d, i) {
		    return "translate(0," + x(i) + ")";
		})
		.each(rowFn);

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

	    context.createLegend('legend', nodeColormap, { x: matrixDim, y: 0 });
	    if (this.weight) createWeightLegend(this.linkColormaps);

	    function linspace(start, end, n) {
		var out = [];
		var delta = (end - start) / (n - 1);

		var i = 0;
		while(i < (n - 1)) {
		    out.push(start + (i * delta));
		    i++;
		}

		out.push(end);
		return out;
	    }

	    function createWeightLegend(linkColormaps) {
		var i = 0;
		for (var type in linkColormaps) {
		    var legendFullHeight = 400;
		    var legendFullWidth = 50;
		    var legendMargin = { top: 20, bottom: 20, left: 80, right: 30 };
		    var legendWidth = 20;
		    var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

		    var x = context.options.innerWidth - (legendMargin.left*(i+1));
		    var y = legendMargin.top;
		    var legend = context.svg
			.append('g')
			.attr('width', legendFullWidth)
			.attr('height', legendFullHeight)
			.attr('transform', 'translate(' + [x,y] + ')');

		    var gradient = legend.append('defs')
			.append('linearGradient')
			.attr('id', 'gradient')
			.attr('x1', '0%')
			.attr('y1', '100%')
			.attr('x2', '0%')
			.attr('y2', '0%')
			.attr('spreadMethod', 'pad');

		    // programatically generate the gradient for the legend
		    // this creates an array of [pct, colour] pairs as stop
		    // values for legend
		    var resolution = 100;
		    var pct = linspace(0, 100, resolution).map(function(d) {
			return Math.round(d) + '%';
		    });

		    var colors = [];
		    var start = linkColormaps[type].domain()[0];
		    var end = linkColormaps[type].domain()[1];
		    var inc = (end-start)/resolution;
		    var n = start;
		    for (var j=0; j<resolution; ++j) {
			colors.push(linkColormaps[type](n));
			n += inc;
		    }
		    var colourPct = d3.zip(pct, colors.reverse());

		    colourPct.forEach(function(d) {
			gradient.append('stop')
			    .attr('offset', d[0])
			    .attr('stop-color', d[1])
			    .attr('stop-opacity', 1);
		    });

		    legend.append('rect')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('width', legendWidth)
			.attr('height', legendHeight)
			.style('fill', 'url(#gradient)');

		    // create a scale and axis for the legend
		    var legendScale = d3.scaleLinear()
			.domain(linkColormaps[type].domain())
			.range([0, 360]);

		    var legendAxis;
		    if (i == 0)
			legendAxis = d3.axisRight(legendScale);
		    else
			legendAxis = d3.axisLeft(legendScale);
		    // FIXME: don't hardcode number of ticks
		    legendAxis.ticks(10).tickFormat(d3.format(".1e"));

		    legend.append("g")
			.attr('height', legendHeight)
			.attr("class", "legend-axis")
			.attr("transform", "translate(" + (i==0 ? legendWidth : 0) + ", 0)")
			.call(legendAxis);

		    legend.append("text")
			.attr('class', 'weight-legend-label')
			.attr('width', 20)
			.attr('height', 20)
			.text(type);

                    // append unit, would be tidier to have both scalebars in a parent <g/>
                    if (i == 0) {
                        legend.append("text")
			.attr('class', 'weight-legend-label')
			.attr('width', 20)
			.attr('height', 20)
                        .attr('transform', 'translate(-18, 375)')
			.text("nS");
                    }

		    i+=0.5;
		}

	    }

	    //Sorting matrix entries by criteria specified via combobox
	    var optionsContainer = $('<div/>', {
		id: context.id + "-options",
		style: 'width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 32) + 'px;',
		class: 'connectivity-options'
	    }).appendTo(context.connectivityContainer);
	    var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 32) + 'px;',
		class: 'connectivity-ordering'
	    }).appendTo(optionsContainer);

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

	    // toggle weight scheme
	    var schemeContainer = $('<div/>', {
		id: context.id + '-weight',
		style: 'position: absolute; width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 58) + 'px;',
		class: 'weights'
	    }).appendTo(optionsContainer);

	    var weightCheckbox = $('<input type="checkbox" id="weightScheme" name="weight" value="weight">');
	    if (this.weight)
		weightCheckbox.attr("checked", "checked");
	    schemeContainer.append(weightCheckbox);
	    schemeContainer.append($('<label for="weightScheme" class="weight-label">Show weights</label>'));
	    
	    weightCheckbox.on("change", function (ctx, that) {
		return function () {
		    if (this.checked) {
			if (Object.keys(that.projectionSummary).length == 0) {
			    that.projectionSummary = that.getProjectionSummary();
			    that.populateWeights(ctx.dataset.links);
			}
                        ctx.setSize(ctx.size.height, ctx.size.width + 100);
			that.weight = true;
			that.linkColormaps = that.weightColormaps(ctx.dataset.links);
		    }
		    else {
                        ctx.setSize(ctx.size.height, ctx.size.width - 100);
			that.weight = false;
			ctx.nodeColormap = ctx.defaultColorMapFunction();
		    }
		    $('#' + ctx.id + "-weight").remove();
		    ctx.createLayout();
		}
	    } (context, this));

	    // Draw squares for each connection
	    function row(linkColormaps) {
		return function(row) {
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
			if (typeof d.type !== 'undefined')
			    return linkColormaps[d.type](d.z);
			else
			    return linkColormaps(d.z);
		    })
		    .style("stroke", function (d) {
			if (typeof d.type !== 'undefined')
			    return linkColormaps[d.type](d.z);
			else
			    return linkColormaps(d.z);
		    })
		    .on("click", function (d) {
			GEPPETTO.SceneController.deselectAll();
			//Ideally instead of hiding the connectivity lines we'd show only the ones connecting the two cells, also we could higlight the connection.
			eval(root.getId() + "." + nodes[d.x].id).select();
			eval(root.getId() + "." + nodes[d.x].id).showConnectionLines(false);
			eval(root.getId() + "." + nodes[d.y].id).select();
			eval(root.getId() + "." + nodes[d.y].id).showConnectionLines(false);
		    })
		    .on("mouseover", function (d) {
                        var source_id = d.y;
                        var target_id = d.x;
                        var cweight = links.filter(l => l.source==source_id && l.target==target_id)[0].weight;
                        var weightStr = "";
                        if (typeof cweight !== 'undefined')
                            weightStr = " (weight≈" + Math.round(cweight*100)/100 + ", " + d.type + ")";
                        $.proxy(mouseoverCell, this)(nodes[d.y].id + " is connected to " + nodes[d.x].id + weightStr);
                    })
		    .on("mouseout", $.proxy(mouseoutCell));
		}
	    }
	}
    }

});
