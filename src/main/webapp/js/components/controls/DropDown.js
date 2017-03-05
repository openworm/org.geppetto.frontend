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

define(function (require, exports, module) {

	var React = require('react');

	var DropDown = React.createClass({

		getInitialState: function() {
			return {
            	items: this.props.items,
				value: this.props.sync_value
            };
		},
		componentWillReceiveProps: function(nextProps) {
  		  this.setState({
  			  items: nextProps.items,
			  value: nextProps.sync_value
  		  });
  		},

		handleChange: function (event) {
			this.setState({ value: event.target.value });
			this.props.handleChange(event.target.value);
		},
		handleBlur: function (event) {
			this.props.handleBlur(event.target.value);
		},

		render: function () {
			var itemComponents = this.state.items.map(function (item) {
				return (<option key={item.id} value={item.id}>{item.value}</option>);
			});

			return (
				<select value={this.state.value} id={this.props.id} onChange={this.handleChange}>
					{itemComponents}
				</select>

			);
		}
	});

	return DropDown;
});