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

define(function(require) {

    var React = require('react');
    var ReactDOM = require('react-dom');
    var GEPPETTO = require('geppetto');

    $.widget.bridge('uitooltip', $.ui.tooltip);

    var saveControlComp = React.createClass({
         attachTooltip: function(){
        	 var self = this;
             $('button[rel="tooltip"]').uitooltip({
                 position: { my: "right center", at : "left-25 center"},
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
         
    	getInitialState: function() {
            return {
            	disableSave : true,
            	tooltipLabel : "Click here to persist this project!",
            	icon: "fa fa-star"
            };
        },
        
        componentDidMount: function() {

            var self = this;

            GEPPETTO.on(Events.Project_persisted, function(){
            	self.setState({disableSave: false});
            	//update contents of what's displayed on tooltip
           	 	$('button[rel="tooltip"]').uitooltip({content: "The project was persisted and added to your dashboard!",
           	 		position: { my: "right center", at : "left center"}});
            	$(".SaveButton").mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
            	self.setState({disableSave: true});
            });
            
            GEPPETTO.on('spin_persist', function() {
    			self.setState({icon:"fa fa-star fa-spin"});
    		}.bind($(".saveButton")));

    		GEPPETTO.on('stop_spin_persist', function() {
    			self.setState({icon:"fa fa-star"});
    		}.bind($(".saveButton")));
    		
    		
        	self.attachTooltip();
        },

        clickEvent : function(){
        	var self = this;
        	//update contents of what's displayed on tooltip
       	 	$('button[rel="tooltip"]').uitooltip({content: "The project is getting persisted..."});
        	$(".SaveButton").mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
        	self.setState({disableSave: true});
        	GEPPETTO.Console.executeCommand("Project.persist();");
        	GEPPETTO.trigger("spin_persist");
        },
        
        render:  function () {
        	return (
        			<div className="saveButton">
        				<button className="btn SaveButton pull-right" type="button" title=''
        				rel="tooltip" onClick={this.clickEvent} disabled={this.state.disableSave}>
        					<i className={this.state.icon}></i>
        				</button>
        			</div>
        	);
        }
    });
    
    return saveControlComp;

});