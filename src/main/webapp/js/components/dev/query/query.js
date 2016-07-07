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

        subscribe: function (callback) {
            this.onChangeHandlers.push(callback);
        },

        notifyChange: function () {
            this.onChangeHandlers.forEach(function (cb) {
                cb();
            });
        },

        selectionChanged: function (item, selection) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.term == this.items[i].term) {
                    this.items[i].selection = selection;
                }
            }

            this.notifyChange();
        },

        delete: function (item) {
            for (var i = 0; i < this.items.length; i++) {
                if (item.term == this.items[i].term) {
                    this.items.splice(i, 1);
                }
            }

            this.notifyChange();
        },

        items: [{
            id: "medulla",
            term: "medulla",
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
            ],
            selection: -1
        }]
    };

    // TODO: remove this mock data - it's just for development
    var mockTermsData = ['saddle', 'medulla', 'betulla', 'test'];

    var mockTerms = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: mockTermsData
        });

    var mockSourceData = [
        {
            term: 'saddle',
            options: [
                'Neurons with some part here',
                'Neurons with synaptic terminal here',
                'Neurons with pre-synaptic terminal here',
                'Neurons with post-synaptic terminal here',
                'Images of neurons with some part here (clustered by shape)',
                'Images of neurons with some part here (unclustered',
                'Tracts/nerves innervating saddle',
                'Lineage clones with some part here',
                'Transgenes exporessed here',
                'Genes expressed here',
                'Phenotypes here'
            ]
        },
        {
            term: 'medulla',
            options: [
                'Neurons with some part here',
                'Neurons with synaptic terminal here',
                'Neurons with pre-synaptic terminal here',
                'Neurons with post-synaptic terminal here',
                'Images of neurons with some part here (clustered by shape)',
                'Images of neurons with some part here (unclustered',
                'Tracts/nerves innervating medulla',
                'Lineage clones with some part here',
                'Transgenes exporessed here',
                'Genes expressed here',
                'Phenotypes here'
            ]
        },
        {
            term: 'betulla',
            options: [
                'Neurons with some part here',
                'Neurons with synaptic terminal here',
                'Neurons with pre-synaptic terminal here',
                'Neurons with post-synaptic terminal here',
                'Images of neurons with some part here (clustered by shape)',
                'Images of neurons with some part here (unclustered',
                'Tracts/nerves innervating betulla',
                'Lineage clones with some part here',
                'Transgenes exporessed here',
                'Genes expressed here',
                'Phenotypes here'
            ]
        },
        {
            term: 'test',
            options: [
                'Neurons with some part here',
                'Neurons with synaptic terminal here',
                'Neurons with pre-synaptic terminal here',
                'Neurons with post-synaptic terminal here',
                'Images of neurons with some part here (clustered by shape)',
                'Images of neurons with some part here (unclustered',
                'Tracts/nerves innervating test',
                'Lineage clones with some part here',
                'Transgenes exporessed here',
                'Genes expressed here',
                'Phenotypes here'
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
            // TODO IF ANY
            return { };
        },

        getDefaultProps: function () {
            return {
                model: null
            };
        },

        componentWillMount: function () {
            GEPPETTO.QueryBuilder = this;
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
            this.props.model.selectionChanged(item);
        },

        queryItemDeleted: function(item){
            this.props.model.delete(item);
        },

        getTotalResultsCount: function(){
            // TODO: build + run the query and get results count
            return 0;
        },

        runQuery: function(){
            // TODO: run query, change state to switch to results view
            alert('Run query: implement me!');
        },

        render: function () {

            var addQuery = function(){
                // TODO: implement add query
                alert('Add query: Implement me!');
            };

            // TODO: build QueryItem list
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

            return (
                <div id="query-builder-container">
                    <div id="query-builder-items-container">
                        {queryItems}
                    </div>
                    <div id="add-new-query-container">
                        <button id="add-query-btn" className="fa fa-plus querybuilder-button" title="add query" onClick={addQuery}></button>
                        <input id='query-typeahead' className="typeahead" type="text" placeholder="Terms" />
                    </div>
                    <QueryFooter count={resultsCount} onRun={this.runQuery.bind(this)}></QueryFooter>
                </div>
            );
        }
    });

    var renderQueryComponent = function(){
        ReactDOM.render(
            <QueryBuilder model={queryBuilderModel}></QueryBuilder>,
            document.getElementById("querybuilder")
        );
    };

    queryBuilderModel.subscribe(renderQueryComponent);
    renderQueryComponent();
});