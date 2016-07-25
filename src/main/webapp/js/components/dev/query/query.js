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
    var GEPPETTO = require('geppetto');

    // query model object to represent component state and trigger view updates
    var queryBuilderModel = {
        onChangeHandlers: [],
        items: [],
        results: [],

        subscribe: function (callback) {
            this.onChangeHandlers.push(callback);
        },

        notifyChange: function () {
            this.onChangeHandlers.forEach(function (cb) {
                cb();
            });
        },

        itemSelectionChanged: function (item, selection) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.id == this.items[i].id) {
                    this.items[i].selection = selection;
                    break;
                }
            }

            this.notifyChange();
        },

        addItem: function(item){
            this.items.push(item);
            this.notifyChange();
        },

        deleteItem: function (item) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.id == this.items[i].id) {
                    this.items.splice(i, 1);
                }
            }

            this.notifyChange();
        },

        addResults: function(results){
            // loop results and unselect all
            for(var i=0; i<this.results.length; i++){
                this.results.selected = false;
            }

            this.results.push(results);
            this.notifyChange();
        },

        deleteResults: function (results) {
            for (var i = 0; i < this.results.length; i++) {
                if (results.id == this.results[i].id) {
                    this.results.splice(i, 1);
                }
            }

            this.notifyChange();
        }
    };

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
            var config = GEPPETTO.QueryBuilder.props.resultsControlsConfig;
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

    // column metadata for display of query results
    var queryResultsColumnMeta = [
        {
            "columnName": "id",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "ID",
        },
        {
            "columnName": "name",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Name"
        },
        {
            "columnName": "description",
            "order": 3,
            "locked": false,
            "visible": true,
            "displayName": "Description"
        },
        {
            "columnName": "controls",
            "order": 4,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.QueryResultsControlsComponent,
            "displayName": "Controls",
            "action": ""
        }
    ];

    // control configuration for query results action
    var queryResultsControlConfig = {
        "Common": {
            "info": {
                "id": "info",
                "actions": [
                    "GEPPETTO.Console.log('Result ID: $ID$');"
                ],
                "icon": "fa-info-circle",
                "label": "Info",
                "tooltip": "Info"
            }
        }
    };

    // TODO: remove this mock data - it's just for development
    var mockTermsData = ['saddle', 'medulla', 'betulla', 'test', 'nonna', 'leg', 'arm', 'bug', 'longino'];

    var mockTerms = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: mockTermsData
        });

    var mockResults = [
        { id: 'VFB_1', name: 'JFRC2_template', description: 'Test description', controls: ''},
        { id: 'VFB_2', name: 'VGlut-F-000176', description: 'Test description', controls: ''},
        { id: 'VFB_3', name: 'DM5 Clone of Yu 2013', description: 'Test description a bit longer', controls: ''},
        { id: 'VFB_4', name: 'Gad1-F-200114', description: 'Test description a bit longer even more indeed', controls: ''},
        { id: 'VFB_5', name: 'VGlut-F-800176', description: 'Test description a bit longer even more indeed', controls: ''},
        { id: 'VFB_6', name: 'DL1 Clone of Nonna 007', description: 'Test description', controls: ''},
        { id: 'VFB_7', name: 'VFB-123-123-123', description: 'Test description', controls: ''},
        { id: 'VFB_8', name: 'VGlut-000-000', description: 'Test description blah blah', controls: ''},
        { id: 'VFB_9', name: 'JFRC2_test', description: 'Test description', controls: ''},
        { id: 'VFB_10', name: 'VGlut-F-000345', description: 'Test description', controls: ''},
        { id: 'VFB_11', name: 'DM5 Clone of Yu 2014', description: 'Test description a bit longer', controls: ''},
        { id: 'VFB_12', name: 'Gad1-F-200234', description: 'Test description a bit longer even more indeed', controls: ''},
        { id: 'VFB_13', name: 'VGlut-F-800133', description: 'Test description a bit longer even more indeed', controls: ''},
        { id: 'VFB_14', name: 'DL2 Clone of Nonna 008', description: 'Test description', controls: ''},
        { id: 'VFB_15', name: 'VFB-123-123-666', description: 'Test description', controls: ''},
        { id: 'VFB_16', name: 'VGlut-000-123', description: 'Test description blah blah', controls: ''}
    ];

    var mockSourceData = [
        {
            term: 'saddle',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating saddle', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'medulla',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating medulla', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'betulla',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating betulla', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'test',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating test', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'nonna',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating nonna', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'arm',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating arm', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'leg',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating leg', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        },
        {
            term: 'bug',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating bug', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ],
        },
        {
            term: 'longino',
            options: [
                {name: 'Neurons with some part here', value: 0},
                {name: 'Neurons with synaptic terminal here', value: 1},
                {name: 'Neurons with pre-synaptic terminal here', value: 2},
                {name: 'Neurons with post-synaptic terminal here', value: 3},
                {name: 'Images of neurons with some part here (clustered by shape)', value: 4},
                {name: 'Images of neurons with some part here (unclustered)', value: 5},
                {name: 'Tracts/nerves innervating longino', value: 6},
                {name: 'Lineage clones with some part here', value: 7},
                {name: 'Transgenes exporessed here', value: 8},
                {name: 'Genes expressed here', value: 9},
                {name: 'Phenotypes here', value: 10},
            ]
        }
    ];

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
                    <div className="query-item-label">{this.props.item.term}</div>
                    <select className="query-item-option" onChange={onSelection} value={this.props.item.selection}>
                        {this.props.item.options.map(createItem)}
                    </select>
                    <button className="fa fa-trash-o query-item-button" title="delete item" onClick={this.props.onDeleteItem} />
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
                "onRun": undefined
            };
        },

        render: function () {
            return (
                <div id="querybuilder-footer">
                    <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="run query" onClick={this.props.onRun} />
                    <div id="query-results-label">{this.props.count.toString()} results</div>
                </div>
            );
        }
    });

    var QueryBuilder = React.createClass({
        displayName: 'QueryBuilder',

        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        getInitialState: function () {
            return {
                resultsView: false
            };
        },

        getDefaultProps: function () {
            return {
                model: {},
                resultsColumns: ['name', 'description', 'controls'],
                resultsColumnMeta: {},
                resultsControlsConfig: {},
            };
        },

        componentWillMount: function () {
            GEPPETTO.QueryBuilder = this;
        },

        switchView(resultsView) {
            this.setState({ resultsView: resultsView});
        },

        close: function () {
            // hide query builder
            $("#querybuilder").hide();
        },

        initTypeahead: function () {
            $('#query-typeahead').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1
                },
                {
                    name: 'terms',
                    source: mockTerms
                }
            );
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
                }
            });

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

        queryOptionSelected: function(item, value){
            // Option has been selected
            this.props.model.itemSelectionChanged(item, value);
        },

        queryItemDeleted: function(item){
            this.props.model.deleteItem(item);
        },

        getTotalResultsCount: function(){
            // TODO: build + run the query and get results count
            // mock number of results to check if it's updating the UI
            return Math.floor(Math.random() * (200 + 1));
        },

        // TODO: remove mock query execution - this will probably end up in the datasource
        executeQuery: function(query, callback){
            callback();
        },

        getCompoundQueryId: function(queryItems){
            var id = ""

            for(var i=0; i<queryItems.length; i++){
                id+=queryItems[i].term + queryItems[i].selection;
            }

            return id;
        },

        runQuery: function(){
            if(this.props.model.items.length > 0) {

                // TODO: check if we already have results for th given compound query
                var compoundId = this.getCompoundQueryId(this.props.model.items);
                var match = false;

                for(var i=0; i<this.props.model.results.length; i++){
                    if(this.props.model.results[i].id == compoundId){
                        match = true;
                    }
                }

                if(!match) {
                    // TODO: if we already have results for the an identical query switch to results and select the right tab
                    // TODO: build query client object (same as other model objects)
                    var query = {
                        items: this.props.model.items.slice(0)
                    };

                    var that = this;
                    var queryDoneCallback = function () {
                        // TODO: store actual results in the model
                        // store mock results in the model
                        var queryLabel = "";
                        for (var i = 0; i < that.props.model.items.length; i++) {
                            queryLabel += ((i != 0) ? "/" : "") + that.props.model.items[i].term;
                        }

                        that.props.model.addResults({
                            id: compoundId,
                            label: queryLabel,
                            records: mockResults,
                            selected: true
                        });

                        // change state to switch to results view
                        that.switchView(true);
                    };

                    // TODO: run query - probably on datasource client object
                    this.executeQuery(query, queryDoneCallback);
                } else {
                    // set the right results item as the selected tab
                    for(var i=0; i<this.props.model.results.length; i++){
                        if(this.props.model.results[i].id == compoundId){
                            this.props.model.results[i].selected = true;
                        }else {
                            this.props.model.results[i].selected = false;
                        }
                    }

                    // trigger refresh
                    this.props.model.notifyChange();

                    // change state to switch to results view
                    this.switchView(true);
                }
            }
        },

        addQueryItem: function(){
            // retrieve term
            var term = $('#query-typeahead').val();

            // TODO: plug real source of data instead mock data
            // retrieve options given term
            var item = null;
            for(var i=0; i<mockSourceData.length; i++){
                if(mockSourceData[i].term == term){
                    // create new item
                    item = {
                        term: mockSourceData[i].term,
                        // use slice to clone options - don't wanna use a reference to the same object!
                        options: mockSourceData[i].options.slice(0)
                    };
                }
            }

            // count how many occurrences of term we have in the model
            var termCount = 0;
            for(var i=0; i<this.props.model.items.length; i++){
                if(this.props.model.items[i].term == term){
                    termCount++;
                }
            }

            if(item!=null){
                // generate a unique id for the query item and add it to the model
                item.id = term + '_' + termCount.toString();
                item.selection = -1;
                item.options.splice(0, 0, {name: 'Please select an option', value: -1});

                this.props.model.addItem(item);
            } else{
                // TODO: throw massive error
            }
        },

        render: function () {
            var markup = null;

            // figure out if we are in results view or query builder view
            if(this.state.resultsView){
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
                    return (
                        <Tabs.Panel key={resultsItem.id} title={resultsItem.label}>
                            <Griddle columns={this.props.resultsColumns} results={this.props.model.results[focusTabIndex - 1].records}
                            showFilter={true} showSettings={false} enableInfiniteScroll={true} bodyHeight={400}
                            useGriddleStyles={false} columnMetadata={this.props.resultsColumnMeta} />
                        </Tabs.Panel>
                    );
                }, this);

                markup = (
                    <div id="query-results-container" className="center-content">
                        <Tabs tabActive={focusTabIndex}>
                            {tabs}
                        </Tabs>
                        <button id="switch-view-btn"
                                className="fa fa-hand-o-left querybuilder-button"
                                title="back to query" onClick={this.switchView.bind(null, false)}>
                        </button>
                    </div>
                );

            } else {
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

                var resultsCount = this.getTotalResultsCount();

                markup = (
                    <div id="query-builder-container">
                        <div id="query-builder-items-container">
                            {queryItems}
                        </div>
                        <div id="add-new-query-container">
                            <button id="add-query-btn" className="fa fa-plus querybuilder-button" title="add query" onClick={this.addQueryItem} />
                            <input id='query-typeahead' className="typeahead" type="text" placeholder="Terms" />
                        </div>
                        <QueryFooter count={resultsCount} onRun={this.runQuery} />
                    </div>
                );
            }

            return markup;
        }
    });

    var renderQueryComponent = function(){
        ReactDOM.render(
            <QueryBuilder model={queryBuilderModel}
                          resultsColumnMeta={queryResultsColumnMeta}
                          resultsControlsConfig={queryResultsControlConfig} />,
            document.getElementById("querybuilder")
        );
    };

    queryBuilderModel.subscribe(renderQueryComponent);
    renderQueryComponent();
});