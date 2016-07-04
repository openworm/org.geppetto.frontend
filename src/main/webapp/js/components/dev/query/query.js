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
    var GEPPETTO = require('geppetto');

    // TODO: remove this mock data - it's just for development
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
        }
    ];

    var QueryFooter = React.createClass({
        displayName: 'QueryFooter',

        getDefaultProps: function () {
            return {
                "count": 0
            };
        },

        render: function () {
            var runQuery = function(){
                // TODO: implement runQuery
                alert('Run Query: implement me!');
            };

            return (
                <div id="querybuilder-footer">
                    <button id="run-query-btn" className="fa fa-cogs querybuilder-button" title="run query" onClick={runQuery}></button>
                    <div>{this.props.count.toString()} results</div>
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
            // TODO
            return { };
        },

        getDefaultProps: function () {
            // TODO
            return { };
        },

        componentWillMount: function () {
            GEPPETTO.QueryBuilder = this;
        },

        close: function () {
            // hide query builder
            $("#querybuilder").hide();
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

            if(GEPPETTO.ForegroundControls != undefined){
                GEPPETTO.ForegroundControls.refresh();
            }
        },

        render: function () {
            return (
                <div>
                    <div>BUILDER PLACEHOLDER</div>
                    <QueryFooter count={0}></QueryFooter>
                </div>
            );
        }
    });

    ReactDOM.render(
        <QueryBuilder></QueryBuilder>,
        document.getElementById("querybuilder")
    );

});