/*******************************************************************************
 * 
 * Copyright (c) 2011, 2016 OpenWorm. http://openworm.org
 * 
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the MIT License which accompanies this
 * distribution, and is available at http://opensource.org/licenses/MIT
 * 
 * Contributors: OpenWorm - http://openworm.org/people.html
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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/

define(function(require) {

	var React = require('react');
	var GEPPETTO = require('geppetto');

	$.widget.bridge('uitooltip', $.ui.tooltip);

	var button = React.createClass({
		attachTooltip: function(){
			var self = this;
			$("#"+this.props.configuration.id).uitooltip({
				position: this.props.configuration.tooltipPosition,
				tooltipClass: "tooltip-persist",
				show: {
					effect: "slide",
					direction: "right",
					delay: 200
				},
				hide: {
					effect: "slide",
					direction: "right",
					delay: 200
				},
				content: function () {
					return self.state.tooltipLabel;
				},
			});
		},

		showToolTip : function(tooltipLabel, tooltipPosition){
			var position = tooltipPosition;
			if(position==undefined){
				position = this.props.configuration.tooltipPosition;
			}
			// update contents of what's displayed on tooltip
			$("#"+this.props.configuration.id).uitooltip({content: tooltipLabel,
				position: position});
			$("#"+this.props.configuration.id).mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
		},
		
		hideToolTip : function(){
			$("#"+this.props.configuration.id).uitooltip('hide');
		},

		getInitialState: function() {
			return {
				disableButton : this.props.configuration.disabled,
				tooltipLabel : this.props.configuration.tooltipLabel,
				icon: this.props.configuration.icon
			};
		},

		componentDidMount: function() {    		
			this.attachTooltip();
			this.props.configuration.eventHandler(this);
		},

		render:  function () {
			return (
					<div>
					<button className={this.props.configuration.className+" btn pull-right"} type="button" title=''
						id={this.props.configuration.id} rel="tooltip" onClick={this.props.configuration.onClick}>
					<i className={this.state.icon}></i>
					</button>
					</div>
			);
		}
	});
	return button;
});