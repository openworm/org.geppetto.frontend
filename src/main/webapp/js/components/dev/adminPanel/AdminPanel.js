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

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/dev/adminPanel/AdminPanel.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');
	var Griddle = require('griddle');

	var HeaderComponent = React.createClass({
		textOnClick: function(e) {
			e.stopPropagation();
		},

		filterText: function(e) {
			this.props.filterByColumn(e.target.value, this.props.columnName)
		},

		render: function(){
			return (
					<span>
					<div><strong style={{color: this.props.color}}>{this.props.displayName}</strong></div>
					<input type='text' onChange={this.filterText} onClick={this.textOnClick} />
					</span>
			);
		}
	});

	var adminPanelComponent = React.createClass({

		getInitialState: function() {
			return {
				columns: ['name', 'type', 'controls'],
				//data: [],
				columnMeta: [
				             {
				            	 "columnName": "city",
				            	 "displayName": "City",
				            	 "customHeaderComponent": HeaderComponent,
				            	 "customHeaderComponentProps": { color: 'red' }
				             },
				             {
				            	 "columnName": "state",
				            	 "displayName": "State",
				            	 "customHeaderComponent": HeaderComponent,
				            	 "customHeaderComponentProps": { color: 'blue' }
				             }
				             ]
			}
		},

		setPanelView : function(){

		},

		componentDidMount : function(){

		},

		render: function () {
			return React.createElement(Griddle, {
				columns: this.state.columns, results: this.state.data,
				showFilter: false, showSettings: false, enableInfiniteScroll: true,
				useGriddleStyles: false, columnMetadata: this.state.columnMeta
			});
		}
	});

	return adminPanelComponent;

});