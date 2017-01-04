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

		render: function(){
			var addClass = "";
			if(this.props.selectedState){
				addClass="selected ";
			}
			return (
				<button id={this.props.view} type="button" className={addClass+"button"} onClick={this.props.onClick}>{this.props.view}</button>
			);
		}
	});

	var adminPanelComponent = React.createClass({

		user : null,
		resultsPerPage : 20,
		usersViewSelected : true,
		simulationsViewSelected : false,
		errorsViewSelected : false,
		
		views : ["Users","Simulations","Errors"],
		usersColumnMeta : [
		              {   "columnName": "login",
			              "order": 1,
		                  "locked": false,
		                  "displayName": "User Name"},
		              {	  "columnName": "name",
		            	  "order": 2,
		            	  "locked": false,
		            	  "displayName": "Name"},
		              {   "columnName": "lastLogin",
			              "order": 3,
		                  "locked": false,
		                  "displayName": "Last Login"},
		              {	  "columnName": "projects",
			              "order": 4,
		                  "locked": false,
		                  "displayName": "Number of Projects"},
		              {   "columnName": "experiments",
			              "order": 5,
		                  "locked": false,
		                  "displayName": "Number of Experiments"},
		              {   "columnName": "storage",
			              "order": 6,
		                  "locked": false,
		                  "displayName": "Storage Size"}],  
		simulationsColumnMeta : [
		              {   "columnName": "experiment",
		              	  "order": 1,
		              	  "locked": false,
		              	  "displayName": "Experiment Name"},
		              {	  "columnName": "experimentLastRun",
		              	  "order": 2,
		              		"locked": false,
		              		"displayName": "Experiment Last Time Run"},
		              {   "columnName": "simulator",
		              		"order": 3,
		              		"locked": false,
		              		"displayName": "Simulator Name"},
		              {   "columnName": "status",
			              "order": 4,
			              "locked": false,
			              "displayName": "Experiment Status"},
		              {   "columnName": "experiments",
			              "order": 5,
			              "locked": false,
			              "displayName": "All User Experiments"},
			          {    "columnName": "simulators",
			              "order": 6,
			              "locked": false,
			              "displayName": "All User Simulators"},
			          {   
						  "columnName": "login",
			              "order": 7,
			              "locked": false,
			              "displayName": "Username"},
			          {	  "columnName": "name",
			              "order": 8,
			              "locked": false,
			              "displayName": "Name"},
			          {   "columnName": "storage",
		              	  "order": 9,
		              	  "locked": false,
		              	  "displayName": "Storage Size"}],
		errorsColumnMeta: [{
		                  "columnName": "error",
		              		"order": 1,
		              		"locked": false,
		              		"displayName": "Experiment Error"},
		              {
		              		"columnName": "experiment",
		              		"order": 2,
		              		"locked": false,
		              		"displayName": "Experiment Name"},
		              {
		              		"columnName": "simulator",
		              		"order": 3,
		              		"locked": false,
		              		"displayName": "Simulator Name"},
		              {
		              		"columnName": "login",
		              		"order": 4,
		              		"locked": false,
		              		"displayName": "Username"},
		              {
		              		"columnName": "name",
		              		"order": 5,
		              		"locked": false,
		              		"displayName": "Name"}],
		columnMeta : [],
	    
		getInitialState: function() {
			return {
				columns: [],
				data : [],
				loaded : false
			}
		},

		setPanelView : function(){
			this.forceUpdate();
		},

		componentDidMount : function(){
			this.setCurrentUser();
		},
		
		setCurrentUser : function(){
			var that = this;
			var urlData = window.location.href.replace("admin","currentuser");
			$.ajax({url: urlData, success: function(result){
				that.user = result.login.replace(" ", "");
				that.setDataSet(that.views[0]);
			}});
		},

		setDataSet : function(mode){
			var that = this;
			var urlData = window.location.href.replace("admin","");
			var newColumns;
			
			if(mode == this.views[0]){
				urlData += "user/"+this.user + "/users";
				this.usersViewSelected = true;
				this.simulationsViewSelected = false;
				this.errorsViewSelected = false;
				this.columnMeta = this.usersColumnMeta;
			}else if(mode ==this.views[1]){
				urlData += "/user/"+this.user + "/simulations";
				this.usersViewSelected = false;
				this.simulationsViewSelected = true;
				this.errorsViewSelected = false;
				this.columnMeta = this.simulationsColumnMeta;
			}else if(mode ==this.views[2]){
				urlData += "/user/"+this.user + "/errors";
				this.usersViewSelected = false;
				this.simulationsViewSelected = false;
				this.errorsViewSelected = true;
				this.columnMeta = this.errorsColumnMeta;
			}
			
			this.setState({loaded : false});
			
			$.ajax({url: urlData, success: function(result){
				that.setState({data: result, columnMeta : that.columnMeta, loaded : true});
			}});
		},
		
		onButtonClick: function (view) {
            this.setDataSet(view);
        },
		
		render: function () {
			return (
				<div>
				  <div id="adminButtonHeader" className="adminButtonHeadverDiv">
					<ButtonComponent view={"Users"} selectedState={this.usersViewSelected} onClick={this.onButtonClick.bind(this,"Users")}/>
					<ButtonComponent view={"Simulations"} selectedState={this.simulationsViewSelected} onClick={this.onButtonClick.bind(this,"Simulations")}/>
					<ButtonComponent view={"Errors"} selectedState={this.errorsViewSelected} onClick={this.onButtonClick.bind(this,"Errors")}/>
				  </div>
					{this.state.loaded ?
						<Griddle results={this.state.data} columnMetadata={this.state.columnMeta} bodyHeight={this.props.height}
						enableInfinteScroll={true} useGriddleStyles={false} resultsPerPage={this.resultsPerPage}/>

						:
						<div className="loader"></div>
					}
				</div>
			);

		}
	});

	return adminPanelComponent;

});