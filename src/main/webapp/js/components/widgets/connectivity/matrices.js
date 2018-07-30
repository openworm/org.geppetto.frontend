/**
 * Connectivity widget
 */
define(function (require) {
    var d3 = require("d3");
    var d3Scale = require("d3-scale");
    var Widget = require('../Widget');
    return {
	weight: false,
        filter: 'projection',
	linkColormaps: {},
	projectionSummary: {},
        projectionTypeSummary: {'projection': [], 'continuousProjection': [], 'gapJunction': []},
	getProjectionSummary: function() {
	    var projSummary = {};
	    var projs = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.projection);
	    for (var i=0; i<projs.length; ++i) {
		var proj = projs[i];
		if (proj.getMetaType() === GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
		    // FIXME: too convoluted, could we have model interpreter return the synapse at a stable path, like post/presynapticPopulation?
		    var synapse = proj.getVariables().filter((x)=> {
			if (typeof x.getType().getSuperType().getPath === 'function')
			    return x.getType().getSuperType().getPath() === "Model.neuroml.synapse"
		    })[0];
		    if (typeof synapse === 'undefined')
			continue;
		    else {
                        var pairs = proj.getChildren().filter(x=> typeof x.getA === 'function').map(x => [x.getA().getElements()[0].index,x.getB().getElements()[0].index]);
			var preId = proj.presynapticPopulation.pointerValue.getWrappedObj().path.split('(')[0];
			var postId = proj.postsynapticPopulation.pointerValue.getWrappedObj().path.split('(')[0];
                        // FIXME: type should not be stored in name, also hacky gapJunction detection. need to fix in model interpreter.
                        var type = (synapse.types[0].conductance && !synapse.types[0].erev) ? "gapJunction" : proj.getName();
                        if (this.projectionTypeSummary[type].indexOf(synapse.getId()) == -1)
                            this.projectionTypeSummary[type].push(synapse.getId())
			var data = {id: proj.getId(), type: type, synapse: synapse, pre: proj.presynapticPopulation, post: proj.postsynapticPopulation, pairs: pairs};
			if (typeof projSummary[[preId, postId]] === 'undefined')
			    projSummary[[preId, postId]] = [data];
			else
			    projSummary[[preId, postId]].push(data);
		    }
		}
	    }
	    return projSummary;
	},
        selectConn: function(conns, filter) {
            if (filter === 'gapJunction')
                filter = 'electricalProjection';
            return conns.filter(x=>x.getParent().getName()===filter)[0];
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
	linkWeight: function (conns, filter) {
	    if (this.linkSynapse(conns[0]).length > 0) {
                var synapses = this.linkSynapse(conns[0]).filter(x=>this.projectionTypeSummary[filter].indexOf(x.getId())>-1);
                var conn = this.selectConn(conns, filter);
		var weightIndex = conn.getInitialValues().map(x => x.value.eClass).indexOf("Text");
		var weight = 1;
		if (weightIndex > -1)
		    weight = parseFloat(conn.getInitialValues()[weightIndex].value.text);
		var gbases = synapses.map(c => (typeof c.getType().gbase !== 'undefined') ? c.getType().gbase : 1);
		var scale = gbases.map(g => { if (typeof g.getUnit === 'function' && g.getUnit() === 'S') { return 1e9; } else { return 1; } });
		return gbases.map((g, i) => {
		    return weight * scale[i] * 1;
		}).reduce((x,y) => x+y, 0);
	    }
	    else
		return 0;
	},
	linkErev: function (conns, filter) {
	    if (this.linkSynapse(conns[0]).length > 0) {
                var synapses = this.linkSynapse(conns[0]).filter(x=>this.projectionTypeSummary[filter].indexOf(x.getId())>-1);
		var erevs = synapses.map(c => (typeof c.getType().erev !== 'undefined') ? c.getType().erev : 1);
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
        linkGbase: function(conns, filter) {
            if (this.linkSynapse(conns[0]).length > 0) {
                var synapses = this.linkSynapse(conns[0]).filter(x=>this.projectionTypeSummary[filter].indexOf(x.getId())>-1);
                var gbases = synapses.map(c => (typeof c.getType().gbase !== 'undefined') ? c.getType().gbase : c.getType().conductance);
                var scale = gbases.map(g => { if (typeof g.getUnit === 'function' && g.getUnit() === 'S') { return 1e9; } else { return 1; } });
                var conn = this.selectConn(conns, filter);
                var weightIndex = conn.getInitialValues().map(x => x.value.eClass).indexOf("Text");
		var weight = 1;
		if (weightIndex > -1)
		    weight = parseFloat(conn.getInitialValues()[weightIndex].value.text);
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
	populateWeights: function(links, filter) {
	    for (var i in links) {
                if (links[i].type.filter(t=>this.projectionTypeSummary[filter].indexOf(t)>-1).length > 0) {
		    links[i].weight = this.linkWeight(links[i].conns, filter);
                    links[i].erev = this.linkErev(links[i].conns, filter);
                    links[i].gbase = this.linkGbase(links[i].conns, filter);
                } else {
                    links[i].weight = undefined;
                    links[i].erev = undefined;
                    links[i].gbase = undefined;
		}
	    }
	},
	weightColormaps: function(links, filter) {
	    var exc_threshold = -70; // >-70 mV => excitatory
	    var exc_conns = links.filter(l => (l.erev >= exc_threshold) && (l.gbase >= 0));
	    var inh_conns = links.filter(l => (l.erev < exc_threshold) || (l.gbase < 0));
	    var weights_exc = Array.from(new Set(exc_conns.map(c => c.gbase))).filter(x => x != undefined);
	    var weights_inh = Array.from(new Set(inh_conns.map(c => (c.gbase >= 0) ? c.gbase : -1*c.gbase))).filter(x => x != undefined);
	    var colormaps = {};
	    var baseColormap = d3.scaleLinear()
		.range([d3.cubehelix(240, 1, 0.5), d3.cubehelix(0, 1, 0.5)])
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

	    var margin = { top: 45, right: 10, bottom: 50, left: 25 };
	    var legendWidth = 120;

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

	    var matrix = [];
	    var nodes = context.dataset.nodes;
            var links = context.dataset.links;
	    var root = context.dataset.root;
	    var n = nodes.length;

            //if (Object.keys(this.projectionSummary).length == 0)
            this.projectionSummary = this.getProjectionSummary();
            this.populateWeights(context.dataset.links, this.filter);
                
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
                var Aindex = link.conns[0].getA().getElements()[0].getIndex();
                var Bindex = link.conns[0].getB().getElements()[0].getIndex();
                var proj = this.projectionSummary[link.conns[0].getA().getPath().substr(0,link.conns[0].getA().getPath().indexOf("[")) + ',' + link.conns[0].getB().getPath().substr(0,link.conns[0].getB().getPath().indexOf("["))];
                var projTypes = proj.filter(p => JSON.stringify(p.pairs).indexOf(JSON.stringify([Aindex,Bindex])) > -1).map(p => p.type);
		if (this.weight) {
		    matrix[link.source][link.target].weight = link.weight;
                    matrix[link.source][link.target].gbase = link.gbase;
		    matrix[link.source][link.target].type = link.erev >= -70 ? 'exc' : 'inh';
		}
		else {
		    delete matrix[link.source][link.target].type;
		}
		nodes[link.source].pre_count += 1;
		nodes[link.target].post_count += 1;
                matrix[link.source][link.target].z = link.type;
                matrix[link.source][link.target].projTypes = projTypes;
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

            var nodeColormap = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeAccent);
	    this.linkColormaps = (function() {
		if (this.weight) {
                    this.populateWeights(context.dataset.links, this.filter);
		    return this.weightColormaps(context.dataset.links, this.filter);
                }
		else {
                    return d3.scaleOrdinal(d3.schemeCategory10).domain(Array.from(new Set(context.dataset.links.map(x=>x.type))).map(x=>x.filter(y=>this.projectionTypeSummary[this.filter].indexOf(y)>-1)).filter(x=>x.length>0));
		    //return d3.scaleOrdinal(d3.schemeCategory10).domain(Array.from(new Set(context.dataset.links.map(x => x.type))));
                }
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

	    var row = container.selectAll(".row")
		.data(matrix)
		.enter().append("g")
		.attr("class", "row")
		.attr("transform", function (d, i) {
		    return "translate(0," + x(i) + ")";
		})
		.each(row(this.linkColormaps, this.filter, this.projectionTypeSummary));

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

            function addSynapseTypesToLegend(id, colorScale, position) {
                var colorBox = {size: 20, labelSpace: 4};
                var padding = {x: colorBox.size, y: 2 * colorBox.size};

                var legendItem = context.svg.selectAll(id)
                    .data(colorScale.domain().slice().sort())
                    .enter().append('g')
                    .attr('class', 'legend-item')
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
            }


	    context.createLegend('legend', nodeColormap, { x: matrixDim, y: 0 });
            if (!this.weight)
                addSynapseTypesToLegend('legend', this.linkColormaps, { x: matrixDim, y: nodeColormap.domain().length*24 + 10});
	    if (this.weight) createWeightLegend(this.linkColormaps, this.filter);

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

	    function createWeightLegend(linkColormaps, filter) {
		var i = 0;
		for (var type in linkColormaps){ 
		    var legendFullHeight = 400;
		    var legendFullWidth = 50;
		    var legendMargin = { top: 40, bottom: 0, left: 80, right: 30 };
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
		    var colourPct = d3.zip(pct, colors);

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
			.range([360, 0]);

		    var legendAxis;
		    if (i == 0)
			legendAxis = d3.axisRight(legendScale);
		    else
			legendAxis = d3.axisLeft(legendScale);
		    // FIXME: don't hardcode number of ticks
		    legendAxis.ticks(10).tickFormat(d3.format(".2f"));

		    legend.append("g")
			.attr('height', legendHeight)
			.attr("class", "legend-axis")
			.attr("transform", "translate(" + (i==0 ? legendWidth : 0) + ", 0)")
			.call(legendAxis);

                    if (filter !== 'gapJunction')
		        legend.append("text")
			.attr('class', 'weight-legend-label')
			.attr('width', 20)
			.attr('height', 20)
			.text(type);

                    // append unit, would be tidier to have both scalebars in a parent <g/>
                    if (i == 0) {
			var unitPos = -18;
			if (Object.keys(linkColormaps).length == 1)
				unitPos = 0;
                        legend.append("text")
			.attr('class', 'weight-legend-label')
			.attr('width', 20)
			.attr('height', 20)
                        .attr('transform', 'translate(' + unitPos + ', 375)')
			.text("nS");
                    }

		    i+=0.5;
		}

	    }

	    //Sorting matrix entries by criteria specified via combobox
	    var optionsContainer = $('<div/>', {
		id: context.id + "-options",
		style: 'width:' + (matrixDim - margin.left - 20) + 'px;margin-left: 10px;top:' + (matrixDim + 18) + 'px;',
		class: 'connectivity-options'
	    }).appendTo(context.connectivityContainer);

	    // toggle weight scheme
	    var schemeContainer = $('<div/>', {
		id: context.id + '-weight',
		style: 'float: right;',
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
			if (typeof ctx.dataset.links[0].weight === 'undefined')
			    that.populateWeights(ctx.dataset.links, that.filter);
                        ctx.setSize(ctx.size.height, ctx.size.width + 100);
			that.weight = true;
			that.linkColormaps = that.weightColormaps(ctx.dataset.links, that.filter);
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
            
	    var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'width:' + legendWidth + 'px;float: left;',
		class: 'connectivity-orderby'
	    }).appendTo(optionsContainer);

	    var orderCombo = $('<select/>');
	    $.each(sortOptions, function (k, v) {
		$('<option/>', { value: k, text: v }).appendTo(orderCombo);
	    });
	    orderContainer.append($('<span/>', {
		id: 'matrix-sorter',
                style: 'float: left; width:' + legendWidth + 'px; width: 130px;',
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

            // connection type selector
            var typeOptions = {
		'projection': 'Chemical',
		'gapJunction': 'Gap Junctions',
		'continuousProjection': 'Continuous'
	    };
	    var typeContainer = $('<div/>', {
		id: context.id + '-type',
                style: 'float: left; width: 130px;',
		//style: 'position: absolute; width:' + legendWidth + 'px;left:' + (matrixDim + context.widgetMargin) + 'px;top:' + (matrixDim - 80) + 'px;',
		class: 'types'
	    }).appendTo(optionsContainer);

	    var typeCombo = $('<select/>');
	    $.each(typeOptions, function (k, v) {
		$('<option/>', { value: k, text: v }).appendTo(typeCombo);
	    });
            typeCombo.val(this.filter);
	    typeContainer.append($('<span/>', {
		id: 'type-selector',
		class: 'type-selector-label',
		text: 'Projection Filter:'
	    }).append(typeCombo));

	    typeCombo.on("change", function(ctx, that) {
                return function () {
                    that.filter = this.value; 
                    ctx.createLayout();
                }
            } (context, this))
            
	    // Draw squares for each connection
	    function row(linkColormaps, filter, projTypesSummary) {
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
                    .style("fill", function(linkColormaps, filter, projTypes) {
                        return function (d) {
                            if (filter && d.z.filter(type => projTypes[filter].indexOf(type)>-1).length==0)
                                return "#000000";
			    if (typeof d.type !== 'undefined')
			        return linkColormaps[d.type](d.gbase);
			    else
			        return linkColormaps(d.z.filter(x=>projTypes[filter].indexOf(x)>-1));
		        }
                    } (linkColormaps, filter, projTypesSummary))
		    .style("stroke", function(linkColormaps, filter, projTypes) {
                        return function (d) {
                            if (filter && d.z.filter(type => projTypes[filter].indexOf(type)>-1).length==0)
                                return "#000000";
			    if (typeof d.type !== 'undefined')
			        return linkColormaps[d.type](d.gbase);
			    else
			        return linkColormaps(d.z.filter(x=>projTypes[filter].indexOf(x)>-1));
		        }
                    } (linkColormaps, filter, projTypesSummary))
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
                        var gbase = links.filter(l => l.source==source_id && l.target==target_id)[0].gbase;
                        var weightStr = "";
                        if (typeof cweight !== 'undefined') {
                            weightStr = " (weight=" + Math.round(cweight*100)/100 + ", g=" +  Math.round(gbase*100)/100 + "nS)";
                            $.proxy(mouseoverCell, this)(nodes[d.y].id + " is connected to " + nodes[d.x].id + weightStr);
                        }
                    })
		    .on("mouseout", $.proxy(mouseoutCell));
		}
	    }
	}
    }

});
