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
	function loadCss(url) {
		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = url;
		document.getElementsByTagName("head")[0].appendChild(link);
	}

	loadCss("geppetto/js/components/dev/togglebutton/ToggleButton.css");

    var React = require('react');
    var GEPPETTO = require('geppetto');

    $.widget.bridge('uitooltip', $.ui.tooltip);

    var ToggleButton = React.createClass({
    	 icon : null,
    	 tooltip : null,
    	 label : null,
    	 action : null,
         attachTooltip: function(){
        	 var self = this;
             $("#"+self.props.configuration.id).uitooltip({
                 position: { my: "right center", at : "left-25 center"},
                 tooltipClass: "tooltip-toggle",
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
                     return self.state.tooltip;
                 },
             });
         },
         
    	getInitialState: function() {
            return {
            	icon : this.icon,
            	label : this.label,
            	tooltip : this.tooltip,
            	action : this.action,
            	disabled : false
            };
        },
        
        componentDidMount: function() {
        	//this.attachTooltip();
    		this.evaluateState();
    		
			// attach handlers if any
			if(this.props.configuration.eventHandler!=undefined){
				this.props.configuration.eventHandler(this);
			}
        },

        clickEvent : function(){
        	this.evaluateState();
			// there may or may not be a dynamic action to be executed via console
			if(this.action!='') {
				GEPPETTO.Console.executeCommand(this.action);
			}

        	this.props.configuration.clickHandler(this.props.id);
        },
        
        showToolTip : function(){
        	var self = this;
        	$('button[rel="tooltip"]').uitooltip({content: self.state.tooltip,
       	 		position: { my: "right center", at : "left center"}});
        	$("#"+self.props.configuration.id).mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
        },
        
        evaluateState : function(){
			// figure out if disabled
			var disableBtn = this.props.disabled;
			if(disableBtn==undefined){
				// fall back on disableCondition from config if any
				var disableCondition = this.props.configuration.disableCondition;
				if(disableCondition!='' && disableCondition!=undefined){
					disableCondition = disableCondition.replace(/['"]+/g, '');
					disableBtn = eval(disableCondition);
				}
			}

			// figure out if hidden
			var hideBtn = this.props.hidden;
			if(hideBtn==undefined){
				// fall back on disableCondition from config if any
				var hideCondition = this.props.configuration.hideCondition;
				if(hideCondition!='' && hideCondition!=undefined){
					hideCondition = hideCondition.replace(/['"]+/g, '');
					hideBtn = eval(hideCondition);
				}
			}

			// condition could be function or string
			var condition = this.props.configuration.condition;
			var conditionResult = false;
			if(typeof condition === 'function'){
				conditionResult = condition();
			} else {
				if(condition != ''){
					condition = condition.replace(/['"]+/g, '');
					conditionResult = eval(condition);
				}
			}

        	if(!conditionResult){
        		this.icon = this.props.configuration.false.icon;
        		this.action = this.props.configuration.false.action;
        		this.label = this.props.configuration.false.label;
        		this.tooltip = this.props.configuration.false.tooltip;
        	}else{
        		this.icon = this.props.configuration.true.icon;
        		this.action = this.props.configuration.true.action;
        		this.label = this.props.configuration.true.label;
        		this.tooltip = this.props.configuration.true.tooltip;
        	}
        	
        	if(this.isMounted()){
        		this.setState({icon:this.icon, action:this.action, label: this.label, tooltip: this.tooltip, disabled: disableBtn, hidden: hideBtn});
        	}
        },
        
        render:  function () {
			var cssClass = this.props.configuration.id + " btn pull-right";
			if(this.props.toggled){
				cssClass += " toggle-button-toggled";
			}
			if(this.props.hidden===true){
				cssClass += " toggle-button-hidden";
			}

        	return (
        			<div className="toggleButton">
        				<button id={this.props.configuration.id} className={cssClass} type="button" title=''
        				rel="tooltip" onClick={this.clickEvent} disabled={this.props.disabled===true || this.state.disabled===true}>
        					<i className={this.state.icon}></i>{this.state.label}
        				</button>
        			</div>
        	);
        }
    });
    
    return ToggleButton;
});