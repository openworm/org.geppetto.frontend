/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

define(function (require) {

    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    loadCss("geppetto/js/components/dev/query/query.css");
    loadCss("geppetto/js/components/dev/query/vendor/css/react-simpletabs.css");

    var React = require('react'), $ = require('jquery');
    var ReactDOM = require('react-dom');
    var Griddle = require('griddle');
    var Tabs = require('geppetto/js/components/dev/query/vendor/js/react-simpletabs.js');
    var typeahead = require('typeahead');
    var bh = require('bloodhound');
    var handlebars = require('handlebars');
    var GEPPETTO = require('geppetto');

	var MenuButton = require('jsx!./../menubutton/MenuButton')

    // query model object to represent component state and trigger view updates
    var queryBuilderModel = {
        // list of change handlers called on change
        onChangeHandlers: [],
        // query items present in the query builder
        items: [],
        // fetched results
        results: [],
        // result count for the current query items
        count: 0,

        // subscribe to model change notifications
        subscribe: function (callback) {
            this.onChangeHandlers.push(callback);
        },

        // notify to all listeners that the model has changed
        notifyChange: function () {
            this.onChangeHandlers.forEach(function (cb) {
                cb();
            });
        },

        itemSelectionChanged: function (item, selection, callback) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.id == this.items[i].id) {
                    this.items[i].selection = selection;
                    break;
                }
            }

            // get count triggers notify change once results are fetched
            this.getCount(callback);
        },

        // add query item to model
        addItem: function(item, callback){
            this.items.push(item);

            // get count triggers notify change once results are fetched
            this.getCount(callback);
        },

        // delete single query item from model
        deleteItem: function (item, callback) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.id == this.items[i].id) {
                    this.items.splice(i, 1);
                }
            }

            if(this.items.length >0) {
                // get count triggers notify change once results are fetched
                this.getCount(callback);
            } else {
                // set count triggers notify change
                this.setCount(0, callback);
            }
        },

        // clear all query items from model
        clearItems: function(){
            this.items = [];
            this.count = 0;
            this.notifyChange();
        },

        // Asynchronous call to the server to get the results count for the given query items
        getCount: function(callback){
            var queryDTOs = [];

            for(var i=0; i<this.items.length; i++){
                var selection = this.items[i].selection;
                if(selection != -1){
                    var queryDTO = {
                        target: this.items[i].target,
                        query: this.items[i].options[selection+1].queryObj
                    };

                    queryDTOs.push(queryDTO);
                }
            }

            var getCountDoneCallback = function(count){
                this.setCount(count, callback);
            };

            GEPPETTO.QueriesController.getQueriesCount(queryDTOs, getCountDoneCallback.bind(this));
        },

        setCount(count, callback){
            this.count = count;
            callback();
            this.notifyChange();
        },

        addResults: function(results){
            // loop results and unselect all
            for(var i=0; i<this.results.length; i++){
                this.results[i].selected = false;
            }

            // always add the new one at the start of the list to simulate history
            this.results.unshift(results);
            this.notifyChange();
        },

        deleteResults: function(results) {
        	GEPPETTO.Console.debugLog("delete results");
            for (var i = 0; i < this.results.length; i++) {
                if (results.id == this.results[i].id) {
                    this.results.splice(i, 1);
                }
            }

            this.notifyChange();
        },

        resultSelectionChanged: function(resultsSetId){
            // loop results and change selection
            for(var i=0; i<this.results.length; i++){
                if(this.results[i].id == resultsSetId) {
                    this.results[i].selected = true;
                    // move selected at the top of the list to simulate history
                    var match = this.results[i];
                    this.results.splice(i, 1);
                    this.results.unshift(match);
                } else {
                    this.results[i].selected = false;
                }
            }

            this.notifyChange();
        }
    };

    GEPPETTO.SlideshowImageComponent = React.createClass({
        isCarousel: false,

        imageContainerId: '',
        fullyLoaded : false, 
        
        getInitialState: function () {
            return {
                carouselFullyLoaded : false,
            };
        },

        componentDidMount: function(){
            // apply carousel
            if(this.isCarousel) {
                $('#' + this.imageContainerId + '.slickdiv').slick();
                var that = this;
                
                //reload slick carousel if it's first time clicking on arrow in any direction
                $('#' + this.imageContainerId + '.slickdiv').find(".slick-arrow").on("click", function(){
                	if(!that.fullyLoaded){
                		that.setState({carouselFullyLoaded : true});
                		that.fullyLoaded = true;
                	}
                });
            }
        },
        
        componentDidUpdate(params) {
        	//on component refresh, update slick carousel
            $('#' + this.imageContainerId + '.slickdiv').slick('unslick').slick();
        },
        
        buildCarousel : function(){
            var jsonImageVariable = JSON.parse(this.props.data);
            var imgElement = "";
            
            if (jsonImageVariable.initialValues[0] != undefined) {
                var imageContainerId = this.props.rowData.id + '-image-container';
                this.imageContainerId = imageContainerId;

                var value = jsonImageVariable.initialValues[0].value;
                if (value.eClass == GEPPETTO.Resources.ARRAY_VALUE) {
                    this.isCarousel = true;
                    var imagesToLoad = 2;
                    if(this.state.carouselFullyLoaded){
                    	imagesToLoad = value.elements.length;
                    }
                     
                    //set flag to fully loaded if total length of images to render is less or equal to 2
                    if(value.elements.length<=2){
                    	this.fullyLoaded = true;
                    }
                    
                    //if it's an array, create a carousel (relies on slick)
                    var elements = value.elements.map(function (item, key) {
                    	if(key<imagesToLoad){
                    		var image = item.initialValue;
                    		return <div key={key} className="query-results-slick-image"> {image.name}
                    		<img className="popup-image invert" src={image.data}/>
                    		</div>
                    	}
                    });
                    
                    elements = elements.slice(0,imagesToLoad);

                    imgElement = <div id={imageContainerId} className="slickdiv query-results-slick collapse in"
                                      data-slick={JSON.stringify({fade: true, centerMode: true, slidesToShow: 1, slidesToScroll: 1})}>
                        {elements}
                    </div>
                }
                else if (value.eClass == GEPPETTO.Resources.IMAGE) {
                    //otherwise we just show an image
                    var image = value;
                    imgElement = <div id={imageContainerId} className="query-results-image collapse in">
                        <img className="query-results-image invert" src={image.data}/>
                    </div>
                }
            }
            
            return imgElement;
        },
        

        render: function () {
            var imgElement = "";
            if(this.props.data != "" && this.props.data != undefined) {
            	imgElement = this.buildCarousel();
            }

            return (
                <div>
                    {imgElement}
                </div>
            )
        }
    });

    GEPPETTO.QueryResultsControlsComponent = React.createClass({

        replaceTokensWithPath: function(inputStr, path){
            return inputStr.replace(/\$ID\$/gi, path);
        },

        getActionString: function (control, path) {
            var actionStr = '';

            if (control.actions.length > 0) {
                for (var i = 0; i < control.actions.length; i++) {
                    actionStr += ((i != 0) ? ";" : "") + this.replaceTokensWithPath(control.actions[i], path);
                }
            }

            return actionStr;
        },

        resolveCondition: function (control, path, negateCondition) {
            if (negateCondition == undefined) {
                negateCondition = false;
            }

            var resolvedConfig = control;

            if (resolvedConfig.hasOwnProperty('condition')) {
                // evaluate condition and reassign control depending on results
                var conditionStr = this.replaceTokensWithPath(control.condition, path);
                if (eval(conditionStr)) {
                    resolvedConfig = negateCondition ? resolvedConfig.false : resolvedConfig.true;
                } else {
                    resolvedConfig = negateCondition ? resolvedConfig.true : resolvedConfig.false;
                }
            }

            return resolvedConfig;
        },

        render: function () {
            // TODO: would be nicer to pass controls and config straight from the parent component rather than assume
            var config = GEPPETTO.QueryBuilder.state.resultsControlsConfig;
            var resultItemId = this.props.rowData.id;
            var ctrlButtons = [];

            // Add common control buttons to list
            for (var control in config.Common) {
                var add = true;

                // check show condition
                if(config.Common[control].showCondition != undefined){
                    var condition = this.replaceTokensWithPath(config.Common[control].showCondition, resultItemId);
                    add = eval(condition);
                }

                if(add) {
                    ctrlButtons.push(config.Common[control]);
                }
            }

            var that = this;

            return (
                <div>
                    {ctrlButtons.map(function (control, id) {
                        // grab attributes to init button attributes
                        var controlConfig = that.resolveCondition(control, resultItemId);
                        var idVal = resultItemId.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '_') + "_" + controlConfig.id + "_queryResults_btn";
                        var tooltip = controlConfig.tooltip;
                        var classVal = "btn queryresults-button fa " + controlConfig.icon;
                        var styleVal = {};

                        // define action function
                        var actionFn = function (param) {
                            // NOTE: there is a closure on 'control' so it's always the right one
                            var controlConfig = that.resolveCondition(control, resultItemId);

                            // take out action string
                            var actionStr = that.getActionString(controlConfig, resultItemId);

                            if (param != undefined) {
                                actionStr = actionStr.replace(/\$param\$/gi, param);
                            }

                            // run action
                            if (actionStr != '' && actionStr != undefined) {
                                GEPPETTO.Console.executeCommand(actionStr);
                                // check custom action to run after configured command
                                if(that.props.metadata.action != '' && that.props.metadata.action != undefined) {
                                    // straight up eval as we don't want this to show on the geppetto console
                                    eval(that.props.metadata.action.replace(/\$ID\$/gi, resultItemId));
                                }
                            }

                            // if conditional, swap icon with the other condition outcome
                            if (control.hasOwnProperty('condition')) {
                                var otherConfig = that.resolveCondition(control, path);
                                var element = $('#' + idVal);
                                element.removeClass();
                                element.addClass("btn queryresults-button fa " + otherConfig.icon);
                            }
                        };

                        return (
                            <span key={id}>
                                <button id={idVal}
                                        className={classVal}
                                        style={styleVal}
                                        title={tooltip}
                                        onClick={actionFn}>
                                </button>
                            </span>
                        )
                    })}
                </div>
            )
        }
    });

    var QueryItem = React.createClass({
        displayName: 'QueryItem',

        getDefaultProps: function () {
            return {
                "item": null,
                "options": [],
                "onSelectOption": undefined,
                "onDeleteItem": undefined,
            };
        },

        getInitialState: function () {
            return {
                // TODO: add if any
            };
        },

        render: function () {
            var createItem = function (item, key) {
                return <option key={key} value={item.value}>{item.name}</option>;
            };

            var that = this;
            var onSelection = function(e){
                var val = parseInt(e.target.value);
                that.props.onSelectOption(that.props.item, val);
            };

            var containerId = "queryitem-" + this.props.item.id;

            return (
                <div id={containerId} className="query-item">
                    <button className="fa fa-trash-o query-item-button" title="delete item" onClick={this.props.onDeleteItem} />
                    <select className="query-item-option" onChange={onSelection} value={this.props.item.selection}>
                        {this.props.item.options.map(createItem)}
                    </select>
                    <div className="clearer"></div>
                </div>
            );
        }
    });

    var QueryFooter = React.createClass({
        displayName: 'QueryFooter',

        getDefaultProps: function () {
            return {
                "count": 0,
                "onRun": undefined,
                "containerClass": ''
            };
        },

        render: function () {
            return (
                <div id="querybuilder-footer" className={this.props.containerClass}>
                    <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="Run query" onClick={this.props.onRun} />
                    <div id="query-results-label">{this.props.count.toString()} results</div>
                </div>
            );
        }
    });

    var QueryBuilder = React.createClass({
        displayName: 'QueryBuilder',
        dataSourceResults: {},
        updateResults : false,
        initTypeAheadCreated : false,
        configuration: { DataSources: {} },
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        defaultDataSources: function (q, sync) {
            if (q === '') {
                sync(this.dataSourceResults.index.all());
            }
            else {
                this.dataSourceResults.search(q, sync);
            }
        },

        getInitialState: function () {
            return {
                resultsView: false,
                errorMsg: '',
                showSpinner: false,
                resultsColumns: null,
                resultsColumnMeta: null,
                resultsControlsConfig: null
            };
        },

        getDefaultProps: function () {
            return {
                model: queryBuilderModel
            };
        },

        componentWillMount: function () {
            GEPPETTO.QueryBuilder = this;
        },

        switchView(resultsView, clearQueryItems) {
            if(clearQueryItems == true){
                this.clearAllQueryItems();
            }

            this.setState({ resultsView: resultsView});
        },

        showBrentSpiner(spin) {
            this.setState({ showSpinner: spin});
        },

        open: function () {
            // show query builder
            $("#querybuilder").show();
        },

        close: function () {
            // hide query builder
            $("#querybuilder").hide();
        },

        setResultsControlsConfig: function(controlsConfig){
            this.setState({resultsControlsConfig: controlsConfig});
        },

        setResultsColumns: function(columns){
            this.setState({resultsColumns: columns});
        },

        setResultsColumnMeta: function(colMeta){
            this.setState({resultsColumnMeta: colMeta});
        },

        initTypeahead: function () {
        	if(!this.initTypeAheadCreated){
        		var that = this;

        		$("#query-typeahead").unbind('keydown');
        		$("#query-typeahead").keydown(this, function (e) {
        			if (e.which == 9 || e.keyCode == 9) {
        				e.preventDefault();
        			}
        		});

        		$("#query-typeahead").unbind('keypress');
        		$("#query-typeahead").keypress(this, function (e) {
        			if (e.which == 13 || e.keyCode == 13) {
        				that.confirmed($("#query-typeahead").val());
        			}
        			if (this.searchTimeOut !== null) {
        				clearTimeout(this.searchTimeOut);
        			}
        			this.searchTimeOut = setTimeout(function () {
        				for (var key in that.configuration.DataSources) {
        					if (that.configuration.DataSources.hasOwnProperty(key)) {
        						var dataSource = that.configuration.DataSources[key];
        						var searchQuery = $("#query-typeahead").val();
        						var url = dataSource.url.replace("$SEARCH_TERM$", searchQuery);
        						that.updateResults = true;
        						that.requestDataSourceResults(key, url, dataSource.crossDomain);
        					}
        				}
        			}, 150);
        		});
        		
        		//fire key event on paste
                $('#query-typeahead').off("paste");
                $('#query-typeahead').on("paste", function(){
                    $(this).trigger("keypress",{ keyCode: 13 });
                });

        		$("#query-typeahead").unbind('typeahead:selected');
        		$("#query-typeahead").bind('typeahead:selected', function (obj, datum, name) {
        			if (datum.hasOwnProperty("label")) {
        				that.confirmed(datum.label);
        			}
        		});

        		$('#query-typeahead').typeahead({
        			hint: true,
        			highlight: true,
        			minLength: 1
        		},
        		{
        			name: 'dataSourceResults',
        			source: this.defaultDataSources,
        			limit: 50,
        			display: 'label',
        			templates: {
        				suggestion: Handlebars.compile('<div>{{geticon icon}} {{label}}</div>')
        			}
        		}
        		);
        		that.initTypeAheadCreated = true;
        	}
        },

        componentDidMount: function () {

            var escape = 27;
            var qKey = 81;

            var that = this;

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == qKey) {
                    // show query builder
                    $("#querybuilder").show();
                }
            });

            $(document).keydown(function (e) {
                if ($("#querybuilder").is(':visible') && e.keyCode == escape) {
                    that.close();
                }
            });

            $("#querybuilder").click(function(e){
                if (e.target==e.delegateTarget){
                    //we want this only to happen if we clicked on the div directly and not on anything therein contained
                    that.close();
                    GEPPETTO.trigger("query_closed");
                }
            });

            Handlebars.registerHelper('geticon', function (icon) {
                if (icon) {
                    return new Handlebars.SafeString("<icon class='fa " + icon + "' style='margin-right:5px;'/>");
                } else {
                    return;
                }
            });

            this.initDataSourceResults();

            this.initTypeahead();

            if(GEPPETTO.ForegroundControls != undefined){
                GEPPETTO.ForegroundControls.refresh();
            }
        },

        componentDidUpdate: function(){
            if(!this.state.resultsView){
                // re-init the search box on query builder
                this.initTypeahead();
            }
        },

        initDataSourceResults: function(datumToken, queryToken, sorter){
            this.dataSourceResults = new Bloodhound({
                datumTokenizer: (datumToken != undefined) ? datumToken : Bloodhound.tokenizers.obj.whitespace('label'),
                queryTokenizer: (queryToken != undefined) ? queryToken :Bloodhound.tokenizers.whitespace,
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
                        var key = this.generateDataSourceKey(key, 0);
                        this.configuration.DataSources[key] = obj;

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
         * Figure out if data source of same name is already in there. If it is create a new key for it.
         */
        generateDataSourceKey : function(key, index){
            var dataSource = this.configuration.DataSources[key]
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

            //If it's an update request to show the drop down menu, this for it to show updated results
            if(this.updateResults){
                var value = $("#query-typeahead").val();
                $("#query-typeahead").typeahead('val', "init"); //this is required to make sure the query changes otherwise typeahead won't update
                $("#query-typeahead").typeahead('val', value);
            }
        },

        /**
         * Format incoming data source results into specified format in configuration script
         */
        formatDataSourceResult : function(data_source_name,response){
            //create searchable result for main label
            var labelTerm = this.configuration.DataSources[data_source_name].label.field;
            var idTerm = this.configuration.DataSources[data_source_name].id;
            var mainLabel = response[labelTerm];
            var id = response[idTerm];
            var labelFormatting = this.configuration.DataSources[data_source_name].label.formatting;
            var formattedLabel = labelFormatting.replace('$VALUE$', mainLabel);
            formattedLabel = formattedLabel.replace('$ID$', id);

            this.createDataSourceResult(data_source_name, response, formattedLabel, id);

            var explodeFields = this.configuration.DataSources[data_source_name].explode_fields;
            for(var i =0; i<explodeFields.length; i++){
                //create searchable result using id as label
                var idsTerm = explodeFields[i].field;
                var idLabel = response[idsTerm];
                labelFormatting = explodeFields[i].formatting;
                formattedLabel = labelFormatting.replace('$VALUE$', idLabel);
                formattedLabel = formattedLabel.replace('$LABEL$', mainLabel);

                this.createDataSourceResult(data_source_name, response, formattedLabel, id);
            }

            var explodeArrays = this.configuration.DataSources[data_source_name].explode_arrays;
            for(var i =0; i<explodeArrays.length; i++){
                labelFormatting = explodeArrays[i].formatting;
                //create searchable results using synonyms as labels
                var searchTerm = explodeArrays[i].field;
                var results = response[searchTerm];
                if(results!=null || undefined){
                    for(var i =0; i<results.length; i++){
                        var result = results[i];
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

            var obj = {};
            obj["label"] = formattedLabel;
            obj["id"] = id;
            //replace $ID$ with one returned from server for actions
            var actions = this.configuration.DataSources[data_source_name].type[typeName].actions;
            var newActions = actions.slice(0);
            for(var i=0; i < actions.length; i++) {
                newActions[i] = newActions[i].replace(/\$ID\$/g, obj["id"]);
                newActions[i] = newActions[i].replace(/\$LABEL\$/gi, obj["label"]);
            }
            obj["actions"] = newActions;
            obj["icon"] = this.configuration.DataSources[data_source_name].type[typeName].icon;
            this.dataSourceResults.add(obj);
        },

        confirmed: function (item) {
            if (item && item != "") {
                if (this.dataSourceResults.get(item)) {
                    var found = this.dataSourceResults.get(item);
                    if (found.length == 1) {
                        var actions = found[0].actions;
                        actions.forEach(function (action) {
                            GEPPETTO.Console.executeCommand(action)
                        });
                        $("#query-typeahead").typeahead('val', "");
                    }
                }
            }
        },

        queryOptionSelected: function(item, value){
            this.clearErrorMessage();

            var callback = function(){
                this.showBrentSpiner(false);
            };

            // hide footer and show spinner
            this.showBrentSpiner(true);

            // Option has been selected
            this.props.model.itemSelectionChanged(item, value, callback.bind(this));
        },

        queryItemDeleted: function(item){
            this.clearErrorMessage();

            var callback = function(){
                this.showBrentSpiner(false);
            };

            // hide footer and show spinner
            this.showBrentSpiner(true);

            this.props.model.deleteItem(item, callback.bind(this));
        },

        /**
         * Clears all query items from the query builder
         */
        clearAllQueryItems: function(){
            this.clearErrorMessage();
            this.props.model.clearItems();
        },

        queryResultDeleted: function(resultsItem){
            this.props.model.deleteResults(resultsItem);
        },

        getCompoundQueryId: function(queryItems){
            var id = "";

            for(var i=0; i<queryItems.length; i++){
                id+=queryItems[i].term + queryItems[i].selection;
            }

            return id;
        },

        runQuery: function(){
            this.clearErrorMessage();
            if(this.props.model.items.length > 0) {

                var allSelected = true;
                for(var i=0; i<this.props.model.items.length; i++){
                    if(this.props.model.items[i].selection == -1){
                        allSelected = false;
                        break;
                    }
                }

                if (!allSelected) {
                    // show error message for unselected query items
                    this.setErrorMessage('Please select an option for all query items.');
                } else if (this.props.model.count == 0) {
                    // show message for no query results
                    this.setErrorMessage('There are no results for this query.');
                } else {
                    // check if we already have results for the given compound query
                    var compoundId = this.getCompoundQueryId(this.props.model.items);
                    var match = false;

                    for (var i = 0; i < this.props.model.results.length; i++) {
                        if (this.props.model.results[i].id == compoundId) {
                            match = true;
                        }
                    }

                    if (!match) {
                        // build query items for data transfer
                        var queryDTOs = [];

                        for (var i = 0; i < this.props.model.items.length; i++) {
                            var selection = this.props.model.items[i].selection;
                            if (selection != -1) {
                                var queryDTO = {
                                    target: this.props.model.items[i].target,
                                    query: this.props.model.items[i].options[selection + 1].queryObj
                                };

                                queryDTOs.push(queryDTO);
                            }
                        }

                        var that = this;
                        var queryDoneCallback = function (jsonResults) {
                            var queryLabel = "";
                            var verboseLabel = "";
                            var verboseLabelPlain = "";
                            for (var i = 0; i < that.props.model.items.length; i++) {
                                queryLabel += ((i != 0) ? "/" : "")
                                    + that.props.model.items[i].term;
                                verboseLabel += ((i != 0) ? "<span> / </span>" : "")
                                    + that.props.model.items[i].options[that.props.model.items[i].selection+1].name;
                                verboseLabelPlain += ((i != 0) ? " / " : "")
                                    + that.props.model.items[i].options[that.props.model.items[i].selection+1].name;
                            }

                            // NOTE: assumption we only have one datasource configured
                            var datasourceConfig = that.configuration.DataSources[Object.keys(that.configuration.DataSources)[0]];
                            var recordsDatasourceFormat = datasourceConfig.resultsFilters.getRecords(JSON.parse(jsonResults));
                            var formattedRecords = recordsDatasourceFormat.map(function (record) {
                                return {
                                    id: datasourceConfig.resultsFilters.getId(record),
                                    name: datasourceConfig.resultsFilters.getName(record),
                                    description: datasourceConfig.resultsFilters.getDescription(record),
                                    images: datasourceConfig.resultsFilters.getImageData(record),
                                    controls: ''
                                }
                            });

                            that.props.model.addResults({
                                id: compoundId,
                                items: that.props.model.items.slice(0),
                                label: queryLabel,
                                verboseLabel: verboseLabel,
                                verboseLabelPLain: verboseLabelPlain,
                                records: formattedRecords,
                                selected: true
                            });

                            // stop showing spinner
                            that.showBrentSpiner(false);

                            // change state to switch to results view
                            that.switchView(true);
                        };

                        // hide footer and show spinner
                        this.showBrentSpiner(true);

                        // run query on queries controller
                        GEPPETTO.QueriesController.runQuery(queryDTOs, queryDoneCallback);
                    } else {
                        // if we already have results for the an identical query switch to results and select the right tab
                        // set the right results item as the selected tab
                        for (var i = 0; i < this.props.model.results.length; i++) {
                            if (this.props.model.results[i].id == compoundId) {
                                this.props.model.results[i].selected = true;
                            } else {
                                this.props.model.results[i].selected = false;
                            }
                        }

                        // trigger refresh
                        this.props.model.notifyChange();

                        // change state to switch to results view
                        this.switchView(true);
                    }
                }
            } else {
                // show error message for empty query
                this.setErrorMessage('Please add query items to run a query.');
            }
        },

        /**
         * Add a query item
         *
         * @param queryItem - Object with term and variable id properties
         */
        addQueryItem: function(queryItemParam){
            this.clearErrorMessage();

            // grab datasource configuration (assumption we only have one datasource)
            var datasourceConfig = this.configuration.DataSources[Object.keys(this.configuration.DataSources)[0]];
            var queryNameToken = datasourceConfig.queryNameToken;

            // retrieve variable from queryItem.id
            var variable = GEPPETTO.ModelFactory.getTopLevelVariablesById([queryItemParam.id])[0];
            var term = variable.getName();

            // retrieve matching queries for variable type
            var matchingQueries = GEPPETTO.ModelFactory.getMatchingQueries(variable.getType());

            if(matchingQueries.length > 0) {
                // build item in model-friendly format
                var queryItem = {
                    term: term,
                    target: variable,
                    options: []
                };

                // fill out options from matching queries
                for (var i = 0; i < matchingQueries.length; i++) {
                    var regx = new RegExp('\\' + queryNameToken, "g");
                    queryItem.options.push({
                            id: matchingQueries[i].getId(),
                            name: matchingQueries[i].getDescription().replace(regx, term),
                            datasource: matchingQueries[i].getParent().getId(),
                            value: i,
                            queryObj: matchingQueries[i]
                        }
                    );
                }

                // count how many occurrences of term we have in the model
                var termCount = 0;
                for (var i = 0; i < this.props.model.items.length; i++) {
                    if (this.props.model.items[i].term == term) {
                        termCount++;
                    }
                }

                // generate a unique id for the query item
                queryItem.id = term + '_' + termCount.toString();
                // add default selection
                queryItem.selection = -1;
                // add default option
                queryItem.options.splice(0, 0, {name: 'Select query for ' + term, value: -1});

                var callback = function(){
                    this.showBrentSpiner(false);
                };

                // hide footer and show spinner
                this.showBrentSpiner(true);

                // add query item to model
                this.props.model.addItem(queryItem, callback.bind(this));
            } else {
                // notify no queries available for the selected term
                this.setErrorMessage("No queries available for the selected term.");
            }

            // init datasource results to avoid duplicates
            this.dataSourceResults.clear();
        },

        setErrorMessage: function(message){
            this.setState({errorMsg : message});
        },

        clearErrorMessage: function(){
            this.setErrorMessage('');
        },

        resultSetSelectionChange: function(val){
            this.props.model.resultSelectionChanged(val);
        },

        render: function () {
            var markup = null;

            // figure out if we are in results view or query builder view
            if(this.state.resultsView && this.props.model.results.length > 0){
                // if results view, build results markup based on results in the model
                // figure out focus tab index (1 based index)
                var focusTabIndex = 1;
                for(var i=0; i<this.props.model.results.length; i++){
                    if(this.props.model.results[i].selected){
                        focusTabIndex = i + 1;
                    }
                }

                // set data for each tab based on results from the model
                // for each tab put a Griddle configured with appropriate column meta
                var tabs = this.props.model.results.map(function (resultsItem) {
                    var getVerboseLabelMarkup = function() {
                          return {__html: resultsItem.verboseLabel};
                    };

                    return (
                        <Tabs.Panel key={resultsItem.id} title={resultsItem.label}>
                            <div className="result-verbose-label" dangerouslySetInnerHTML={getVerboseLabelMarkup()}></div>
                            <button className="fa fa-trash-o querybuilder-button-small delete-result-button"
                                    title="Delete result set"  onClick={this.queryResultDeleted.bind(null, resultsItem)}>
                            </button>
                            <div className="clearer"></div>
                            <Griddle columns={this.state.resultsColumns} results={resultsItem.records}
                            showFilter={true} showSettings={false} enableInfiniteScroll={true} bodyHeight={425}
                            useGriddleStyles={false} columnMetadata={this.state.resultsColumnMeta} />
                        </Tabs.Panel>
                    );
                }, this);

        		var loadHandler = function(self){
        			GEPPETTO.on("query_closed", function(){
        				if(self.state.open){
        					self.toggleMenu();
        				}
        			});
        		};

        		var configuration = {
        				id : "queryResultsButton",
        				openByDefault : false,
        				closeOnClick : true,
        				label: "", 
        				iconOn : 'fa fa-history fa-2x' ,
        				iconOff : 'fa fa-history fa-2x',
        				menuPosition : null,
        				menuSize : {height : "auto", width : 750},
        				menuCSS : "queryButtonMenu",
                        onClickHandler : this.resultSetSelectionChange,
                        onLoadHandler : loadHandler,
        				menuItems : []
        		};
        		
        		var menuItems = this.props.model.results.map(function (resultItem) {
        			return {label : resultItem.verboseLabelPLain, value : resultItem.id, icon: "fa-cogs"};
                });
                
        		configuration["menuItems"] = menuItems;
        		
        		this.initTypeAheadCreated = false;
        		
                markup = (
                    <div id="query-results-container" className="center-content">
                        <MenuButton configuration={configuration}/>
                        <Tabs tabActive={focusTabIndex}>
                            {tabs}
                        </Tabs>
                        <button id="switch-view-btn" className="fa fa-angle-left querybuilder-button"
                                title="Back to query" onClick={this.switchView.bind(null, false, false)}>
                                <div className="querybuilder-button-label">Refine Query</div>
                        </button>
                        <button id="switch-view-clear-btn" className="fa fa-cog querybuilder-button"
                                title="Start new query" onClick={this.switchView.bind(null, false, true)}>
                                <div className="querybuilder-button-label">New Query</div>
                        </button>
                    </div>
                );

            } else {
                // if we ended up in query builder rendering make sure the state flag is synced up
                // NOTE: this could happen if we were in resultsView and the user deleted all the results
                this.state.resultsView = false;

                // build QueryItem list
                var queryItems = this.props.model.items.map(function (item) {
                    return (
                        <QueryItem
                            key={item.id}
                            item={item}
                            onSelectOption={this.queryOptionSelected}
                            onDeleteItem={this.queryItemDeleted.bind(null, item)}
                        />
                    );
                }, this);

                var spinnerClass = this.state.showSpinner ? 'fa fa-cog fa-spin' : 'hide';
                var footerClass = this.state.showSpinner ? 'hide' : '';

                markup = (
                    <div id="query-builder-container">
                        <div id="query-builder-items-container">
                            {queryItems}
                        </div>
                        <div id="add-new-query-container">
                            <button id="add-query-btn" className="fa fa-plus" title="add query" />
                            <input id='query-typeahead' className="typeahead" type="text" placeholder="Terms" />
                        </div>
                        <QueryFooter containerClass={footerClass} count={this.props.model.count} onRun={this.runQuery} />
                        <div id="brent-spiner" className={spinnerClass}></div>
                        <div id="query-error-message">{this.state.errorMsg}</div>
                    </div>
                );
            }

            return markup;
        }
    });

    var renderQueryComponent = function(){
        ReactDOM.render(
            <QueryBuilder />,
            document.getElementById("querybuilder")
        );
    };

    queryBuilderModel.subscribe(renderQueryComponent);

    return QueryBuilder;
});