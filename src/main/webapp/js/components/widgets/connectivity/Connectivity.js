/**
 * Connectivity Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 * @author borismarin
 */

define(function (require) {

    var Widget = require('../Widget');
    var $ = require('jquery');
    var _ = require('underscore');
    var Instance = require('../../../geppettoModel/model/Instance');
    require('../../controls/mixins/bootstrap/modal.js')

    var d3 = require("d3");

	var chords = require('./chords');
	var hives = require('./hives');
	var matrices = require('./matrices');
	var forces = require('./forces');

    require("./Connectivity.less");

    return Widget.View.extend({

        dataset: {},
        linkCache: {},
        nodeColormap: {},
        connectivityOptions: {},
        projectionTypeSummary: {'projection': [], 'continuousProjection': [], 'gapJunction': []},
        linkColors: ["#1b70fc", "#faff16", "#d50527", "#158940", "#f898fd", "#24c9d7", "#cb9b64",
                     "#866888", "#22e67a", "#e509ae", "#9dabfa", "#437e8a", "#b21bff", "#ff7b91",
                     "#94aa05", "#ac5906", "#82a68d", "#fe6616", "#7a7352", "#f9bc0f", "#b65d66",
                     "#07a2e6", "#c091ae", "#8a91a7", "#88fc07", "#ea42fe", "#9e8010", "#10b437",
                     "#c281fe", "#f92b75", "#07c99d"],
        defaultConnectivityOptions: {
            width: 900,
            height: 500,
            layout: "matrix", //[matrix, force, hive, chord]
            nodeType: function (node) {
                if (node instanceof Instance) {
                    return node.getParent().getId();
                } else {
                    return node.getPath().split('_')[0];
                }
            },
            linkType: function (conn) {
                return [];
            },
            library: "GEPPETTO.ModelFactory.geppettoModel.common"
        },
 
        initialize: function (options) {
            this.options = options;

            Widget.View.prototype.initialize.call(this, options);
            this.setOptions(this.defaultConnectivityOptions);
            this.render();
            this.setSize(options.height, options.width);

            this.connectivityContainer = $("#" + this.id);

            var that=this;
            this.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                that.configViaGUI();
            }));

            //resizes connectivity widget when maximizing/restoring using buttons on top
            $(".ui-dialog-titlebar-maximize, .ui-dialog-titlebar-restore").on("click",function(){
            	var height = $("#"+that.id).parent().height();
                var width = $("#"+that.id).parent().width();

                GEPPETTO.CommandController.execute(that.id + ".setSize(" + height + "," + width + ")", true);

                var left = $("#"+that.id).parent().offset().left;
                var top = $("#"+that.id).parent().offset().top;

                window[that.id].setPosition(left, top);
            });
        },

        getProjectionSummary: function() {
            if (typeof this.projectionSummary === 'undefined' || Object.keys(this.projectionSummary).length === 0) {
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
            } else {
                return this.projectionSummary;
            }
	},
        connectionType: function(link) {
            return (link.erev>=-50 && link.gbase>=0 && link.weight >=0) ? 'exc' : 'inh';
        },
        filterConns: function(conns, filter) {
            if (filter === 'gapJunction')
                filter = 'electricalProjection';
            return conns.filter(x=>x.getParent().getName()===filter);
        },
	linkSynapse: function (conn) {
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
            var weight = 0;
            var noWeights = true;
            var conns = this.filterConns(conns, filter);
            for (var conn of conns) {
	        if (this.linkSynapse(conn).length > 0) {
                    var synapses = this.linkSynapse(conn).filter(x=>this.projectionTypeSummary[filter].indexOf(x.getId())>-1);
		    var weightIndex = conn.getInitialValues().map(x => x.value.eClass).indexOf("Text");
		    if (weightIndex > -1) {
		        weight += parseFloat(conn.getInitialValues()[weightIndex].value.text);
                    } else {
                        weight += 1;
                    }
	        }
            }
            return weight;
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
                var gbases = synapses.map(function(c) {
                    if (typeof c.getType().gbase !== 'undefined')
                        return c.getType().gbase;
                    else if (typeof c.getType().conductance !== 'undefined')
                        return c.getType().conductance;
                    else
                        return 1;
                });
                var scaleFn = function(unit) {
                    switch(unit) {
                    case 'S':
                        return 1; break;
                    case 'mS':
                        return 1e-3; break;
                    case 'nS':
                        return 1e-9; break;
                    case 'pS':
                        return 1e-12;
                    }
                };
                var scale = gbases.map(g => { if (typeof g.getUnit === 'function') { return scaleFn(g.getUnit()) } else { return 1; } });
                // assuming (quite safely) gbase is same for all connections b/w two cells
                var conn = this.filterConns(conns, filter)[0];
                var weightIndex = conn.getInitialValues().map(x => x.value.eClass).indexOf("Text");
                // get the sign of the weight so inh/exc detection works but don't factor weights into gbase values
		var weight = 1;
		if (weightIndex > -1)
		    weight = parseFloat(conn.getInitialValues()[weightIndex].value.text);
                var sign = weight===0 ? 1 : Math.sign(weight);
                return gbases.map((g, i) => {
                    if (typeof g.getInitialValue === 'function')
		        return sign * scale[i] * g.getInitialValue();
                    else
                        return sign * scale[i] * g;
		}).reduce((x,y) => x+y, 0);
	    }
	    else
		return 0;
        },
	populateWeights: function(links, filter) {
            this.projectionSummary = this.getProjectionSummary();
	    for (var i in links) {
                if (links[i].type.filter(function(t) { return this.projectionTypeSummary[filter].indexOf(t)>-1 }.bind(this)).length > 0) {
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

        setSize: function (h, w) {
            Widget.View.prototype.setSize.call(this, h, w);
            if (this.svg != null) {
                //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
                var width = this.size.width - 20;
                var height = this.size.height + 50;
                if (this.options.layout == 'matrix') {
                    $('#' + this.id + '-ordering').remove();
                }
                this.createLayout();
            }
        },

        defaultColorMapFunction: function() {
            var cells = this.dataset["root"].getChildren();
            var domain = [];
            var range = [];
            for (var i=0; i<cells.length; ++i) {
                if (cells[i].getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    domain.push(cells[i].getName());
                    range.push(cells[i].getColor());
                }
            }
            // if everything is default color, use a d3 provided palette as range
            if (range.filter(function(x) { return x!==GEPPETTO.Resources.COLORS.DEFAULT; }).length == 0)
                return d3.scaleOrdinal(d3.schemeCategory20).domain(domain);
            else
                return d3.scaleOrdinal(range).domain(domain);
        },

        setNodeColormap: function(nodeColormap) {
            if (typeof nodeColormap !== 'undefined')
                this.nodeColormap = nodeColormap;
            else
                this.nodeColormap = this.defaultColorMapFunction();
            return this.nodeColormap;
        },

        onColorChange: function(ctx){
            return function(){
                var colorMap = ctx.options.colorMapFunction ? ctx.options.colorMapFunction() : ctx.defaultColorMapFunction();
                for (var i=0; i<colorMap.domain().length; ++i) {
                    // only update if there is a change
                    if (ctx.nodeColormap(colorMap.domain()[i]) !== colorMap(colorMap.domain()[i])) {
                        ctx.setNodeColormap(colorMap);
                        // FIXME: would be more efficient to update only what has
                        // changed, though this depends on the type of layout
                        ctx.svg.selectAll("*").remove();
                        ctx.createLayout();
                        break;
                    }
                }
            }
        },

        setData: function (root, options, nodeColormap) {
            this.setOptions(options);
            this.dataset = {};
            this.mapping = {};
            this.mappingSize = 0;
            this.dataset["root"] = root;
            this.setNodeColormap(nodeColormap);
            this.widgetMargin = 20;

            if(this.createDataFromConnections()){
            	this.createLayout();
            }

            // track change in state of the widget
            this.dirtyView = true;

            GEPPETTO.on(GEPPETTO.Events.Color_set, this.onColorChange(this));

            return this;
        },

        createDataFromConnections: function () {
            var connectionVariables = GEPPETTO.ModelFactory.getAllTypesOfType(this.options.library.connection)[0].getVariableReferences();
            	if(connectionVariables.length>0) {

		            if (this.dataset["root"].getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
		                var subInstances = this.dataset["root"].getChildren();
		                this.dataset["nodes"] = [];
		                this.dataset["links"] = [];

		                for (var k = 0; k < subInstances.length; k++) {
		                    var subInstance = subInstances[k];
		                    if (subInstance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
		                        var populationChildren = subInstance.getChildren();
		                        for (var l = 0; l < populationChildren.length; l++) {
		                            var populationChild = populationChildren[l];
		                            this.createNode(populationChild.getId(), this.options.nodeType(populationChild));
		                        }

		                    }
		                }
                                var links = [];
		                for(var x=0; x<connectionVariables.length; x++){
	                        var connectionVariable = connectionVariables[x];

	                        var source = connectionVariable.getA();
	                        var target = connectionVariable.getB();
	                        var sourceId = source.getElements()[source.getElements().length - 1].getPath();
	                            var targetId = target.getElements()[source.getElements().length - 1].getPath();

                                    var st = [sourceId,targetId].toString();
                                    if (links[st] == undefined)
                                        links[st] = [connectionVariable]
                                    else
                                        links[st].push(connectionVariable)
		                }
		            }
                    for (var link in links) {
                          this.createLink(links[link], link.split(',')[0], link.split(',')[1], this.options.linkType.bind(this)(links[link], this.linkCache));
                    }

                    var count = function (arr) {
                        var a = [], prev;
                        for ( var i = 0; i < arr.length; i++ ) {
                            if ( arr[i] !== prev ) {
                                a.push(1);
                            } else {
                                a[a.length-1]++;
                            }
                            prev = arr[i];
                        }
                        return a;
                    }
		    this.dataset.nodeTypes = _.uniq(_.pluck(this.dataset.nodes, 'type')).sort();
		    this.dataset.linkTypes = _.uniq(_.pluck(this.dataset.links, 'type')).sort();
                    var populationSizes = count(this.dataset.nodes.map(x=>x.type));
                    this.dataset.populationNodes = Array.from(new Set(this.dataset.nodes.map(x=>x.type)))
                        .map(function(x,i) { return {id: x, type: x, n: populationSizes[i]} });

                    this.dataset.populationLinks = [];
                    this.ns = count(this.dataset.nodes.map(x=>x.type));
                    this.ns = this.ns.map((x,i) => x + this.ns.slice(0,i).reduce((a,b)=>a+b,0));
                    this.dataset.links.forEach((function (link) {
                        this.dataset.populationLinks.push(
                            {
                                conns: link.conns,
                                source: this.ns.indexOf(this.ns.filter(x=>link.source<x)[0]),
                                target: this.ns.indexOf(this.ns.filter(x=>link.target<x)[0]),
                                type: link.type
                            }
                        )
                    }).bind(this));
                    return true;

                    var tmpLinks = [];
                    for (var i=0; i<this.dataset.populationLinks.length; ++i) {
                        var matches = tmpLinks
                            .filter(x => x.source==this.dataset.populationLinks[i].source &&
                                    x.target==this.dataset.populationLinks[i].target &&
                                    JSON.stringify(x.type)==JSON.stringify(this.dataset.populationLinks[i].type))
                        if (matches.length==0)
                            tmpLinks.push(this.dataset.populationLinks[i])
                    }
                    this.dataset.populationLinks = tmpLinks;
                    //return true;
                }

            return false;

        },


        //TODO: move graph utils to module, maybe consider jsnetworkx?
        // this is very rough, we should think about directionality and weights...
        calculateNodeDegrees: function (normalize) {
            var indegrees = _.countBy(this.dataset.links, function (link) {
                return link.source;
            });
            var outdegrees = _.countBy(this.dataset.links, function (link) {
                return link.target;
            });
            var maxDeg = 1;
            this.dataset.nodes.forEach(function (node, idx) {
                var idg = (typeof indegrees[idx] === 'undefined') ? 0 : indegrees[idx];
                var odg = (typeof outdegrees[idx] === 'undefined') ? 0 : outdegrees[idx];
                node.degree = idg + odg;
                if (node.degree > maxDeg) {
                    maxDeg = node.degree;
                }
            });
            if (normalize) {
                this.dataset.nodes.forEach(function (node) {
                    node.degree /= maxDeg;
                });
            }
        },

        createLayout: function (state) {
            $('#' + this.id + " svg").remove();
	    $('#' + this.id + '-options').remove();
            $('#' + this.id).css('margin-bottom', '30px');

            this.options.innerWidth = this.connectivityContainer.innerWidth() - this.widgetMargin;
            this.options.innerHeight = this.connectivityContainer.innerHeight() - this.widgetMargin;

            this.svg = d3.select("#" + this.id)
                .append("svg")
                .attr("width", this.options.innerWidth)
                .attr("height", this.options.innerHeight);

            switch (this.options.layout) {
                case 'matrix':
                matrices.createMatrixLayout(this, state);
                    break;
                case 'force':
                    forces.createForceLayout(this);
                    break;
                case 'hive':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(true);
                    hives.createHiveLayout(this);
                    break;
                case 'chord':
                    //TODO: ugly preprocessing here...
                    this.calculateNodeDegrees(false);
                    chords.createChordLayout(this);
                    break;
            }
        },


        createLegend: function (id, colorScale, position, title) {

            var ret;
            //TODO: boxes should scale based on number of items
            var colorBox = {size: 20, labelSpace: 4};
            var padding = {x: colorBox.size, y: 2 * colorBox.size};

            //TODO: is it sane not to draw the legend if there is only one category?
            if (colorScale.domain().length > 1) {
                var horz, vert;
                var legendItem = this.svg.selectAll(id)
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
                ret = {x: horz, y: vert};
            }

            this.legendPosition = position;
            this.legendTitle = title;
            return ret;

        },

        createNode: function (id, type) {
           if (!(id in this.mapping)) {
                var nodeItem = {
                    id: id,
                    type: type,
                };
                this.dataset["nodes"].push(nodeItem);

                this.mapping[nodeItem["id"]] = this.mappingSize;
                this.mappingSize++;
            }
        },

        createLink: function (conns, sourceId, targetId, type) {
            var linkItem = {
		conns: conns,
                source: this.mapping[sourceId],
                target: this.mapping[targetId],
                type: type,
            };
            this.dataset["links"].push(linkItem);
        },

        /**
         *
         * Set the options for the connectivity widget
         *
         * @command setOptions(options)
         * @param {Object} options - options to modify the plot widget
         */
        setOptions: function (options) {

            this.connectivityOptions = options;

            function strToFunc(body){
                return new Function('x', 'return ' + body + ';');
            }
            if (options != null) {
                if(typeof options.linkType === 'string')
                    options.linkType = strToFunc(options.linkType);
                if(typeof options.nodeType === 'string')
                    options.nodeType = strToFunc(options.nodeType);
                if(typeof options.linkWeight === 'string')
                    options.linkWeight = strToFunc(options.linkWeight);
                if(typeof options.colorMapFunction === 'string')
                    options.colorMapFunction = strToFunc(options.colorMapFunction);
                if(typeof options.library === 'string')
                    options.library = eval(options.library);
                $.extend(this.options, options);
            }
        },

        createLayoutSelector: function() {

            function imgPath(path){
                return 'geppetto/js/components/widgets/connectivity/images/' + path;
            }

            var layoutOptions = [
                 {id: "matrix", label: 'Adjacency matrix', description:
                     "A coloured square at row 𝒊, column 𝒋 represents a " +
                     "directed connection from node 𝒋 to node 𝒊.",
                     img: imgPath('matrix.svg')},
                 {id: "force", label: 'Force-directed layout', description:
                     "Draw circles for nodes, lines for connections, disregarding " +
                     "spatial information.",
                     img: imgPath('force.svg')},
                 {id: "hive",  label: 'Hive plot', description:
                     "Axes correspond to node categories, arcs to connections." +
                     "The position of each node along an axis is determined by " +
                     "the total number of connections it makes.",
                     img: imgPath('hive.svg')},
                 {id: "chord", label:'Chord diagram', description:
                     "Circular slices correspond to node categories, chords to " +
                     "connections. A gap between slice and chord indicate an " +
                     "incoming connection. Use ctrl(shift) + mouse hover to " +
                     "hide incoming(outgoing) connections from a population.",
                     img: imgPath('chord.svg')}
             ];
            var container = $('<div>').addClass('card-deck-wrapper');
            $('<p class="card-wrapper-title">How would you like to represent your network?</p>').appendTo(container);
            var deck = $('<div>').addClass('card-deck').appendTo(container);

            function createCard(cardData){
                return $('<div>', {class: 'card', id: cardData.id})
                        .append($('<img>', {
                            class: 'card-img-top center-block',
                            src: cardData.img,
                        }))
                        .append($('<h4>', {
                            class: 'card-title',
                            text: cardData.label
                        }))
                        .append($('<p>', {
                            class: 'card-text',
                            text: cardData.description
                        }));
            }

            for(layout in layoutOptions){
                deck.append(createCard(layoutOptions[layout]));
            }

            return container;
        },

        configViaGUI : function() {
            var that = this;
            var firstClick=false;
            var modalContent=$('<div class="modal fade" id="connectivity-config-modal" tabindex="-1"></div>')
                .append(this.createLayoutSelector()[0].outerHTML).modal({keyboard: true});
            function handleFirstClick(event) {
                var options = {layout: event.currentTarget.id};
                if (typeof that.connectivityOptions !== 'undefined')
                    $.extend(options, {library: that.connectivityOptions.library,
                                       colorMapFunction: that.connectivityOptions.colorMapFunction});
                that.setData(that.dataset["root"], options);
                firstClick=true;
            }

            function clickHandler(event) {
            	if(!firstClick){
            		handleFirstClick(event);
            		setTimeout(function() { firstClick=false;}, 200); //closes the window to click again (dbclick)
            	}
            	else{
            		modalContent.modal('hide');
            		firstClick=false;
            	}
            }

            modalContent.find('.card').on('click', clickHandler);
        },

        getView: function(){
            var baseView = Widget.View.prototype.getView.call(this);

            // add connectivity specific options - contains logic, iterate and serialize
            var serializedOptions = {};
            for(var item in this.connectivityOptions){
                var serializedItem = {};
                if (typeof this.connectivityOptions[item] === "function") {
                    serializedItem.value = this.connectivityOptions[item].toString();
                    serializedItem.type = 'function';
                } else if (item === "library") {
                    serializedItem.value = this.connectivityOptions[item].getPath();
                    serializedItem.type = 'library';
                } else {
                    serializedItem.value = this.connectivityOptions[item];
                    serializedItem.type = 'primitive';
                }
                serializedOptions[item] = serializedItem;
            }
            baseView.options = serializedOptions;

            // add data
            baseView.dataType = 'object';
            if(this.dataset["root"]!=undefined){
                baseView.data = this.dataset["root"].getPath();
            }

            if (typeof this.nodeColormap.domain === 'function')
                baseView.nodeColormap = {domain: this.nodeColormap.domain(),
                                         range: this.nodeColormap.range()};

            return baseView;
        },

        setView: function(view){
            // set base properties
            Widget.View.prototype.setView.call(this, view);

            if(view.dataType == 'object' && view.data != undefined && view.data != ''){
                var obj = eval(view.data);
                var deserializedOptions = {};
                for(var item in view.options){
                    if(view.options[item].type == "function" || view.options[item].type == "library"){
                        deserializedOptions[item] = eval('(' + view.options[item].value + ')');
                    } else {
                        deserializedOptions[item] = view.options[item].value;
                    }
                }

                var colorScale;
                if (typeof view.nodeColormap !== 'undefined')
                    colorScale = d3.scaleOrdinal(view.nodeColormap.range).domain(view.nodeColormap.domain);

                var that = this;
                // resolve connections and pass the line below as a callback
                Model.neuroml.resolveAllImportTypes(function(){
                    that.setData(obj, deserializedOptions, colorScale);
                });
            }

            // after setting view through setView, reset dirty flag
            this.dirtyView = false;
        }
    });
});
