/**
 * Connectivity widget
 */
define(function (require) {
    var d3 = require("d3");
    var d3Scale = require("d3-scale");
    var d3ScaleChromatic = require("d3-scale-chromatic");
    return {
        matrix: [],
	linkColormaps: {},
        state: {filter: 'projection', colorScale: '{"inh": d3.scaleSequential(d3ScaleChromatic.interpolateBlues), "exc": d3.scaleSequential(d3ScaleChromatic.interpolateReds)}',
                weight: true, order: 'id', population: true, projTypesCache: {}},
	weightColormaps: function(links, nodes, filter, context) {
            if (this.state.population) {
                var weights_inh = [].concat.apply([], this.matrix.map(row=>row.filter(x=>x.type=='inh').map(l => l.weight_x_gbase/nodes[l.x].n).map(Math.abs)));
                var weights_exc = [].concat.apply([], this.matrix.map(row=>row.filter(x=>x.type=='exc').map(l => l.weight_x_gbase/nodes[l.x].n).map(Math.abs)));
            } else {
	        var weights_inh = links.filter(l => context.connectionType(l) === 'inh').map(x => x.weight*x.gbase).map(Math.abs).filter(l => !Number.isNaN(l));
                var weights_exc = links.filter(l => context.connectionType(l) === 'exc').map(x => x.weight*x.gbase).map(Math.abs).filter(l => !Number.isNaN(l));
            }
            // add an extra value otherwise d3 interpolate just gives a black scale
            if (weights_inh.length === 1)
                weights_inh.push(weights_inh[0]/2);
            if (weights_exc.length === 1)
                weights_exc.push(weights_exc[0]/2);
	    var colormaps = {};
            if (this.state.colorScale) {
                var baseColormap = eval('('+this.state.colorScale+')');
                if (baseColormap.exc) {
                    var baseColormapExc = baseColormap.exc;
                    var baseColormapInh = baseColormap.inh;
                } else {
                    var baseColormapExc = baseColormap;
                    var baseColormapInh = baseColormap;
                }
            } else {
	        var baseColormapInh = d3.scaleSequential(d3ScaleChromatic.interpolateBlues);
                var baseColormapExc = d3.scaleSequential(d3ScaleChromatic.interpolateReds);
            }
	    if (weights_exc.length > 0) {
		var min_exc = Math.min.apply(null, weights_exc);
		var max_exc = Math.max.apply(null, weights_exc);
	    }
	    if (weights_inh.length > 0) {
		var min_inh = Math.min.apply(null, weights_inh);
		var max_inh = Math.max.apply(null, weights_inh);

	    }

            // if we don't have seperate scales then make max/min the same
            if (!this.state.equalizeScales && this.state.colorScale && eval('('+this.state.colorScale+')').inh) {
                colormaps.inh = baseColormapInh.copy().domain([min_inh, max_inh]);
                colormaps.exc = baseColormapExc.copy().domain([min_exc, max_exc]);
            } else {
                var max = Math.max(typeof max_exc !== 'undefined' ? max_exc : Number.MIN_VALUE,
                                   typeof max_inh !== 'undefined' ? max_inh : Number.MIN_VALUE);
                var min = Math.min(typeof min_exc !== 'undefined' ? min_exc : Number.MAX_VALUE,
                                   typeof min_inh !== 'undefined' ? min_inh : Number.MAX_VALUE);
                // if we have equalize and sequential, go from min=0=white
                if (this.state.equalizeScales && this.state.colorScale && eval('('+this.state.colorScale+')').inh) {
                    colormaps.inh = baseColormapInh.copy().domain([0, max]);
                    colormaps.exc = baseColormapExc.copy().domain([0, max]);
                } else {
                    colormaps.inh = baseColormapInh.copy().domain([min, max]);
                    colormaps.exc = baseColormapInh.copy().domain([min, max]);
                }
            }		
	    return colormaps;
	},
	createMatrixLayout: function (context, state) {
            this.matrix = [];
            if (typeof state !== 'undefined')
                this.state = state;

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

            if (this.state.population) {
	        var nodes = context.dataset.populationNodes;
                var links = context.dataset.populationLinks;
            } else {
                var nodes = context.dataset.nodes;
                var links = context.dataset.links;
            }
	    var root = context.dataset.root;
	    var n = nodes.length;

            context.projectionSummary = context.getProjectionSummary();
            this.state.filter = context.projectionTypeSummary[this.state.filter].length > 0 ?
                this.state.filter :
                Object.keys(context.projectionTypeSummary).filter(x => context.projectionTypeSummary[x].length > 0)[0];
            if (links.filter(l => typeof l.weight === 'undefined').length > 0)
                context.populateWeights(links, this.state.filter);
                
	    // Compute index per node.
            nodes.forEach((function (node, i) {
		node.pre_count = {"gapJunction": 0, "continousProjection": 0, "projection": 0};
                node.post_count = {"gapJunction": 0, "continousProjection": 0, "projection": 0};
		this.matrix[i] = d3.range(n).map(function (j) {
		    return { x: j, y: i, z: 0 };
		});
	    }).bind(this));

	    // Convert links to matrix; count pre / post conns.
            var parseLink = (function (link) {
		    //TODO: think about zero weight lines
                var Aindex = link.conns[0].getA().getElements()[0].getIndex();
                var Bindex = link.conns[0].getB().getElements()[0].getIndex();
                var projTypes = context.pairs_types[String(Aindex)][String(Bindex)];
                var m_entry = this.matrix[link.source][link.target];
		if (this.state.weight) {
                    m_entry.weight ? m_entry.weight+=link.weight : m_entry.weight = link.weight;
                    m_entry.gbase ? m_entry.gbase+=link.gbase : m_entry.gbase = link.gbase;
                    m_entry.weight_x_gbase ? m_entry.weight_x_gbase+=link.gbase*link.weight : m_entry.weight_x_gbase = link.gbase*link.weight;
                    m_entry.type = context.connectionType(link);
                    m_entry.num ? m_entry.num+=1 : m_entry.num = 1;
		}
                for (var type of projTypes) {
		    nodes[link.source].pre_count[type] += 1;
		    nodes[link.target].post_count[type] += 1;
                }
                for (var i=0; i<link.type.length; ++i){
                    if (m_entry.z != 0 && m_entry.z.indexOf(link.type[i])==-1)
                        m_entry.z.push(link.type[i]);
                    else if (m_entry.z == 0)
                        m_entry.z = [link.type[i]];
                }
                m_entry.projTypes ? m_entry.projTypes.push(projTypes) : m_entry.projTypes = [projTypes];
	    }).bind(this);

	    var links_defined = links.filter(l=> typeof l.weight !== 'undefined' && typeof l.gbase !== 'undefined' && typeof l.type !== 'undefined');
            for (var i=0; i<links_defined.length; ++i) {
                parseLink(links_defined[i]);
            }

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
                    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    return collator.compare(nodes[a].id.split('[')[1], nodes[b].id.split('[')[1]);
                }).sort(function (a, b) {
		    return d3.ascending(nodes[a].id.split('[')[0], nodes[b].id.split('[')[0]);
		}),
		pre_count: d3.range(n).sort((function (a, b) {
		    return nodes[b].pre_count[this.state.filter] - nodes[a].pre_count[this.state.filter];
		}).bind(this)),
		post_count: d3.range(n).sort((function (a, b) {
		    return nodes[b].post_count[this.state.filter] - nodes[a].post_count[this.state.filter];
		}).bind(this)),
		//community: d3.range(n).sort(function(a, b) { return nodes[b].community - nodes[a].community; }),
	    };
	    // Default sort order.
	    x.domain(orders[this.state.order]);

	    var rect = container
		.append("rect")
		.attr("class", "background")
                // white bg for sequential, black otherwise
                .attr("fill", (typeof this.state.colorScale === 'undefined' ||
                               typeof eval('('+this.state.colorScale+')').inh === 'undefined') ? "black" : "white")
		.attr("width", matrixDim - margin.left - 20)
		.attr("height", matrixDim - margin.top);

            // we store the 'conn' key in case we want to
            // eg. conditionally colour the indicator if there
            // are actually connections in that row/column
            var pre = nodes.map((function(x,i) { return {id: x.id, conn: this.matrix[i].filter(function(d) { return d.z; }).length > 0}}).bind(this));
            var matrixT = this.matrix[0].map((function(col, i) {
                return this.matrix.map(function(row) {
                    return row[i];
                })
            }).bind(this));
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
		if (this.state.weight) {
                    if (links.filter(l => typeof l.weight === 'undefined').length > 0)
                        context.populateWeights(links, this.state.filter);
		    return this.weightColormaps(links, nodes, this.state.filter, context);
                }
		else {
                    return d3.scaleOrdinal()
                        .range(context.linkColors)
                        .domain(Array.from(new Set(links.map(x=>x.type))).map(x=>x.filter(y=>context.projectionTypeSummary[this.state.filter].indexOf(y)>-1)).filter(x=>x.length>0));
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
		.data(this.matrix)
		.enter().append("g")
		.attr("class", "row")
		.attr("transform", function (d, i) {
		    return "translate(0," + x(i) + ")";
		})
		.each(row(this.linkColormaps, this.state.filter, context.projectionTypeSummary, this.state.weight, this.state.population));

	    row.append("line")
		.attr("x2", context.options.innerWidth);

	    var column = container.selectAll(".column")
		.data(this.matrix)
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
            if (!this.state.weight)
                addSynapseTypesToLegend('legend', this.linkColormaps, { x: matrixDim, y: nodeColormap.domain().length*24 + 10});
	    if (this.state.weight) createWeightLegend(this.linkColormaps, this.state.filter);

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
			.attr('id', 'gradient-'+type)
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
			.style('fill', 'url(#gradient-'+type+')');

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
		    legendAxis.ticks(10).tickFormat(d3.format(".2s"));

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
				unitPos = 18;
                        legend.append("text")
			.attr('class', 'weight-legend-label')
			.attr('width', 20)
			.attr('height', 20)
                        .attr('transform', 'translate(' + unitPos + ', 375)')
			.text("S");
                    }

		    i+=0.5;
		}

	    }

	    //Sorting matrix entries by criteria specified via combobox
	    var optionsContainer = $('<div/>', {
		id: context.id + "-options",
		//style: 'width:' + (matrixDim - margin.left + 60) + 'px;margin-left: 10px;top:' + (matrixDim + 18) + 'px;',
                style: 'width:' + (context.options.innerWidth - margin.left) + 'px;margin-left: 10px;top:' + (matrixDim + 18) + 'px;',
		class: 'connectivity-options'
	    }).appendTo(context.connectivityContainer);

	    var orderContainer = $('<div/>', {
		id: context.id + '-ordering',
		style: 'float: left;',
		class: 'connectivity-orderby'
	    }).appendTo(optionsContainer);

	    var orderCombo = $('<select/>', {
                style: 'margin-left: 0.5em;'
            });
	    $.each(sortOptions, function (k, v) {
		$('<option/>', { value: k, text: v }).appendTo(orderCombo);
	    });
	    orderContainer.append($('<span/>', {
		id: 'matrix-sorter',
                style: 'float: left;',
		class: 'control-label',
		text: 'Order by:'
	    }).append(orderCombo));
            orderCombo.val(this.state.order);
	    orderCombo.on("change", function (svg, that) {
		return function () {
                    that.state.order = this.value;
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
	    } (context.svg, this));

            // connection type selector
            var typeOptions = {
		'projection': 'Chemical',
		'gapJunction': 'Gap Junctions',
		'continuousProjection': 'Continuous'
	    };

	    var typeContainer = $('<div/>', {
		id: context.id + '-type',
                style: 'float: left; margin-left: 1.6em',
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
		class: 'control-label',
		text: 'Projection Filter:'
	    }).append(typeCombo));

	    typeCombo.on("change", function(ctx, that) {
                return function () {
                    that.state.filter = this.value;
                    ctx.createLayout(that.state);
                }
            } (context, this));

            // toggle weight scheme
	    var weightContainer = $('<div/>', {
		id: context.id + '-weight',
		style: 'float: left; margin-left: 1.6em',
		class: 'weights'
	    }).appendTo(optionsContainer);

	    var weightCheckbox = $('<input type="checkbox" id="weightScheme" name="weight" value="weight">');
	    if (this.state.weight)
		weightCheckbox.attr("checked", "checked");
	    weightContainer.append(weightCheckbox);
	    weightContainer.append($('<label for="weightScheme" class="control-label">Show weights</label>'));
	    
	    weightCheckbox.on("change", function (ctx, that) {
		return function () {
		    if (this.checked) {
			if (typeof ctx.dataset.links[0].weight === 'undefined')
			    ctx.populateWeights(ctx.dataset.links, that.state.filter);
                        ctx.setSize(ctx.size.height, ctx.size.width + 100);
			that.state.weight = true;
			that.linkColormaps = that.weightColormaps(ctx.dataset.links, ctx.dataset.nodes, that.state.filter, ctx);
		    }
		    else {
                        ctx.setSize(ctx.size.height, ctx.size.width - 100);
			that.state.weight = false;
			ctx.nodeColormap = ctx.defaultColorMapFunction();
		    }
		    $('#' + ctx.id + "-weight").remove();
		    ctx.createLayout(that.state);
		}
	    } (context, this));

	    var populationCheckbox = $('<input type="checkbox" id="population" name="population" value="population">');
            var populationContainer = $('<div/>', {
		id: context.id + '-weight',
		style: 'float: left; margin-left: 1.6em',
		class: 'weights'
	    }).appendTo(optionsContainer);

	    if (this.state.population)
		populationCheckbox.attr("checked", "checked");
	    populationContainer.append(populationCheckbox);
	    populationContainer.append($('<label for="population" class="control-label">Show populations</label>'));

	    populationCheckbox.on("change", function (ctx, that) {
		return function () {
		    if (this.checked) {
                        that.state.population = true;
		    }
		    else {
			that.state.population = false;
		    }
		    ctx.createLayout(that.state);
		}
	    } (context, this));

            // color scale selector
            if (this.state.weight) {
                var colorOptions = {
		    'd3.scaleLinear().range([d3.cubehelix(240, 1, 0.5), d3.cubehelix(0, 1, 0.5)]).interpolate(d3.interpolateCubehelixLong)': 'Rainbow',
		    '{"inh": d3.scaleSequential(d3ScaleChromatic.interpolateBlues), "exc": d3.scaleSequential(d3ScaleChromatic.interpolateReds)}': 'Sequential'
	        };

	        var colorContainer = $('<div/>', {
		    id: context.id + '-type',
                    style: 'float: right; margin-left: 1.6em',
		    class: 'colorscales'
	        }).appendTo(optionsContainer);

	        var colorCombo = $('<select/>', {
                    style: 'margin-left: 0.5em;'
                });
	        $.each(colorOptions, (function (k, v) {
		    $('<option/>', { value: k, text: v }).appendTo(colorCombo);
	        }).bind(this));
                if (this.state.colorScale)
                    colorCombo.val(this.state.colorScale);
	        colorContainer.append($('<span/>', {
		    id: 'color-selector',
		    class: 'control-label',
		    text: 'Colourscale Type:'
	        }).append(colorCombo));

                colorCombo.on("change", function(ctx, that) {
                    return function () {
                        that.state.colorScale = this.value;
                        ctx.createLayout(that.state);
                    }
                } (context, this));

                // if sequential then show equalize scales box
                if (this.state.colorScale && eval('('+this.state.colorScale+')').inh) {
                                    
                    var equalize = $('<input type="checkbox" id="equalize" name="equalize" value="equalize">');
                    if (this.state.equalizeScales)
		        equalize.attr("checked", "checked");

                    colorContainer.append($('<span/>', {
		        id: 'equalize-selector',
		        class: 'control-label',
		        text: 'Equalize scales'
	            }).append(equalize));

	            equalize.on("change", function (ctx, that) {
		        return function () {
		            if (this.checked) {
                                that.state.equalizeScales = true;
		            }
		            else {
			        that.state.equalizeScales = false;
		            }
		            ctx.createLayout(that.state);
		        }
	            } (context, this));
                } else {
                    $('#equalize').remove();
                }

            } else {
                $('#colorscales').remove();
            }

	    // Draw squares for each connection
	    function row(linkColormaps, filter, projTypesSummary, weights, population) {
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
                    .style("fill", function(linkColormaps, filter, projTypes, weights, population) {
                        return function (d) {
                            if (filter && d.z.filter(type => projTypes[filter].indexOf(type)>-1).length==0)
                                return "none";
			    if (typeof linkColormaps[d.type] === 'function') {
                                if (population)
			            return linkColormaps[d.type](Math.abs(d.weight_x_gbase)/nodes[d.x].n);
                                else
                                    return linkColormaps[d.type](Math.abs(d.gbase*d.weight));
                            }
			    else
                                return linkColormaps(d.z.filter(x=>projTypes[filter].indexOf(x)>-1));
		        }
                    } (linkColormaps, filter, projTypesSummary, weights, population))
		    .style("stroke", function(linkColormaps, filter, projTypes, weights) {
                        return function (d) {
                            if (filter && d.z.filter(type => projTypes[filter].indexOf(type)>-1).length==0)
                                return "none";
			    if (typeof linkColormaps[d.type] === 'function')
                                if (population)
			            return linkColormaps[d.type](Math.abs(d.weight_x_gbase)/nodes[d.x].n);
                                else
                                    return linkColormaps[d.type](Math.abs(d.gbase*d.weight));
			    else
                                return linkColormaps(d.z.filter(x=>projTypes[filter].indexOf(x)>-1));
		        }
                    } (linkColormaps, filter, projTypesSummary, weights))
		    .on("click", function (d) {
			GEPPETTO.SceneController.deselectAll();
			//Ideally instead of hiding the connectivity lines we'd show only the ones connecting the two cells, also we could higlight the connection.
			eval(root.getId() + "." + nodes[d.x].id).select();
			eval(root.getId() + "." + nodes[d.x].id).showConnectionLines(false);
			eval(root.getId() + "." + nodes[d.y].id).select();
			eval(root.getId() + "." + nodes[d.y].id).showConnectionLines(false);
		    })
		    .on("mouseover", function (population) {
                        return function (d) {
                            var source_id = d.y;
                            var target_id = d.x;
                            var cweight = d.weight;
                            var gbase = Math.abs(d.gbase/1e-9);
                            var weight_x_gbase = d.weight_x_gbase ? Number(d.weight_x_gbase/1e-9).toPrecision(3) : 0;
                            var weightStr = "";
                            var weightPre = " (Σw=";
                            var n_post = nodes[d.x].n;
                            var g = population ? " g_avg=" + Number(gbase/d.num).toPrecision(3)+ "nS, " : " g=" + Number(gbase).toPrecision(3) + "nS, ";
                            var popString = population ? ", postPop#=" + n_post + ", Σw*g/#=" + Number(weight_x_gbase/n_post).toPrecision(3) + "nS": "";//parseFloat(Math.abs(gbase*cweight))/nodes[d.x].n : "";
                            if (typeof cweight !== 'undefined') {
                                weightStr = weightPre + Number(Math.abs(cweight)).toPrecision(3) + ", " +
                                    g +
                                    " Σw*g=" + weight_x_gbase +
                                    "nS" +
                                    popString + ")";
                            }
                            $.proxy(mouseoverCell, this)(nodes[d.y].id + " → " + nodes[d.x].id + weightStr);
                        }
                    } (population))
		    .on("mouseout", $.proxy(mouseoutCell));
		}
	    }
	}
    }
});
