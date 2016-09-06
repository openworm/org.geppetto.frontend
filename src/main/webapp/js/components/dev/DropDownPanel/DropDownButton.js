define(function(require) {

	var React = require('react');
	var ReactDOM = require('react-dom');
	var GEPPETTO = require('geppetto');

	var comp = React.createClass({
		getInitialState: function() {
			return {
				icon : this.props.iconOff,
				iconOn : this.props.iconOn,
				iconOff : this.props.iconOff,
				open : false,
				disabled : true
			};
		},

		componentDidMount: function(){
			var self = this;
			GEPPETTO.on(Events.Experiment_active, function () {
				if(!self.state.disabled){
					if(GEPPETTO.DropDownPanel.isOpen()){
						GEPPETTO.DropDownPanel.close();
					}
				}
				var experiment = window.Project.getActiveExperiment();
				var newState = true;
				if(experiment!=null || undefined){
					if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.COMPLETED){
						newState = false;
					}
				}
				self.setState({disabled: newState});
			});
			
			GEPPETTO.on(Events.Experiment_completed, function () {
				var newState = self.state.disabled;
				var experiment = window.Project.getActiveExperiment();
				if(experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
					newState = false;
				}
				self.setState({disabled: newState});
			});
		},

		clickEvent : function(){
			var showIcon;			if(GEPPETTO.DropDownPanel!=undefined){
				if(GEPPETTO.DropDownPanel.isOpen()){
					GEPPETTO.DropDownPanel.close();
					showIcon = this.state.iconOff;
					this.setState({open : false, icon : showIcon});
				}else{
					GEPPETTO.DropDownPanel.open();
					showIcon = this.state.iconOn;
					this.setState({open : true, icon : showIcon});
				}
			}  	
		},

		render:  function () {
			return(
					<div className="dropDownButton">
    				<button className="btn squareB DropDownButton pull-right" type="button" title=''
    				onClick={this.clickEvent} disabled={this.state.disabled}>
    					<i className={this.state.icon}>Results</i>
    				</button>
    			</div>
			);
		}
	});
    
    return comp;

});