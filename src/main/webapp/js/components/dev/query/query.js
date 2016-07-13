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

    var React = require('react'), $ = require('jquery');
    var ReactDOM = require('react-dom');
    var Griddle = require('griddle');
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
                if (item.term == this.items[i].term) {
                    this.items[i].selection = selection;
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

    // TODO: remove this mock data - it's just for development
    var mockTermsData = ['saddle', 'medulla', 'betulla', 'test', 'nonna', 'leg', 'arm', 'bug', 'longino'];

    var mockTerms = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: mockTermsData
        });

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
                var val = e.target.value;
                that.props.onSelectOption(that.props.item, val);
            };

            var containerId = "queryitem-" + this.props.item.id;

            return (
                <div id={containerId} className="query-item">
                    <div className="query-item-label">{this.props.item.term}</div>
                    <select className="query-item-option" onChange={onSelection} value={this.props.item.value}>
                        {this.props.item.options.map(createItem)}
                    </select>
                    <button className="fa fa-trash-o query-item-button" title="delete item" onClick={this.props.onDeleteItem}></button>
                    <div className="clearer" />
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
                    <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="run query" onClick={this.props.onRun}></button>
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
                model: null
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

        queryOptionSelected: function(item){
            // Option has been selected
            this.props.model.itemSelectionChanged(item);
        },

        queryItemDeleted: function(item){
            this.props.model.deleteItem(item);
        },

        getTotalResultsCount: function(){
            // TODO: build + run the query and get results count
            // mock number of results to check if it's updating the UI
            return Math.floor(Math.random() * (200 + 1));
        },

        runQuery: function(){
            // TODO: run query

            // NOTE: the stuff below will probably happen in the form of a callback once the results are fetched
            // TODO: store results in the model
            // TODO: change state to switch to results view
            // this.switchView(true);

            alert('Run query: implement me!');
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
                // TODO: throw
            }
        },

        render: function () {
            var markup = null;

            // figure out if we are in results view or query builder view
            if(this.state.resultsView){

                // TODO: if results view, build results markup based on results in the model

            } else {
                // build QueryItem list
                var queryItems = this.props.model.items.map(function (item) {
                    return (
                        <QueryItem
                            key={item.id}
                            item={item}
                            onSelectOption={this.queryOptionSelected.bind(null, item)}
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
            <QueryBuilder model={queryBuilderModel} />,
            document.getElementById("querybuilder")
        );
    };

    queryBuilderModel.subscribe(renderQueryComponent);
    renderQueryComponent();
});