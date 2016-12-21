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
	
	var ButtonComponent = React.createClass({

		filterText: function(e) {
			
		},

		render: function(){
			return (
				<button id={this.props.view} type="button" className="button" onClick={this.props.onClick}>{this.props.view}</button>
			);
		}
	});

	var adminPanelComponent = React.createClass({

		user : null,
		
		views : ["Users","Simulations","Errors"],
		
		getInitialState: function() {
			return {
				columns: [],
				data : []
			}
		},

		setPanelView : function(){
			this.forceUpdate();
		},

		componentDidMount : function(){
			this.getCurrentUser();
		},
		
		getCurrentUser : function(){
			var that = this;
			var urlData = window.location.href.replace("admin","currentuser");
			$.ajax({url: urlData, success: function(result){
				that.user = result.name.replace(" ", "");
				that.setDataSet(that.views[0]);
			}});
		},

		setDataSet : function(mode){
			var that = this;
			var urlData = window.location.href.replace("admin","");
			var newColumns;
			
			if(mode == this.views[0]){
				urlData += "/user/"+this.user + "/users";
				newColumns = ["UserName", "Experiments", "Storage"];
			}else if(mode ==this.views[1]){
				urlData += "/user/"+this.user + "/simulations";
				newColumns = ["UserName", "Experiments", "Simulators", "Storage"];
			}else if(mode ==this.views[2]){
				urlData += "/user/"+this.user + "/errors";
				newColumns = ["Details", "Experiment", "User Details"];
			}
			
			$.ajax({url: urlData, success: function(result){
				that.setState({data: result, columns: newColumns});
			}});
		},
		
		onButtonClick: function (view) {
            this.setDataSet(view);
        },
		
		render: function () {
			return (
				<div>
				  <div id="adminButtonHeader" className="adminButtonHeadverDiv">
					<ButtonComponent view={"Users"} onClick={this.onButtonClick.bind(this,"Users")}/>
					<ButtonComponent view={"Simulations"} onClick={this.onButtonClick.bind(this,"Simulations")}/>
					<ButtonComponent view={"Errors"} onClick={this.onButtonClick.bind(this,"Errors")}/>
				  </div>
				  <Griddle results={this.state.data} columns={this.state.colums} bodyHeight={this.props.height}
					         enableInfinteScroll={true} useGriddleStyles={false}/>
			    </div>
			);

		}
	});

	return adminPanelComponent;

});