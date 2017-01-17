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

    var linkComponent = React.createClass({
        render: function () {

            var displayText = this.props.data;
            var that = this;

            var action = function (e) {
                e.preventDefault();
            };
            
            var linkDisabled = "";
            if(displayText != "Show Size"){
            	linkDisabled = "linkDisabled";
            }

            return (
                <div>
                    <a href='#' onClick={action} className={linkDisabled}>{displayText}</a>
                </div>
            )
        }
    });
    
	var ButtonComponent = React.createClass({

		render: function(){
			var addClass = "";
			if(this.props.selectedState){
				addClass="selected ";
			}
			return (
				<button id={this.props.id} type="button" className={addClass+"button"} onClick={this.props.onClick}>{this.props.id}</button>
			);
		}
	});

	var adminPanelComponent = React.createClass({

		user : "admin",
		resultsPerPage : 20,
		usersViewSelected : true,
		simulationsViewSelected : false,
		errorsViewSelected : false,
		lastDaySelected : false,
		lastWeekSelected: true,
		lastMonthSelected : false,
		allTimeSelected : false,
		currentView : null,
		timeFrame : "week",
		storedData :[],
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
		              {   "columnName": "loginCount",
				          "order": 4,
			              "locked": false,
			              "displayName": "Login Count"},
		              {   "columnName": "lastLogin",
			              "order": 3,
		                  "locked": false,
		                  "sortDirectionCycle" :["desc","asc"],
		                  "displayName": "Last Login"},
		              {	  "columnName": "projects",
			              "order": 5,
		                  "locked": false,
		                  "displayName": "Number of Projects"},
		              {   "columnName": "experiments",
			              "order": 6,
		                  "locked": false,
		                  "displayName": "Number of Experiments"},
		              {   "columnName": "storage",
		                  "customComponent": linkComponent,
			              "order": 7,
		                  "locked": false,
		                  "displayName": "Storage Size"}],  
		simulationsColumnMeta : [
		             {   
		   				  "columnName": "login",
		   			      "order": 1,
		   			      "locked": false,
		   			      "displayName": "Username"},
		   			  {	  "columnName": "name",
		   			      "order": 2,
		   			      "locked": false,
		   			      "displayName": "Name"},
		   			  {   "columnName": "project",
			              "order": 3,
			              "locked": false,
			              "displayName": "Project Name"},
		              {   "columnName": "experiment",
		              	  "order": 4,
		              	  "locked": false,
		              	  "displayName": "Experiment Name"},
		              {	  "columnName": "experimentLastRun",
		              	  "order": 5,
		              		"locked": false,
		              		"displayName": "Experiment Last Time Run"},
		              {   "columnName": "simulator",
		              		"order": 6,
		              		"locked": false,
		              		"displayName": "Simulator Name"},
		              {   "columnName": "status",
			              "order": 7,
			              "locked": false,
			              "displayName": "Experiment Status"},
		              {   "columnName": "experiments",
			              "order": 8,
			              "locked": false,
			              "displayName": "All User Experiments"},
			          {    "columnName": "simulators",
			              "order": 9,
			              "locked": false,
			              "displayName": "All User Simulators"}],
		errorsColumnMeta: [{
				      		"columnName": "login",
				      		"order": 1,
				      		"locked": false,
				      		"displayName": "Username"},
				      {
				      		"columnName": "name",
				      		"order": 2,
				      		"locked": false,
				      		"displayName": "Name"},
		              {
		                  "columnName": "error",
		              		"order": 3,
		              		"locked": false,
		              		"displayName": "Experiment Error"},
		              {   "columnName": "project",
					      "order": 4,
					      "locked": false,
					      "displayName": "Project Name"},
		              {
		              		"columnName": "experiment",
		              		"order": 5,
		              		"locked": false,
		              		"displayName": "Experiment Name"},
		              {
		              		"columnName": "simulator",
		              		"order": 6,
		              		"locked": false,
		              		"displayName": "Simulator Name"}],
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
			this.setInitialData();
		},
		
		//sets initial data view when component mounts
		setInitialData : function(){
			var that = this;
			var urlData = window.location.href.replace("admin","");
			urlData += "user/admin/users/"+this.timeFrame;
			$.ajax({url: urlData, success: function(result){
				that.setDataSet(that.views[0]);
			}});
		},

		//switches the data set to show in component
		setDataSet : function(mode){
			var that = this;
			var urlData = window.location.href.replace("admin","");
			var newColumns;
			
			if(mode == this.views[0]){
				urlData += "user/"+this.user + "/users/"+this.timeFrame;
				this.setDataViewFlags(true,false,false);
				this.columnMeta = this.usersColumnMeta;
			}else if(mode ==this.views[1]){
				urlData += "user/"+this.user + "/simulations/"+this.timeFrame;
				this.setDataViewFlags(false,true,false);
				this.columnMeta = this.simulationsColumnMeta;
			}else if(mode ==this.views[2]){
				urlData += "user/"+this.user + "/errors/"+this.timeFrame;
				this.setDataViewFlags(false,false,true);
				this.columnMeta = this.errorsColumnMeta;
			}
			
			this.currentView = mode;
			this.setState({loaded : false});
			
			var timeFrame = this.timeFrame;
			if(this.storedData[this.currentView+"/"+timeFrame]==null){
				$.ajax({url: urlData, success: function(result){
					that.storedData[that.currentView+"/"+timeFrame] = result;
					that.setState({data: result, columnMeta : that.columnMeta, loaded : true});
				}});
			}else{
				this.setState({data: this.storedData[this.currentView+"/"+timeFrame], columnMeta : this.columnMeta, loaded : true});
			}
		},
		
		//toggle flags that keep track of what's being displayed
		setDataViewFlags : function(user, simulation, errors){
			this.usersViewSelected = user;
			this.simulationsViewSelected = simulation;
			this.errorsViewSelected = errors;
		},
		
		//toggle flags that keep track of what's being displayed
		setDataTimeFlags : function(day, week, month, allTime){
			this.lastDaySelected = day;
			this.lastWeekSelected = week;
			this.lastMonthSelected = month;
			this.allTimeSelected = allTime;
		},
		
		changeViewData: function (view) {
            this.setDataSet(view);
        },
        
		changeTimeData: function (timeFrame) {
			this.timeFrame = timeFrame;
			if(timeFrame == "all"){
				this.setDataTimeFlags(false,false,false,true);
			}else if(timeFrame == "day"){
				this.setDataTimeFlags(true,false,false,false);
			}else if(timeFrame == "week"){
				this.setDataTimeFlags(false,true,false,false);
			}else if(timeFrame == "month"){
				this.setDataTimeFlags(false,false,true,false);
			}
			
			//uncheck all previously selected checked boxes
            this.setDataSet(this.currentView);
			// uncheck all other checked boxes 
			$("input:checkbox").on('click', function() {
			  // in the handler, 'this' refers to the box clicked on
			  var $box = $(this);
			  if ($box.is(":checked")) {
			    // the name of the box is retrieved using the .attr() method
			    // as it is assumed and expected to be immutable
			    var group = "input:checkbox[name='" + $box.attr("name") + "']";
			    // the checked state of the group/box on the other hand will change
			    // and the current value is retrieved using .prop() method
			    $(group).prop("checked", false);
			    $box.prop("checked", true);
			  } else {
			    $box.prop("checked", false);
			  }
			  $box.prop("disabled", true);
			});
		},
		
		sortData: function(sort, sortAscending, data){
			//sorting should generally happen wherever the data is coming from
			sortedData = _.sortBy(data, function(item){
				return item[sort];
			});

			if(sortAscending === false){
				sortedData.reverse();
			}
			return {
				"currentPage": 0,
				"externalSortColumn": sort,
				"externalSortAscending": sortAscending,
				"pretendServerData": sortedData,
				"results": sortedData.slice(0,this.state.externalResultsPerPage)
			};
		},

		
		sort: function(sort, sortAscending){
			 this.setState(this.sortData(sort, sortAscending, this.state.data));
		},
		
		onRowClick : function(rowData, event) {
			var td = event.target;
			if(td.textContent == "Show Size"){
				var login = rowData.props.data.login;

				var urlData = window.location.href.replace("admin","");
				urlData += "user/"+this.user + "/storage/"+login;

				td.textContent = "Fetching Data";
				var self = this;
				$.ajax({url: urlData, success: function(result){
					var data =  self.state.data;
					if(self.storedData[self.currentView+"/"+self.timeFrame]!=null){
						for(var key in data){
							var object = data[key];
							if(object.login == login){
								object.storage = result;
							}
						}
					}
					td.textContent = result;
					self.setState({data : data});
					alert("Storage size for user " + login + " is: " + result);
				}});
			}
	    },
		
		render: function () {
			return (
				<div>
				  <div id="adminButtonHeader" className="adminButtonHeadverDiv">
					<ButtonComponent id={"Users"} selectedState={this.usersViewSelected} onClick={this.changeViewData.bind(this,"Users")}/>
					<ButtonComponent id={"Simulations"} selectedState={this.simulationsViewSelected} onClick={this.changeViewData.bind(this,"Simulations")}/>
					<ButtonComponent id={"Errors"} selectedState={this.errorsViewSelected} onClick={this.changeViewData.bind(this,"Errors")}/>
				  </div>
				 <div id="timeFrameButtonHeader" className="timeFrameButtonHeadverDiv">
				  <label>
				    <input type="checkbox" className="radio" name="checkbox" value="1" disabled={this.lastDaySelected ? "disabled" :"" } checked={this.lastDaySelected ? "checked" :"" }
				    	  onClick={this.changeTimeData.bind(this,"day")} />Day</label>
				  <label>
				    <input type="checkbox" className="radio" name="checkbox" value="1" disabled={this.lastWeekSelected ? "disabled" :"" } checked={this.lastWeekSelected ? "checked" :"" }
				    	onClick={this.changeTimeData.bind(this,"week")}/>Week</label>
				  <label>
				    <input type="checkbox" className="radio" name="checkbox" value="1" disabled={this.lastMonthSelected ? "disabled" :"" } checked={this.lastMonthSelected ? "checked" :"" }
				    	onClick={this.changeTimeData.bind(this,"month")}/>Month</label>
				  <label>
				    <input type="checkbox" className="radio" name="checkbox" value="1" checked={this.allTimeSelected ? "checked" :"" }
				    disabled={this.allTimeSelected ? "disabled" :"" } onClick={this.changeTimeData.bind(this,"all")}/>All Time</label>
				    
				</div>
					{this.state.loaded ?
						<Griddle results={this.state.data} columnMetadata={this.state.columnMeta} bodyHeight={this.props.height}
						enableInfinteScroll={true} useGriddleStyles={false} resultsPerPage={this.resultsPerPage} showPager={false}
						showFilter ={true} onRowClick={this.onRowClick} initialSort={"lastLogin"} initialSortAscending={false}/>
						:
						<div id="loading-container">
							<div className="gpt-gpt_logo fa-spin"></div>
							<p className="orange loadingText">Fetching data (might take a few seconds depending on your network)</p>
						</div>
					}
				</div>
			);

		}
	});

	return adminPanelComponent;

});