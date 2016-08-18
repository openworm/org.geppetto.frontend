/**
 * React component for displaying a Project's experiments in a table.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    var React = require('react'), $ = require('jquery');
    var GEPPETTO = require('geppetto');

    $.widget.bridge('uitooltip', $.ui.tooltip);

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

        componentDidMount: function () {
        	$("#experimentsButton").show();
            var row = "#" + this.props.experiment.getId();

            $(row).parent().find("td[contenteditable='true']").keydown(function (e) {
            	if (e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();

                    // without this somehow the carriage return makes it into the field
                    window.getSelection().removeAllRanges();
                }
            });
            
            // Handle edits to editable name field
            $(row).find("td[contenteditable='true']").blur(function (e) {
                //save if user hits enter key
                    // get experiment ID for the edited field
                    var val = $(this).html();
                    var field = $(this).attr("name");

                    //remove empty spaces
                    val = val.replace(/&nbsp;/g,'').replace(/<br>/g,'').replace(/<br\/>/g,'').trim();

                    var setterStr = "setName";

                    if (field == "name") {
                        var expID = $(this).parent().attr("id").replace('#', '');
                        GEPPETTO.Console.executeCommand("Project.getExperimentById(" + expID + ")." + setterStr + "('" + val + "')");
                    }
            });
        },
        render: function () {
            var rowNumber = this.props.rowNumber;
            var rowClasses = "experimentsTableColumn accordion-toggle row-" + this.props.experiment.getId();

            //add different background to every even row
            if (rowNumber % 2 == 1) {
                rowClasses += " nthTr";
            }

            //set editable name field if experiment in design ode
            var editable = false;
            if (this.props.experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                editable = true;
            }

            return (
                <tr rowType="main" onClick={this.props.fnClick} onMouseOver={this.mouseOver} onMouseOut={this.mouseOut}
                    className={rowClasses} id={this.props.experiment.getId()}>
                    <StatusElement experiment={this.props.experiment} key={this.props.experiment.name+"-statusElement"}/>
                    <td className="configurationTD" name="name" contentEditable={editable}>{this.props.experiment.getName()}</td>
                    <td>{this.props.experiment.getLastModified()}</td>
                    <td><IconsElement ref="icons" experiment={this.props.experiment} key={this.props.experiment.name+"-iconsRow"}/>
                    </td>
                </tr>
            );
        }
    });

    /**
     * Creates a table row html element, <tr>, which can be collapsed.
     * Used to display an experiment's simulator configurations
     */
    var ExperimentExpandableRow = React.createClass({
        render: function () {
            var id = "collapsable-" + this.props.experiment.getId();
            var rowNumber = this.props.rowNumber;
            var rowClasses = "nested-experiment-info";

            //add different background to every even row
            if (rowNumber % 2 == 1) {
                rowClasses += " nthTr";
            }
            var rows = [];
            var simulatorConfigurations = [];
            var index = 0;

            //make simulator configurations to array
            for (var key in this.props.experiment.simulatorConfigurations) {
                simulatorConfigurations[index] = this.props.experiment.simulatorConfigurations[key];
                index++;
            }

            //create array of table row elements of type SimulatorRow
            simulatorConfigurations.forEach(function (simulator) {
                if (simulator != null) {
                	var index = 1;
                    rows.push(<SimulatorRow simulator={simulator} experiment={this.props.experiment}
                                            key={"simulatorRow"+index+"-"+simulator.aspectInstancePath}/>);
                    index++;
                }
            }.bind(this));

            var collapseClass = "collapse accordian-body collapsable-" + this.props.experiment.getId();

            return (
                <tr className={rowClasses} id={id}>
                    <td colSpan='12' className='hiddenRow'>
                        <div className={collapseClass}>
                            <table className='table-condensed expandableTable'>
                                <thead className='experimentsTableColumn'>
                                <tr>
                                    <th className="nameHeader"></th>
                                    <th>Aspect</th>
                                    <th>Simulator</th>
                                    <th>TimeStep (s)</th>
                                    <th>Length (s)</th>
                                </tr>
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
        componentDidMount: function () {
            var row = "#simulatorRowId-" + this.props.experiment.getId();
            
            // Handle edits to editable fields
            $(row).parent().find("td[contenteditable='true']").keydown(function (e) {
            	if (e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();

                    // without this somehow the carriage return makes it into the field
                    window.getSelection().removeAllRanges();
                }
            });
            
            $(row).parent().find("td[contenteditable='true']").blur(function(e)
            {
            	// get experiment ID for the edited field
                var val = $(this).html();
                var field = $(this).attr("name");
                
                //remove empty spaces
                val = val.replace(/&nbsp;/g,'').replace(/<br>/g,'').replace(/<br\/>/g,'').trim();
                
                var setterStr = "";

                switch (field) {
                    case "simulatorId":
                        setterStr = "setSimulator";
                        break;
                    case "timeStep":
                        setterStr = "setTimeStep";
                        break;
                    case "length":
                        setterStr = "setLength";
                        break;
                    case "conversionId":
                        setterStr = "setConversionService";
                        break;
                }

                if (setterStr != "") {
                    var expID = $(this).parents().closest("tr.nested-experiment-info").attr("id").replace('collapsable-', '');

                    // get aspect instance path
                    var aspect = $(this).parent().find("td[name='aspect']").html();
                    GEPPETTO.Console.executeCommand("Project.getExperimentById(" + expID + ").simulatorConfigurations['" + aspect + "']." + setterStr + "('" + val + "')");
                }
            });
        },
        render: function () {
            var editable = false;
            if (this.props.experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                editable = true;
            }

            var simulatorRowId = "simulatorRowId-" + this.props.experiment.getId();
            return (
                <tr id={simulatorRowId}>
                    <td></td>
                    <td className="configurationTD" name={'aspect'}>{this.props.simulator["aspectInstancePath"]}</td>
                    <td className="configurationTD" name={'simulatorId'} contentEditable={editable}>{this.props.simulator["simulatorId"]}</td>
                    <td className="configurationTD" name={'timeStep'} contentEditable={editable}>{this.props.simulator["timeStep"]}</td>
                    <td className="configurationTD" name={'length'} contentEditable={editable}>{this.props.simulator["length"]}</td>
                </tr>
            );
        }
    });

    /**
     * Creates <td> element to display the status of an experiment
     */
    var StatusElement = React.createClass({
        attachTooltip: function(){
            $('div.circle[rel="tooltip"]').uitooltip({
                position: { my: "left+15 center", at: "right center" },
                tooltipClass: "tooltip-container-status",
                show: {
                    effect: "slide",
                    direction: "left",
                    delay: 200
                },
                hide: {
                    effect: "slide",
                    direction: "left",
                    delay: 200
                },
                content: function () {
                    return $(this).attr("data-custom-title");
                },
            });
        },

        componentDidMount: function(){
            this.attachTooltip();
        },

        render: function () {
            var experiment = this.props.experiment;

            // IMPORTANT NOTE: empty title tag in the markup below is needed or the tooltip stops working
            var tdStatus = <td className="statusIcon">
                <div className={"circle center-block " + experiment.getStatus()}
                     data-status={experiment.getStatus()}
                     title=""
                     data-custom-title={GEPPETTO.Resources.ExperimentStatus.Descriptions[experiment.getStatus()]}
                     rel="tooltip"></div>
            </td>;

            return (tdStatus);
        }
    });

    /**
     * Creates html element holding set of icons used for experiment controls within table
     */
    var IconsElement = React.createClass({
        getInitialState: function () {
            return {visible: false};
        },

        show: function () {
            this.setState({visible: true});
        },

        hide: function () {
            this.setState({visible: false});
        },

        activeExperiment : function(e){
        	var experiment = this.props.experiment;
        	var index = window.Project.getExperiments().indexOf(experiment);
            GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].setActive();");
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        },
        
        deleteExperiment : function(e){
        	var experiment = this.props.experiment;
        	var index = window.Project.getExperiments().indexOf(experiment);
            GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].deleteExperiment();");
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        },
        
        cloneExperiment : function(e){
        	var experiment = this.props.experiment;
        	var index = window.Project.getExperiments().indexOf(experiment);
        	GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].clone();");
       	 	e.stopPropagation();
       	 	e.nativeEvent.stopImmediatePropagation();
        },
        downloadModels : function(e){
        	var experiment = this.props.experiment;

        	var simulatorConfigurations = experiment.simulatorConfigurations;
        	for (var config in simulatorConfigurations) {
        		var simulatorConfig = simulatorConfigurations[config];
        		GEPPETTO.Console.executeCommand('Project.downloadModel("' + simulatorConfig["aspectInstancePath"] + '");');
        	}
        	e.stopPropagation();
        	e.nativeEvent.stopImmediatePropagation();
        },
        
        downloadResults : function(e){
        	var experiment = this.props.experiment;
        	var index = window.Project.getExperiments().indexOf(experiment);
            var simulatorConfigurations = experiment.simulatorConfigurations;
            for (var config in simulatorConfigurations) {
                var simulatorConfig = simulatorConfigurations[config];
                GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].downloadResults('" + simulatorConfig["aspectInstancePath"] + "'," + "'RAW');");
            }
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        },

        componentDidMount: function () {
        	//hide download icons 
        	$(".downloadModelsIcon").hide();
            $(".downloadResultsIcon").hide();
        },
        
        render: function () {
            var experiment = this.props.experiment;
            //Create IDs for icons
            var activeIconId = "activeIcon-" + this.props.experiment.getId();
            var deleteIconId = "deleteIcon-" + this.props.experiment.getId();
            var downloadResultsIconId = "downloadResultsIcon-" + this.props.experiment.getId();
            var downloadModelsIconId = "downloadModelsIcon-" + this.props.experiment.getId();
            var cloneIconId = "cloneIcon-" + this.props.experiment.getId();

            return (
                <div onlick="event.cancelBubble=true;" className={(this.state.visible ? "visible " : "")+'iconsDiv'}>
                    <a className='activeIcon' onClick={this.activeExperiment}
                       experimentId={this.props.experiment.getId()} id={activeIconId}>
                        <i className='fa fa-check-circle fa-lg' rel='tooltip' title='Activate experiment'></i>
                    </a>
                    <a className='deleteIcon' onClick={this.deleteExperiment}
                       experimentId={this.props.experiment.getId()} id={deleteIconId}>
                        <i className='fa fa-remove fa-lg' rel='tooltip' title='Delete Experiment'></i>
                    </a>
                    <a className='downloadResultsIcon' onClick={this.downloadResults} experimentId={this.props.experiment.getId()} id={downloadResultsIconId}>
                        <i className='fa fa-download fa-lg' rel='tooltip' title='Download Results'></i>
                    </a>
                    <a className='downloadModelsIcon' onClick={this.downloadModels} experimentId={this.props.experiment.getId()} id={downloadModelsIconId}>
                        <i className='fa fa-cloud-download fa-lg' rel='tooltip' title='Download Models'></i>
                    </a>
                    <a className='cloneIcon' onClick={this.cloneExperiment} experimentId={this.props.experiment.getId()} id={cloneIconId}>
                     <i className='fa fa-clone fa-lg' rel='tooltip' title='Clone Experiment'></i>
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
            $("#new_experiment").click(function () {
            	//retrieve last created experimet and used it to clone new one
            	var experiments = window.Project.getExperiments();
            	var experiment = window.Project.getActiveExperiment();
            	if(experiments.length==0){
            		GEPPETTO.Console.executeCommand("Project.newExperiment();");
            	}else{
            		var index =0;
            		if(experiment!=null || undefined){
            			for(var e in experiments){
            				if(experiments[e].getId()>experiment.getId()){
            					experiment = experiments[e];
            				}
            			}
            			index = window.Project.getExperiments().indexOf(experiment);
            		}
            		GEPPETTO.Console.executeCommand("Project.getExperiments()[" + index + "].clone();");
            	}
            });

            GEPPETTO.on(Events.Project_loaded, function () {
                self.populate();
            });

            GEPPETTO.on(Events.Experiment_status_check, function () {
                self.updateExperimentsTableStatus();
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
            
            $("#experiments").resizable({
                handles: 'n',
                minHeight: 100,
                autoHide: true,
                maxHeight: 400,
                resize: function (event, ui) {
                    if (ui.size.height > ($("#footerHeader").height() * .75)) {
                        $("#experiments").height($("#footerHeader").height() * .75);
                        event.preventDefault();
                    }
                    $('#experiments').resize();
                    $("#experiments").get(0).style.top = "0px";
                }.bind(this)
            });
        },

        newExperiment: function (experiment) {
            var experiments = this.state.experiments;
            var rows = [];
            rows[0] = experiment;

            var index = 1;
            for (var key in experiments) {
                rows[index] = experiments[key];
                index++;
            }

            this.setState({experiments: rows});
//            this.setState({
//            	  experiments: rows.filter((_, i) => i !== index);
//            	});
            this.state.counter++;
        },

        deleteExperiment: function (experiment) {
            //this.state.experiments.pop(experiment);
            
        	var experiments = this.state.experiments;
            var rows = [];

            var index = 0;
            for (var key in experiments) {
            	if(experiment.getId()!=experiments[key].getId()){
            		rows[index] = experiments[key];
                	index++;
            	}
            }
            
        	this.state.counter--;

            this.setState({
          	  experiments:rows
          	});
            
            // loop through each row of experiments table and remove
            $('#experimentsTable tbody tr').each(function () {
                // id of row that matches experiment to be deleted
                if (this.id == experiment.getId() || this.id == ("collapsable-" + experiment.getId()) ||
                    this.id == ("#" + experiment.getId()) || this.id == ("#collapsable-" + experiment.getId())) {
                    $(this).remove();
                }
            });
        },

        updateExperimentStatus: function () {
            var experiment = window.Project.getActiveExperiment();

            $(".activeIcon").show();
            // hide download icons for non active experiments
            $(".downloadModelsIcon").hide();
            $(".downloadResultsIcon").hide();

            $("#activeIcon-" + experiment.getId()).hide();
            $("#downloadModelsIcon-" + experiment.getId()).show();
            if (experiment.getStatus() == "COMPLETED") {
                $("#downloadResultsIcon-" + experiment.getId()).show();
            }

            // loop through each row of experiments table
            $('#experimentsTable tbody tr').each(function () {
                // id of row matches that of active experiment
                if (this.id == (experiment.getId()) || this.id == ("collapsable-" + experiment.getId())) {
                    // add class to make it clear it's active
                    $(this).addClass("activeExperiment");
                } else {
                    // remove class from active experiment
                    $(this).removeClass("activeExperiment");
                }
            });
        },

        /**
         * Update experiment status of those in table
         */
        updateExperimentsTableStatus: function () {
            // loop through each row of experiments table
            $('#experimentsTable tbody tr').each(function () {
                var experiments = window.Project.getExperiments();
                var active = window.Project.getActiveExperiment();
                for (var e in experiments) {
                    var experiment = experiments[e];
                    if (this.id == ("#" + experiment.getId()) || this.id == (experiment.getId())) {
                        var tdStatus = $(this).find(".circle");
                        var tdStatusId = tdStatus.attr("data-status");

                        if (tdStatusId != experiment.getStatus()) {
                            tdStatus.removeClass(tdStatusId);
                            tdStatus.addClass(experiment.getStatus());
                            tdStatus.attr("data-status", experiment.getStatus());
                            tdStatus.attr("data-custom-title", GEPPETTO.Resources.ExperimentStatus.Descriptions[experiment.getStatus()]);

                            // make the tooltip pop-out for a bit to attract attention
                            tdStatus.mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});

                            if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                if (active != null) {
                                    if (active.getId() == experiment.getId()) {
                                        $("#downloadResultsIcon-" + experiment.getId()).show();
                                    }
                                }
                                var editableFields = $(this).find(".configurationTD");
                                for (var i = 0; i < editableFields.length; i++) {
                                    if (editableFields[i].getAttribute("contentEditable") != "false") {
                                        var td = editableFields[i].setAttribute("contentEditable", false);
                                    }
                                }
                            }
                        }
                    }
                    if (this.id == ("#simulatorRowId-" + experiment.getId()) || this.id == ("simulatorRowId-" + experiment.getId())) {
                        if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                            var editableFields = $(this).find(".configurationTD");
                            for (var i = 0; i < editableFields.length; i++) {
                                if (editableFields[i].getAttribute("contentEditable") != "false") {
                                    var td = editableFields[i].setAttribute("contentEditable", false);
                                }
                            }
                        }
                    }
                }
            });
        },

        populate: function () {
            var experiments = window.Project.getExperiments();
            var rows = [];

            var index = 0;
            for (var key in experiments) {
                var experiment = experiments[key];
                rows[index] = experiment;
                index++;
            }
            
            this.state.counter = rows.length;

            this.setState({experiments: rows});
        },

        getInitialState: function () {
            var tabledata = [];
            return {experiments: tabledata, counter: 1};
        },

        onClick: function (rowID, e) {
            var targetRowId = "." + rowID;
            if ($(targetRowId).is(':visible')) {
                $(targetRowId).hide();
            } else {
                $(targetRowId).show();
            }
        },

        render: function () {
            var rows = [];
            var rownumber = 1;
            this.state.experiments.forEach(function (experiment) {
                if (experiment != null) {
                    var expandableRowId = "collapsable-" + experiment.getId();
                    rows.push(<ExperimentRow experiment={experiment} rowNumber={rownumber}
                                             key={experiment.name} fnClick={this.onClick.bind(this,expandableRowId)}/>);
                    rows.push(<ExperimentExpandableRow experiment={experiment} rowNumber={rownumber}
                                                       key={expandableRowId}/>);
                    rownumber++;
                }
            }.bind(this));

            return (
                <div className="col-lg-6 experimentsResults panel-body experimentsResultsOutput" id="experimentsOutput">
                    <table id="experimentsTable" className="table table-condensed experimentsTable"
                           style={{borderCollapse:"collapse"}}>
                        <thead className="experimentsTableColumn">
                        <tr>
                            <th className="statusHeader">Status</th>
                            <th className="tableHeader">Name</th>
                            <th className="tableHeader">Date</th>
                            <th className="tableHeader">
                                <div className="new_experiment" id="new_experiment" tile="New experiment">
                                    <i className='new_experiment_icon fa fa-plus fa-lg'></i>
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody>{rows}</tbody>
                    </table>
                </div>
            );
        }
    });

    return ExperimentsTable;
});
