define(function (require) {

    var React = require('react');

    var RunButton = require('./buttons/RunButton');
    var PlayButton = require('./buttons/PlayButton');
    var PauseButton = require('./buttons/PauseButton');
    var StopButton = require('./buttons/StopButton');
    var HelpButton = require('./buttons/HelpButton');
    var MenuButton = require('../../controls/menuButton/MenuButton');

    var GEPPETTO = require('geppetto');

    require('./SimulationControls.less');

    var SimulationControls = React.createClass({

        getInitialState: function () {
            return {
                disableRun: true,
                disablePlay: true,
                disablePause: true,
                disableStop: true
            }
        },

        getDefaultProps: function() {
            return {
                hideHelp: false,
                hideRun: false,
                hidePlay: false,
                hidePause: false,
                hideStop: false
            };
        },

        permissions : function(){
        	var experiment = window.Project.getActiveExperiment();
            var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
            var runPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.RUN_EXPERIMENT);
            var projectPersisted = experiment.getParent().persisted;
            var login = GEPPETTO.UserController.isLoggedIn() && GEPPETTO.UserController.hasPersistence();
            var readOnlyProject = window.Project.isReadOnly();
            
            if(writePermission && runPermission && projectPersisted && login && !readOnlyProject){
            	return true;
            }
            
            return false;
        },
        
        componentDidMount: function () {
            var self = this;

            GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, function () {
            	self.updateStatus();
            });
            
            GEPPETTO.on(GEPPETTO.Events.Project_persisted, function () {
            	self.updateStatus();
            });
            
            GEPPETTO.on(GEPPETTO.Events.Project_loaded, function () {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_running, function () {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_failed, function (id) {
            	var activeExperiment = window.Project.getActiveExperiment();
            	if(activeExperiment!=null || undefined){
            		if(activeExperiment.getId()==id){
                        self.setState({disableRun: false, disablePlay: true, disablePause: true, disableStop: true});
            		}
            	}
            });
            
            GEPPETTO.on(GEPPETTO.Events.Experiment_completed, function () {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_play, function (options) {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_resume, function () {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_pause, function () {
            	self.updateStatus();
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_stop, function (options) {
            	self.updateStatus();
            });
            
            GEPPETTO.on(GEPPETTO.Events.Experiment_deleted, function () {
            	var experiment = window.Project.getActiveExperiment();
            	if(experiment ==null || undefined){
            		self.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            	}
            });

            
            GEPPETTO.on('disable_all', function () {
                self.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            });

            GEPPETTO.on(GEPPETTO.Events.Experiment_over, function () {
            	self.updateStatus();
            });
            
            this.updateStatus();
        },
        
        updateStatus:function(){
        	var experiment = window.Project.getActiveExperiment();
            
            if(experiment!=null || undefined){
            	if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
            		if(GEPPETTO.ExperimentsController.isPaused()){
            			this.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: false});
            		}
            		else if(GEPPETTO.ExperimentsController.isPlaying()){
            			this.setState({disableRun: true, disablePlay: true, disablePause: false, disableStop: false});
            		}
            		else if(GEPPETTO.ExperimentsController.isStopped()){
            			this.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: true});
            		}
            	}
            	else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.RUNNING) {
            		this.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            	}
            	else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.ERROR) {
            		if(this.permissions()){
            			this.setState({disableRun: false, disablePlay: true, disablePause: true, disableStop: true});
            		}else{
            			this.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            		}
            	}
            	else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
            		if(this.permissions()){
            			this.setState({disableRun: false, disablePlay: true, disablePause: true, disableStop: true});
            		}else{
            			this.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            		}
            	}
            }
        },

        render: function () {

            var runButton = "";
            if(this.props.runConfiguration != undefined){
                this.props.runConfiguration.buttonDisabled = this.state.disableRun;
                runButton = <MenuButton configuration={this.props.runConfiguration} />
            } else {
                runButton = <RunButton disabled={this.state.disableRun} hidden={this.props.hideRun}/>
            }

            return (
                <div className="simulation-controls">
                    <HelpButton disabled={false} hidden={this.props.hideHelp}/>
                    <StopButton disabled={this.state.disableStop} hidden={this.props.hideStop}/>
                    <PauseButton disabled={this.state.disablePause} hidden={this.props.hidePause}/>
                    <PlayButton disabled={this.state.disablePlay} hidden={this.props.hidePlay}/>
                    {runButton}
                </div>
            );
        }

    });

    return SimulationControls;
});
