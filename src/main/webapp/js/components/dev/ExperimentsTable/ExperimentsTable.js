/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
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
/**
 * React component for displaying a Project's experiments in a table.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

	var React = require('react'), $ = require('jquery');
	var ReactDOM = require('react-dom');
	var GEPPETTO = require('geppetto');

	/**
	 * Creates a table row html element <tr>, used to display an Experiment's
	 * information (name, lastModified) and controls.
	 */
	var ExperimentRow = React.createClass({
		//Requests element with control icons to become visible
		mouseOver: function () {
			this.refs.icons.show();
		},
		//Requests element with control icons to become invisible
		mouseOut: function () {
		   this.refs.icons.hide();
		},
		render: function() {
			var id = "#"+this.props.experiment.getId();
			var rowNumber = this.props.rowNumber;
			var rowClasses = "experimentsTableColumn accordion-toggle row-"+this.props.experiment.getId();;
			//add different background to every even row
			if(rowNumber%2==1){
				rowClasses += " nthTr";
			}
			
			var editable = false;
            if (this.props.experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN){
            	editable = true;
            }
			
			return (
					<tr rowType="main"  onClick={this.props.fnClick} onMouseOver={this.mouseOver} onMouseOut={this.mouseOut} 
						className={rowClasses} id={id}>
						<StatusElement experiment={this.props.experiment} key={this.props.experiment.name}/>
						<td field="name" contentEditable={editable}>{this.props.experiment.getName()}</td>
						<td>{this.props.experiment.getLastModified()}</td>
						<td><IconsElement ref="icons" experiment={this.props.experiment} key={this.props.experiment.name}/></td>
					</tr>
			);
		}
	});
	
	/**
	 * Creates a table row html element, <tr>, which can be collapsed.
	 * Used to display an experiment's simulator configurations
	 */
	var ExperimentExpandableRow = React.createClass({
		render: function() {
			var id = "#collapsable-"+this.props.experiment.getId();
			var rowNumber = this.props.rowNumber;
			var rowClasses = "nexted-experiment-info"
			//add different background to every even row
			if(rowNumber%2==1){
				rowClasses += " nthTr";
			}
			var style  = {
				width:"215px"
			};
			var rows = [];
			var simulatorConfigurations = [];
			var index =0;
			
			//make simulator configurations to array
			for(var key in this.props.experiment.simulatorConfigurations){
				simulatorConfigurations[index] = this.props.experiment.simulatorConfigurations[key];
				index++;
			}
			
			//create array of table row elements of type SimulatorRow
			simulatorConfigurations.forEach(function(simulator) {
				if(simulator!=null){
					rows.push(<SimulatorRow simulator={simulator} experiment={this.props.experiment} 
											key={this.props.experiment.name}/>);
				}
			}.bind(this));
			var collapseClass = "collapse accordian-body collapsable-"+this.props.experiment.getId();;
			return (
					<tr className={rowClasses} id={id}>
						<td colSpan='12' className='hiddenRow'>
							<div className={collapseClass}>
								<table className='table-condensed expandableTable'>
									<thead className='experimentsTableColumn'>
										<tr><th style={style}></th>
										<th>Aspect</th><th>Simulator</th><th>TimeStep (s)</th><th>Length (s)</th></tr>
									</thead>
									<tbody>{rows}</tbody>
								</table>
							</div>
						</td>
					</tr>
			);
		}
	});
	
	/**
	 * Creates table row for displaying an experiment's simulator configurations
	 */
	var SimulatorRow = React.createClass({
		componentDidMount : function(){
			var row = "#simulatorRowId-"+this.props.experiment.getId();
			// Handle edits to editable fields
            $(row).parent().find("td[contenteditable='true']").keydown(function(e)
            {
                if (e.keyCode == 13)
                {
                    e.preventDefault();
                    $(this).blur();

                    // without this somehow the carriage return makes it
                    // into the field
                    window.getSelection().removeAllRanges();
                }
            });

            $(row).parent().find("td[contenteditable='true']").blur(function(e)
            {
                // get experiment ID for the edited field
                var val = $(this).html();
                var field = $(this).attr("field");

                var setterStr = "";

                switch (field)
                {
                    case "name":
                        setterStr = "setName"
                        break;
                    case "simulatorId":
                        setterStr = "setSimulator"
                        break;
                    case "timeStep":
                        setterStr = "setTimeStep"
                        break;
                    case "length":
                        setterStr = "setLength"
                        break;
                    case "conversionId":
                        setterStr = "setConversionService"
                        break;
                }

                if (setterStr != "")
                {
                    if (field == "name")
                    {
                        var expID = $(this).parent().attr("data-target").replace('#', '');
                        GEPPETTO.Console.executeCommand("Project.getExperimentById(" + expID + ")." + setterStr + "('" + val + "')");
                    } else
                    {
                        var expID = $(this).parents().closest("tr.nested-experiment-info").attr("id").replace('#', '');
                        // get aspect instance path
                        var aspect = $(this).parent().find("td[field='aspect']").html();
                        GEPPETTO.Console.executeCommand("Project.getExperimentById(" + expID + ").simulatorConfigurations['" + aspect + "']." + setterStr + "('" + val + "')");
                    }
                }
            })
		},
		render: function() {
			var editable = false;
            if (this.props.experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN){
            	editable = true;
            }
            
            var simulatorRowId = "simulatorRowId-"+this.props.experiment.getId();

			return (
					<tr id={simulatorRowId}><td></td>
						<td field='aspect' contentEditable={editable} onchange={this.onChange}>{this.props.simulator["aspectInstancePath"]}</td>
						<td field='simulatorId' contentEditable={editable} onchange={this.onChange}>{this.props.simulator["simulatorId"]}</td>
						<td field='timeStep' contentEditable={editable} onchange={this.onChange}>{this.props.simulator["timeStep"]}</td>
						<td field='length' contentEditable={editable} onchange={this.onChange}>{this.props.simulator["length"]}</td>
					</tr>
			);
		}
	});
	
	/**
	 * Creates <td> element to display the status of an experiment
	 */
	var StatusElement = React.createClass({
		updateStatus : function(){
			
		},
		render: function() {
			var experiment = this.props.experiment;
			// create element in row for showing status
			var tdStatus;
			// keep track if status is in design
			var design = false;
			if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED)
			{
				tdStatus = <td id="statusIcon"><div className="circle COMPLETED center-block" title="COMPLETED"></div></td>;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DELETED)
			{
				tdStatus = <td id="statusIcon"><div className="circle DELETED center-block" title="DELETED"></div></td>;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING)
			{
				tdStatus = <td id="statusIcon"><div className="circle RUNNING center-block" title="RUNNING"></div></td>;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN)
			{
				tdStatus = <td id="statusIcon"><div className="circle DESIGN center-block" title="DESIGN"></div></td>;
				design = true;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.QUEUED)
			{
				tdStatus = <td id="statusIcon"><div className="circle QUEUED center-block" title="QUEUED"></div></td>;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.CANCELED)
			{
				tdStatus = <td id="statusIcon"><div className="circle CANCELED center-block" title="CANCELED"></div></td>;
			} else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.ERROR)
			{
				tdStatus =<td id="statusIcon"><div className="circle ERROR center-block" title="ERROR"></div></td>;
			}

			return (tdStatus);
		}
	});
	
	/**
	 * Creates html element holding set of icons used for experiment controls within table
	 */
	var IconsElement = React.createClass({
		getInitialState: function() {
			return {visible: false};
		},
		show : function(){
	        this.setState({ visible: true });
		},
		hide : function(){
	        this.setState({ visible: false });
		},
		componentDidMount : function(){
			var experiment = this.props.experiment;
			
			var activeIconId = "#activeIcon-" +experiment.getId();
			var downloadResultsIconId = "#downloadResultsIcon-" +experiment.getId();
			var downloadModelsIconId = "#downloadModelsIcon-"+ experiment.getId();
			var deleteIconId = "#deleteIcon-" +experiment.getId();
			
			$(activeIconId).click(function(e) {
				 var index = window.Project.getExperiments().indexOf(experiment);
		         GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.LOADING_EXPERIMENT);
		         GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].setActive();");
		         e.stopPropagation();
			})
			$(deleteIconId).click(function(e) {
				var index = window.Project.getExperiments().indexOf(experiment);
	            GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].deleteExperiment();");
				e.stopPropagation();
			})
			$(downloadModelsIconId).click(function(e) {
				var simulatorConfigurations = experiment.simulatorConfigurations;
	            for (var config in simulatorConfigurations) {
	                var simulatorConfig = simulatorConfigurations[config];
	                GEPPETTO.Console.executeCommand('Project.downloadModel("' + simulatorConfig["aspectInstancePath"] + '");');
	            }
				e.stopPropagation();
			})
			$(downloadResultsIconId).click(function(e) {
				 var index = window.Project.getExperiments().indexOf(experiment);
	             var simulatorConfigurations = experiment.simulatorConfigurations;
	             for (var config in simulatorConfigurations) {
	                 var simulatorConfig = simulatorConfigurations[config];
	                 GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].downloadResults('" + simulatorConfig["aspectInstancePath"] + "'," + "'RAW');");
	             }
				e.stopPropagation();
			})
		},
		render: function() {
			var experiment = this.props.experiment;
			var activeIconId = "activeIcon-" +this.props.experiment.getId();
			var deleteIconId = "deleteIcon-" +this.props.experiment.getId();
			var downloadResultsIconId = "downloadResultsIcon-" +this.props.experiment.getId();
			var downloadModelsIconId = "downloadModelsIcon-" +this.props.experiment.getId();
    
			var style  = {
					paddingRight:"10px",
			};
			
			return (
					<div  onlick="event.cancelBubble=true;" className={(this.state.visible ? "visible " : "")+'iconsDiv'}>
						<a className='activeIcon' onClick={this.activeIconClick} experimentId={this.props.experiment.getId()} id={activeIconId}>
							<i className='fa fa-check-circle fa-lg' style={style} rel='tooltip' title='Active Icon'></i>
						</a>
						<a className='deleteIcon' onClick={this.deleteIconClick} experimentId={this.props.experiment.getId()} id={deleteIconId}>
							<i className='fa fa-remove fa-lg' rel='tooltip' title='Delete Experiment'></i>
						</a>
						<a className='downloadResultsIcon' onClick={this.downloadResultsIconClick} experimentId={this.props.experiment.getId()} id={downloadResultsIconId}>
							<i className='fa fa-download fa-lg' rel='tooltip' title='Download Results'></i>
						</a>
						<a className='downloadModelsIcon' onClick={this.downloadModelIconClick} experimentId={this.props.experiment.getId()} id={downloadModelsIconId}>
							<i className='fa fa-cloud-download fa-lg' rel='tooltip' title='Download Models'></i>
						</a>
					</div>);
		}
	});

	/**
	 * Creates a table html component used to dipslay the experiments
	 */
	var ExperimentsTable = React.createClass({

		componentDidMount: function () {

			var self = this;

			// Handles new experiment button click
            $("#new_experiment").click(function()
            {
                GEPPETTO.Console.executeCommand("Project.newExperiment();");
            });
            
			GEPPETTO.on(Events.Project_loaded, function () {
				self.populate();
			});

			GEPPETTO.on(Events.Experiment_status_check, function () {
				//self.updateExperimentsTableStatus();
			});
			GEPPETTO.on(Events.Experiment_loaded, function () {
				self.updateExperimentStatus();
			});
			GEPPETTO.on(Events.Experiment_created, function (experiment) {
				self.newExperiment(experiment);
			});
			GEPPETTO.on(Events.Experiment_deleted, function (experiment) {
				self.deleteExperiment(experiment);

				GEPPETTO.FE.infoDialog(GEPPETTO.Resources.EXPERIMENT_DELETED, "Experiment " + experiment.name + " with id " + experiment.id + " was deleted successfully");
			});
		},

		newExperiment : function(experiment){
			this.state.experiments.push(experiment);
            this.state.counter++;
		},
		
		deleteExperiment : function(experiment){
			this.state.experiments.pop(experiment);
            this.state.counter++;
            // loop through each row of experiments table
            $('#experimentsTable tbody tr').each(function()
            {
                // id of row matches that of active experiment
                if (this.id == ("#" + experiment.getId())||this.id == ("#collapsable-" + experiment.getId()))
                {
                    $(this).remove();
                }
            });
		},
		
		updateExperimentStatus : function(){
			var experiment = window.Project.getActiveExperiment();

            $(".activeIcon").show();
            // hide download icons for non active experiments
            $(".downloadModelsIcon").hide();
            $(".downloadResultsIcon").hide();

            $("#activeIcon-"+experiment.getId()).hide();
            $("#downloadModelsIcon-"+experiment.getId()).show();
            if (experiment.getStatus() == "COMPLETED")
            {
                $("#downloadResultsIcon-"+experiment.getId()).show();
            }
            
            // loop through each row of experiments table
            $('#experimentsTable tbody tr').each(function()
            {
                // id of row matches that of active experiment
                if (this.id == ("#" + experiment.getId())||this.id == ("#collapsable-" + experiment.getId()))
                {
                    // add class to make it clear it's active
                    $(this).addClass("activeExperiment");
                } else
                {
                    // remove class from active experiment
                    $(this).removeClass("activeExperiment");
                }
            });
		},
		
		populate : function(){
			var experiments = window.Project.getExperiments();
			var rows = [];
			var index = 0;
			for ( var key in experiments)
			{
				var experiment = experiments[key];
				rows[index] = experiment;
				index++;
			}
			this.setState({ experiments: rows });
		},

		getInitialState: function() {
			var tabledata = [];

			return {experiments: tabledata, counter : 1};
		},
		onClick : function(rowID, e){
			var targetRowId = "."+rowID;
			if( $(targetRowId).is(':visible')){
				$(targetRowId).hide();
			}else{
				$(targetRowId).show();
			}
		},
		render: function() {
			var style  = {
					width:"30%"
			};
			var rows = [];
			this.state.experiments.forEach(function(experiment) {
				if(experiment!=null){
					var expandableRowId = "collapsable-" +experiment.getId();
					rows.push(<ExperimentRow experiment={experiment} rowNumber={this.state.counter} key={experiment.name} fnClick={this.onClick.bind(this,expandableRowId)}/>);
					rows.push(<ExperimentExpandableRow experiment={experiment} rowNumber={this.state.counter} key={expandableRowId}/>);
					this.state.counter++;
				}
			}.bind(this));

					return (
							<div className="col-lg-6 experimentsResults panel-body experimentsResultsOutput" id="experimentsOutput">
								<table id="experimentsTable" className="table table-condensed experimentsTable" style={{borderCollapse:"collapse"}}>
									<thead className="experimentsTableColumn">
									<tr><th style={{width:"10%",textAlign:"center"}}>Status</th>
									<th style={style}>Name</th>
									<th style={style}>Date</th>
									<th style={style}>
										<div className="new_experiment" id="new_experiment" tile="New experiment">
											<i className='new_experiment_icon fa fa-plus fa-lg'></i>
										</div>
									</th></tr></thead>

									<tbody>{rows}</tbody>
								</table>
							</div>
					);
		}
	});

	ReactDOM.render(React.createFactory(ExperimentsTable)({}, ''), document.getElementById("experiments"));
});
