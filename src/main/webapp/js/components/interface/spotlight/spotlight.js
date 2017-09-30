define(function (require) {

    require('./spotlight.less');

    var React = require('react'),
        $ = require('jquery'),
        typeahead = require("typeahead.js/dist/typeahead.jquery.min.js"),
        Bloodhound = require("typeahead.js/dist/bloodhound.min.js"),
        Handlebars = require('handlebars'),
        GEPPETTO = require('geppetto');

		var PlotController = require('./../../widgets/plot/controllers/PlotsController');

		var Instance = require('../../../geppettoModel/model/Instance');
		var Variable = require('../../../geppettoModel/model/Variable');

    var Spotlight = React.createClass({

        potentialSuggestions: {},
        suggestions: null,
        instances: null,
        dataSourceResults : {},
        searchTimeOut : null,
        updateResults : false,
        initialised:false,
        modifiable : true,
        plotController: new PlotController(),

        //A sample suggestion, domain specific suggestions should go inside extension
        plotSample: {
            "label": "Plot all recorded variables",
            "actions": [
                "var p=G.addWidget(0).then(w=>{w.setName('Recorded Variables');});",
                "$.each(Project.getActiveExperiment().getWatchedVariables(true,false),function(index,value){p.plotData(value)});"
            ],
            "icon": "fa-area-chart"
        },

        close : function () {
            $("#spotlight").hide();
            GEPPETTO.trigger(GEPPETTO.Events.Spotlight_closed);
        },

        addData : function(instances) {
            if(this.props.indexInstances) {
            this.instances.add(instances);
            this.initialised=true;
            }
        },

        getDefaultProps: function () {
            return {
                indexInstances: true
            };
        },

        componentDidMount: function () {

            var space = 32;
            var escape = 27;

            var that = this;

            GEPPETTO.Spotlight = this;

            GEPPETTO.trigger(GEPPETTO.Events.Spotlight_loaded);

            this.initTypeahead();

            var spotlightContainer = $("#spotlight");
            var typeAhead = $('#typeahead');

            spotlightContainer.click(function(e){
            	if (e.target==e.delegateTarget){
            		//we want this only to happen if we clicked on the div directly and not on anything therein contained
            		that.close();
            	}
            });

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == space) {
                    that.open(GEPPETTO.Resources.SEARCH_FLOW, true);
                }
            });

            $(document).keydown(function (e) {
                if (spotlightContainer.is(':visible') && e.keyCode == escape) {
                	that.close();
                }
            });

            typeAhead.keydown(this, function (e) {
                if (e.which == 9 || e.keyCode == 9) {
                    e.preventDefault();
                }
            });

            typeAhead.keypress(this, function (e) {
                if (e.which == 13 || e.keyCode == 13) {
                    that.confirmed(typeAhead.val());
                }
                if (this.searchTimeOut !== null) {
                    clearTimeout(this.searchTimeOut);
                }
                this.searchTimeOut = setTimeout(function () {
                	for (var key in that.configuration.SpotlightBar.DataSources) {
                	    if (that.configuration.SpotlightBar.DataSources.hasOwnProperty(key)) {
                	    	var dataSource = that.configuration.SpotlightBar.DataSources[key];
                	    	var searchQuery = typeAhead.val();
                	    	var url = dataSource.url.replace("$SEARCH_TERM$", searchQuery);
                            that.updateResults = true;
                            that.requestDataSourceResults(key, url, dataSource.crossDomain);
                	    }
                	}
                }, 150);
            });

            typeAhead.bind('typeahead:selected', function (obj, datum, name) {
                if (datum.hasOwnProperty("path")) {
                    //it's an instance
                    that.confirmed(datum.path);
                }
                else if (datum.hasOwnProperty("label")) {
                    //it's a suggestion
                    that.confirmed(datum.label);
                }
            });

            //fire key event on paste
            typeAhead.on("paste", function(){$(this).trigger("keypress",{ keyCode: 13 });});

            GEPPETTO.on(GEPPETTO.Events.Model_loaded, function () {
            	if(that.initialised){
            		that.initialised=false;
            		that.instances.initialize(true);
                    that.addData(GEPPETTO.ModelFactory.allPathsIndexing);
            	}
            });

            //Initializing Bloodhound sources, we have one for instances and one for the suggestions
            this.instances = new Bloodhound({
                datumTokenizer: function (str) {
                    return str.path ? str.path.split(".") : [];
                },
                queryTokenizer: function (str) {
                    return str ? str.split(/[\.\s]/) : [];
                },
                identify: function (obj) {
                    return obj.path;
                }
            });

            this.suggestions = new Bloodhound({
            	datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
            	queryTokenizer: Bloodhound.tokenizers.whitespace,
            	identify: function (obj) {
            		return obj.label;
            	}
            });

            this.initDataSourceResults();

            Handlebars.registerHelper('geticonFromMetaType', function (metaType) {
                if (metaType) {
                    return new Handlebars.SafeString("<icon class='fa " + GEPPETTO.Resources.Icon[metaType] + "' style='margin-right:5px; color:" + GEPPETTO.Resources.Colour[metaType] + ";'/>");
                }
            });

            Handlebars.registerHelper('geticon', function (icon) {
                if (icon) {
                    return new Handlebars.SafeString("<icon class='fa " + icon + "' style='margin-right:5px;'/>");
                }
            });

            if(GEPPETTO.ForegroundControls != undefined){
                GEPPETTO.ForegroundControls.refresh();
            }

			GEPPETTO.on(GEPPETTO.Events.Project_loaded, function () {
				//Hides or Shows tool bar depending on login user permissions
				that.updateToolBarVisibilityState(that.checkHasWritePermission());
			});

			GEPPETTO.on(GEPPETTO.Events.Project_persisted, function () {
				//Hides or Shows tool bar depending on login user permissions
				that.updateToolBarVisibilityState(that.checkHasWritePermission());
			});
			GEPPETTO.on(GEPPETTO.Events.Experiment_completed, function (experimentId) {
				that.updateToolBarVisibilityState(that.checkHasWritePermission(experimentId));
			});

			GEPPETTO.on(GEPPETTO.Events.Experiment_running, function () {
				//Hides or Shows tool bar depending on login user permissions
				that.updateToolBarVisibilityState(that.checkHasWritePermission());
			});

			GEPPETTO.on(GEPPETTO.Events.Experiment_failed, function () {
				//Hides or Shows tool bar depending on login user permissions
				that.updateToolBarVisibilityState(that.checkHasWritePermission());
			});

			GEPPETTO.on(GEPPETTO.Events.Experiment_active, function () {
				that.updateToolBarVisibilityState(that.checkHasWritePermission());
			});

            GEPPETTO.on(GEPPETTO.Events.Instances_created, function(instances){
        		that.addData(GEPPETTO.ModelFactory.newPathsIndexing);
            });

			this.updateToolBarVisibilityState(this.checkHasWritePermission());
            this.addData(GEPPETTO.ModelFactory.allPathsIndexing);
        },

		/**
		 * Returns true if user has permission to write and project is persisted
		 */
		checkHasWritePermission : function(experimentId){
			var visible = true;
			if(!GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT) || !window.Project.persisted || !GEPPETTO.UserController.isLoggedIn()){
				visible = false;
			}

			if(window.Project!= undefined && window.Project.getActiveExperiment()!=null || window.Project.getActiveExperiment()!=undefined){
				if(window.Project.getActiveExperiment().getId() == experimentId){
					visible = false;
				}

				if(window.Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
					visible = false;
				}
            }
			return visible;
        },

        focusButtonBar : function(){
			$(".tt-menu").hide();
			$(".spotlight-button").eq(0).focus();
			$(".spotlight-input").eq(0).focus();
        },

        formatButtonActions : function(button, id, label){
		    var actions, newActions;
		    if(button.condition!=null && button.condition!=undefined){
		    	actions = button[false].actions;
		    	newActions = this.replaceActionHolders(actions, id,label);
			    button[false].actions = newActions;

			    actions = button[true].actions;
		    	newActions = this.replaceActionHolders(actions, id,label);
			    button[true].actions = newActions;
		    }else{
		    	actions = button.actions;
		    	newActions = this.replaceActionHolders(actions, id,label);
			    button.actions = newActions;
		    }
        },

        replaceActionHolders : function(actions, id, label){
        	var newActions = JSON.parse(JSON.stringify(actions));
    		for(var i=0; i < actions.length; i++) {
    			newActions[i] = newActions[i].replace(/\$ID\$/g, id);
    			newActions[i] = newActions[i].replace(/\$LABEL\$/gi,label);
    		}

    		return newActions;
        },

        confirmed: function (item) {
            //check suggestions
            var found;
            var actions;

            if (item && item != "") {
                var suggestionFound = false;

                if (this.suggestions.get(item)) {
                    found = this.suggestions.get(item);
                    if (found.length == 1) {
                        suggestionFound = true;
                        var actions = found[0].actions;
                        actions.forEach(function (action) {
                            GEPPETTO.CommandController.execute(action, true);
                        });
                        $("#typeahead").typeahead('val', "");
                    }
                }

                if (this.dataSourceResults.get(item)) {
                    found = this.dataSourceResults.get(item);

                    if (found.length == 1) {
                        suggestionFound = true;

                        // evil eval to check if the id maps to an existing instance
                        var inst = undefined;
                        try {
                            inst = eval(found[0]["id"]);
                        } catch (e) {
                            // we don't really wanna do anything here
                        }

                        // try handling instance in case we have already resolved it
                        if(inst != undefined){
                            this.handleInstanceSelection(found[0]["id"]);
                        } else {
                            // one does not simply assign buttons without deep cloning them
                            var buttons = JSON.parse(JSON.stringify(found[0].buttons));
                            //data source item has buttons
                            if(buttons!=null && buttons!=undefined){
                                var button;
                                //format button actions to have proper values instead of placeholders
                                for (var prop in buttons) {
                                    if( buttons.hasOwnProperty( prop ) ) {
                                        button = buttons[prop];
                                        this.formatButtonActions(button,found[0]["id"], found[0]["label"]);
                                    }
                                }
                                var tbar = $('<div>').addClass('spotlight-toolbar');
                                tbar.append(this.BootstrapMenuMaker.createButtonGroup("DataSource", buttons, null));
                                $(".spotlight-toolbar").remove();
                                $('#spotlight').append(tbar);
                                this.focusButtonBar();
                            }//data source is straight up execution of actions
                            else{
                                actions = found[0].actions;
                                actions.forEach(function (action) {
                                    GEPPETTO.CommandController.execute(action, true);
                                });
                                $("#typeahead").typeahead('val', "");
                            }
                        }
                    }
                }

                // no suggestions or datasource hits were found, fall back on instances (default)
                if (!suggestionFound) {
                	try{
                		this.handleInstanceSelection(item);
                	}catch (e){
                		//TODO: Simulation Handler throws error when not finding an instance, should probably be handled different for Spotlight
                	}
                }
            }
        },

        handleInstanceSelection: function(item){
            var instanceFound = false;
            var entity = undefined;

			try{
            	entity = eval(item);
            } catch(e){
				// eval didn't work - keep going, could be a potential instance
			}

            window._spotlightInstance = (entity != undefined)? [entity] : Instances.getInstance([item]);

            if (window._spotlightInstance) {
                instanceFound = true;
                this.loadToolbarFor(window._spotlightInstance);

                if ($(".spotlight-toolbar").length == 0) {
                    this.loadToolbarFor(window._spotlightInstance);
                }
                this.focusButtonBar();
            }

            return instanceFound;
        },

        defaultSuggestions: function (q, sync) {
            if (q === '') {
                sync(this.suggestions.index.all());
            }
            else {
                this.suggestions.search(q, sync);
            }
        },

        defaultDataSources: function (q, sync) {
            if (q === '') {
                sync(this.dataSourceResults.index.all());
            }
            else {
                this.dataSourceResults.search(q, sync);
            }
        },

        defaultInstances: function (q, sync) {
            if(this.props.indexInstances) {
            	if (q === '') {
                	var rootInstances = [];
                	for (var i = 0; i < window.Instances.length; i++) {
                    	rootInstances.push(window.Instances[i].getId());
                	}
                	sync(this.instances.get(rootInstances));
            	}
            	else {
                	this.instances.search(q, sync);
            	}
            }
        },


        initTypeahead: function () {
            $('#typeahead').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 0
                },
                {
                    name: 'suggestions',
                    source: this.defaultSuggestions,
                    limit: 5,
                    display: 'label',
                    templates: {
                        suggestion: Handlebars.compile('<div class="spotlight-suggestion">{{geticon icon}} {{label}}</div>')
                    }
                },
                {
                    name: 'instances',
                    source: this.defaultInstances,
                    limit: 50,
                    display: 'path',
                    templates: {
                        suggestion: Handlebars.compile('<div>{{geticonFromMetaType metaType}} {{path}}</div>')
                    }
                },
                {
                    name: 'dataSourceResults',
                    source: this.defaultDataSources,
                    limit: 50,
                    display: 'label',
                    templates: {
                        suggestion: Handlebars.compile('<div>{{geticon icon}} {{label}}</div>')
                    }
                });
            $('.twitter-typeahead').addClass("typeaheadWrapper");
        },

        openToInstance: function (instance) {
            $("#spotlight").show();
            var typeAhead = $("#typeahead");
            typeAhead.focus();
            typeAhead.typeahead('val', instance.getPath());
            typeAhead.trigger(jQuery.Event("keypress", {which: 13}));
        },

        open: function (flowFilter, useSelection) {
            if (useSelection == undefined) {
                useSelection = false;
            }
            this.suggestions.initialize(true);
            if(!this.initialised){
            	this.addData(GEPPETTO.ModelFactory.allPathsIndexing);
            }
            var that = this;
            if (flowFilter) {
                if ($.isArray(flowFilter)) {
                    $.each(flowFilter, function (index, value) {
                        if (that.potentialSuggestions[value]) {
                            that.suggestions.add(that.potentialSuggestions[value]);
                        }
                    });
                }
                else {
                    if (flowFilter && that.potentialSuggestions[flowFilter]) {
                        that.suggestions.add(that.potentialSuggestions[flowFilter]);
                    }
                }

            }
            else {
                $.each(this.potentialSuggestions, function (key, value) {
                    that.suggestions.add(value);
                });
            }

            if (useSelection) {
                var selection = GEPPETTO.SceneController.getSelection();
                if (selection.length > 0) {
                    this.openToInstance(selection[selection.length - 1]);
                    return;
                }
            }

            $("#spotlight").show();

            var typeAhead = $("#typeahead");
            typeAhead.focus();
            typeAhead.typeahead('val', "init"); //this is required to make sure the query changes otherwise typeahead won't update
            typeAhead.typeahead('val', "");
        },

        initDataSourceResults: function(datumToken, queryToken, sorter){
            this.dataSourceResults = new Bloodhound({
                datumTokenizer: (datumToken != undefined) ? datumToken : Bloodhound.tokenizers.obj.whitespace('label'),
                queryTokenizer: (queryToken != undefined) ? queryToken : Bloodhound.tokenizers.nonword,
                identify: function (obj) {
                    return obj.label;
                },
                sorter: sorter
            });
        },

        /**
         * Requests external data sources.
         *
         */
        addDataSource : function(sources){
        	try {
        		for (var key in sources) {
        			  if (sources.hasOwnProperty(key)) {
        			    var obj = sources[key];
                        var keysha = this.generateDataSourceKey(key, 0);
                        this.configuration.SpotlightBar.DataSources[keysha] = obj;

                        if(obj.bloodhoundConfig) {
                            this.initDataSourceResults(
                                obj.bloodhoundConfig.datumTokenizer,
                                obj.bloodhoundConfig.queryTokenizer,
                                obj.bloodhoundConfig.sorter
                            );
                        }
        			  }
        		}
        	}
        	catch (err) {
        		throw ("Error parsing data sources " + err);
        	}
        },

        /**
         * Figure out if data source of same name is already in there. If it is,
         * create a new key for it.
         */
        generateDataSourceKey : function(key, index){
        	var dataSource = this.configuration.SpotlightBar.DataSources[key];
		    if(dataSource!=null || dataSource !=undefined){
		    	key = key.concat(index);
		    	this.generateDataSourceKey(key, index++);
		    }

        	return key;
        },

        /**
         * Requests results for an external data source
         *
         * @param data_source_name : Name of the Data Source to request results from
         * @param data_source_url : URL used to request data source results
         * @param crossDomain : URL allows cross domain
         * @param update : False if request for data source is the first time, true for update
         */
        requestDataSourceResults : function(data_source_name, data_source_url, crossDomain){
            var that = this;
        	//not cross domain, get results via java servlet code
        	if(!crossDomain){
        		var parameters = {};
        		parameters["data_source_name"] = data_source_name;
        		parameters["url"] = data_source_url;
        		GEPPETTO.MessageSocket.send("get_data_source_results", parameters);
        	}else{
        		//cross domain, do ajax query for results
        		$.ajax({
        			type: 'GET',
        			dataType: 'text',
        			url: data_source_url,
        			success: function (responseData, textStatus, jqXHR) {
        				that.updateDataSourceResults(data_source_name, JSON.parse(responseData));
        			},
        			error: function (responseData, textStatus, errorThrown) {
                		throw ("Error retrieving data sources " + data_source_name + "  from " + data_source_url);
        			}
        		});
        	}
        },

        /**
         * Update the datasource results with results that come back
         *
         * @param data_source_name
         * @param results
         */
        updateDataSourceResults : function(data_source_name, results){
            var that = this;
        	var responses = results.response.docs;
    		responses.forEach(function(response) {
        		that.formatDataSourceResult(data_source_name, response);
        	});

			//If it's an update request to show the drop down menu, this for it to show
			//updated results
			if(this.updateResults){
                var typeAhead = $("#typeahead");
				var value = typeAhead.val();
                typeAhead.typeahead('val', "init"); //this is required to make sure the query changes otherwise typeahead won't update
                typeAhead.typeahead('val', value);
			}
        },

        /**
         * Format incoming data source results into specified format in configuration script
         */
        formatDataSourceResult : function(data_source_name,response){
        	//create searchable result for main label
    		var labelTerm = this.configuration.SpotlightBar.DataSources[data_source_name].label.field;
    		var idTerm = this.configuration.SpotlightBar.DataSources[data_source_name].id;
    		var mainLabel = response[labelTerm];
    		var id = response[idTerm];
    		var labelFormatting = this.configuration.SpotlightBar.DataSources[data_source_name].label.formatting;
    		var formattedLabel = labelFormatting.replace('$VALUE$', mainLabel);
    		formattedLabel = formattedLabel.replace('$ID$', id);

    		this.createDataSourceResult(data_source_name, response, formattedLabel, id);

    		var explodeFields = this.configuration.SpotlightBar.DataSources[data_source_name].explode_fields;
    		for(var i =0; i<explodeFields.length; i++){
    			//create searchable result using id as label
    			var idsTerm = explodeFields[i].field;
    			var idLabel = response[idsTerm];
    			labelFormatting = explodeFields[i].formatting;
    			formattedLabel = labelFormatting.replace('$VALUE$', idLabel);
    			formattedLabel = formattedLabel.replace('$LABEL$', mainLabel);

    			this.createDataSourceResult(data_source_name, response, formattedLabel, id);
    		}

    		var explodeArrays = this.configuration.SpotlightBar.DataSources[data_source_name].explode_arrays;
    		for(var i =0; i<explodeArrays.length; i++){
    			labelFormatting = explodeArrays[i].formatting;
    			//create searchable results using synonyms as labels
    			var searchTerm = explodeArrays[i].field;
    			var results = response[searchTerm];
    			if(results!=null || undefined){
    				for(var j =0; j<results.length; j++){
    					var result = results[j];
    					formattedLabel = labelFormatting.replace('$VALUE$', result);
    					formattedLabel = formattedLabel.replace('$LABEL$', mainLabel);
    					formattedLabel = formattedLabel.replace('$ID$', id);

    					this.createDataSourceResult(data_source_name, response, formattedLabel, id);
    				}
    			}
    		}
        },

        /**
         * Creates a searchable result from external data source response
         */
        createDataSourceResult : function(data_source_name, response, formattedLabel, id){
        	var typeName = response.type;

        	var buttons = this.configuration.SpotlightBar.DataSources[data_source_name].type[typeName].buttons;

    		var obj = {};
    		obj["label"] = formattedLabel;
    		obj["id"] = id;
    		obj["icon"] = this.configuration.SpotlightBar.DataSources[data_source_name].type[typeName].icon;
        	if(buttons!= null || undefined){
        		obj["buttons"] = buttons;
        	}else{
    		//replace $ID$ with one returned from server for actions
    		var actions = this.configuration.SpotlightBar.DataSources[data_source_name].type[typeName].actions;
        		obj["actions"] = this.replaceActionHolders(actions, obj["id"], obj["label"]);
    		}
    		this.dataSourceResults.add(obj);
        },

        addSuggestion: function (suggestion, flow) {
            if (flow == undefined) {
                flow = GEPPETTO.Resources.SEARCH_FLOW;
            }
            if (!this.potentialSuggestions[flow]) {
                this.potentialSuggestions[flow] = [];
            }
            this.potentialSuggestions[flow].push(suggestion);
            if (flow == GEPPETTO.Resources.SEARCH_FLOW) {
                //the only suggestions always displayed are those for the search flow
                this.suggestions.add(suggestion);
            }
        },


        BootstrapMenuMaker: {
            named: function (constructor, name, def, instance) {
                return constructor.bind(this)(def, name, instance).attr('id', name);
            },


            buttonCallback: function (button, name, bInstance) {
                var instance = bInstance;
                var that = this;
                return function () {
                    button.actions.forEach(function (action) {
                        GEPPETTO.CommandController.execute(that.getCommand(action, instance), true);
                    });
                    $("#" + name).focus();
                }
            },

            statefulButtonCallback: function (button, name, bInstance) {
                var that = this;
                var instance = bInstance;
                return function () {
                    var condition = that.execute(button.condition, instance);
                    var actions = button[condition].actions;
                    actions.forEach(function (action) {
                        GEPPETTO.CommandController.execute(that.getCommand(action, instance), true);
                    });
                    that.switchStatefulButtonState(button, name, condition);
                }
            },

            switchStatefulButtonState: function (button, name, condition) {
                $("#" + name)
                    .attr('title', button[condition].tooltip)
                    .removeClass(button[condition].icon)
                    .addClass(button[!condition].icon);
                $("#" + name + " .spotlight-button-label").html(button[!condition].label);
            },

            getCommand: function (action, instance, value) {
                var label="";
                var processed="";
                if($.isArray(instance) && instance[0] instanceof Instance){
                    if (instance.length == 1) {
                        label = instance[0].getPath();
                    } else {
                        label = "Multiple instances of " + instance[0].getVariable().getId();
                    }
                    processed = action.split("$instances$").join("_spotlightInstance");
                    processed = processed.split("$instance0$").join("_spotlightInstance[0]");
                    processed = processed.split("$label$").join(label);
                    processed = processed.split("$value$").join(value);
                    processed = processed.split("$type$").join(instance[0].getType().getPath());
                    processed = processed.split("$typeid$").join(instance[0].getType().getId());
                    processed = processed.split("$variableid$").join(instance[0].getVariable().getId());
                } else if ($.isArray(instance) && instance[0] instanceof Variable) {
                	processed = action.split("$instances$").join("_spotlightInstance");
                	processed = processed.split("$instance0$").join("_spotlightInstance[0]");
                    processed = processed.split("$label$").join(instance[0].getPath());
                    processed = processed.split("$value$").join(value);
                    processed = processed.split("$type$").join(instance[0].getType().getPath());
                    processed = processed.split("$typeid$").join(instance[0].getType().getId());
                    processed = processed.split("$variableid$").join(instance[0].getId());
                } else if (instance == undefined || instance == null) {
                    // pass through scenario in case we have no instance
                    // this happens for external datasources before the instance gets created
                    processed = action.split("$value$").join(value);;
                }

                return processed;
            },

            execute: function (action, instance) {
                return eval(this.getCommand(action, instance));
            },

            createUIElement: function (element, name, instance) {
                var label = null;
                var uiElement = null;
                var that=this;
                if (element.hasOwnProperty("condition")) {
                    //a stateful button
                    var condition = this.execute(element.condition, instance);
                    var b = element[condition];
                    label = $("<div class='spotlight-button-label'>").html(b.label);
                    uiElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(b.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', b.tooltip)
                        .attr('container', 'body')
                        .on('click', this.statefulButtonCallback(element, name, instance));
                    uiElement.append(label);
                }
                else if (element.hasOwnProperty("inputValue")) {
                    //an input box

                    if(!(instance.length>1)){
                        uiElement=$("<div>");
                        var value=eval(this.getCommand(element.inputValue, instance));
                        var unit=eval(this.getCommand(element.label, instance));
                        label = $("<div class='spotlight-input-label'>").html(unit);
                        var staticLabel=$("<div class='spotlight-input-label-info'>").html("This parameter is declared as <span class='code'>STATIC</span> in the underlying model, changing it will affect all of its instances.");
                        var input = $('<input>')
                            .addClass('spotlight-input')
                            .attr('value', value)
                            .on('change', function() {
                                var value=$("#" + name + " .spotlight-input").val();
                                GEPPETTO.CommandController.execute(that.getCommand(element.onChange, instance,value), true);
                            })
                            .css("width",((value.length + 1) * 14) + 'px')
                            .on('keyup',function() {
                                this.style.width = ((this.value.length + 1) * 14) + 'px';
                            });

                        if(instance[0] instanceof Variable && instance[0].isStatic()){
                            uiElement.append(staticLabel);
                        }

                        uiElement.append(input);
                        uiElement.append(label);
                    }
                }
                else {
                    label = $("<div class='spotlight-button-label'>").html(element.label);
                    uiElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(element.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', element.tooltip)
                        .attr('container', 'body')
                        .on('click', this.buttonCallback(element, name, instance));
                    uiElement.append(label);
                }


                return uiElement;
            },

            createButtonGroup: function (bgName, bgDef, bgInstance) {
                var that = this;
                var instance = bgInstance;

                var bg = $('<div>').addClass('btn-group').attr('role', 'group').attr('id', bgName);
                $.each(bgDef, function (bName, bData) {
                    var button = that.named(that.createUIElement, bName, bData, instance);
                    bg.append(button);
                    $(button).keypress(that, function (e) {
                        if (e.which == 13 || e.keyCode == 13)  // enter
                        {
                            if (button.hasOwnProperty("condition")) {
                                e.data.statefulButtonCallback(button, instance);
                            }
                            else {
                                e.data.buttonCallback(button, instance);
                            }

                        }
                    });
                    $(button).keydown(that, function (e) {
                        if (e.which == 27 || e.keyCode == 27)  // escape
                        {
                            $(".spotlight-toolbar").remove();
                            $('#typeahead').focus();
                            e.stopPropagation();
                        }
                    });
                    $(button).keydown(function (e) {
                        if (e.which == 9 || e.keyCode == 9)  // tab
                        {
                            e.preventDefault();
                            var next = $(this).next();
                            if (next.length == 0) {
                                //check if there is a sibling of the parent, i.e. another buttonGroup
                                var nextParent = $(this).parent().next();
                                if (nextParent.length > 0) {
                                    next = $(nextParent).eq(0).children(" .spotlight-button").eq(0);
                                }
                                else {
                                    next = $(".spotlight-button").eq(0);
                                }
                            }
                            $(next).focus();
                        }
                    });
                    $(button).mouseover(function (e) {
                        $(button).focus();
                    });
                    $(button).mouseout(function (e) {
                        $(".typeahead-wrapper").focus();
                    })
                });
                return bg;
            },

            generateToolbar: function (buttonGroups, instance, modifiable) {
                var that = this;
                var tbar = $('<div>').addClass('spotlight-toolbar');
                var instanceToCheck = instance;
                if ($.isArray(instance)) {
                    //asterisk was used, this is an array
                    instanceToCheck = instance[0];
                }
                $.each(buttonGroups, function (groupName, groupDef) {
                    if ((instanceToCheck.getCapabilities().indexOf(groupName) != -1) ||
                        (instanceToCheck.getType().getMetaType() == groupName)) {
            			var copiedObject = jQuery.extend({}, groupDef);
                		if(modifiable){
                			delete copiedObject["plot"];
                			tbar.append(that.createButtonGroup(groupName, copiedObject, instance));
                		}else{
                			//don't load default toolbar for these two types if modifiable flag set to false,
                			if(groupName!="StateVariableCapability" && groupName!="ParameterCapability"){
            					var copiedObject = jQuery.extend({}, groupDef);
                				if(modifiable){
                        			delete copiedObject["plot"];
                				}
                                tbar.append(that.createButtonGroup(groupName, copiedObject, instance));
                			}else{
                				//don't show watch button if no permissions
                				if(groupName == "StateVariableCapability"){
                					//make copy since modifying original removes it through session
                					var copiedObject = jQuery.extend({}, groupDef);
                					if(instanceToCheck.watched){
                						delete copiedObject["watch"];
                					}else{
                						if(!modifiable){
                							delete copiedObject["watch"];
                						}
                						delete copiedObject["plot"];
                					}
                   					tbar.append(that.createButtonGroup(groupName, copiedObject, instance));
                				}
                			}
                		}
                    }
                });

                return tbar;
            }
        },

        //Used to determined if toolbar for parameter and state variable can be shown.
        //Flag set to false if user don't have enough permissions to modify parameters/state variables
        updateToolBarVisibilityState : function(visible){
        	this.modifiable = visible;
        },

        loadToolbarFor: function (instance) {
            $(".spotlight-toolbar").remove();
        	$('#spotlight').append(this.BootstrapMenuMaker.generateToolbar(this.configuration.SpotlightBar, instance, this.modifiable));
        },

        render: function () {
            return <input id = "typeahead" className = "typeahead" type = "text" placeholder = "Lightspeed Search" />
        },

        setButtonBarConfiguration: function(config){
            this.configuration = config;
        },

        configuration: {
            "SpotlightBar": {
            	"DataSources" : {

            	},
                "CompositeType": {
                    "type": {
                        "actions": [
                            "G.addWidget(3).then(w=>{w.setData($type$).setName('$typeid$');});",
                        ],
                        "icon": "fa-puzzle-piece",
                        "label": "Explore type",
                        "tooltip": "Explore type"
                    }
                },
                "TextType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).then(w=>{w.setText($instance0$).setName('$variableid$');});",
                        ],
                        "icon": "fa-eye",
                        "label": "View text",
                        "tooltip": "View text"
                    }
                },
                "HTMLType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).then(w=>{w.setHTML($instance0$).setName('$variableid$').addCustomNodeHandler(function(node){G.addWidget(3).then(w=>{w.setData(node);});}, 'click');});",
                        ],
                        "icon": "fa-eye",
                        "label": "View HTML",
                        "tooltip": "View HTML"
                    }
                },
                "VisualCapability": {
                    "buttonOne": {
                        "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                        "false": {
                            "actions": ["GEPPETTO.SceneController.select($instances$)"],
                            "icon": "fa-hand-stop-o",
                            "label": "Unselected",
                            "tooltip": "Select"
                        },
                        "true": {
                            "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                            "icon": "fa-hand-rock-o",
                            "label": "Selected",
                            "tooltip": "Deselect"
                        },
                    },
                    "buttonTwo": {
                        "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                        "false": {
                            "actions": [
                                "GEPPETTO.SceneController.show($instances$)"
                            ],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show"
                        },
                        "true": {
                            "actions": [
                                "GEPPETTO.SceneController.hide($instances$)"
                            ],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide"
                        }

                    },
                    "buttonThree": {
                        "actions": [
                            "GEPPETTO.SceneController.zoomTo($instances$)"
                        ],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                },
                "ParameterCapability": {
                    "parameterInput": {
                        "inputValue":"$instance0$.getValue()",
                        "label":"$instance0$.getUnit()",
                        "onChange":"$instance0$.setValue($value$);",
                        "tooltip": "Set parameter value",
                        "multipleInstances":false
                    }
                },
                "StateVariableCapability": {
                    "watch": {
                        "condition": "GEPPETTO.ExperimentsController.isWatched($instances$);",
                        "false": {
                            "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,true);"],
                            "icon": "fa-circle-o",
                            "label": "Not recorded",
                            "tooltip": "Record the state variable"
                        },
                        "true": {
                            "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,false);"],
                            "icon": "fa-dot-circle-o",
                            "label": "Recorded",
                            "tooltip": "Stop recording the state variable"
                        }
                    },
                    "plot": {
                        "actions": [
                            "GEPPETTO.Spotlight.plotController.plotStateVariable(window.Project.getId(),window.Project.getActiveExperiment().getId(),$instance0$.getPath())",
                        ],
                        "icon": "fa-area-chart",
                        "label": "Plot",
                        "tooltip": "Plot state variable"
                    }
                }

            }
        },
    });

    return Spotlight;
});
