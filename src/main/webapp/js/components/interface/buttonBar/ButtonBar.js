define(function(require) {

	var React = require('react');
	var GEPPETTO = require('geppetto');
	require("./ButtonBar.less");

	$.widget.bridge('uitooltip', $.ui.tooltip);

	var AbstractComponent = require('../../AComponent');

	var ButtonComponent = React.createClass({
		icon : null,
		tooltip : null,
		label : null,
		actions : null,
		attachTooltip: function(){
			var self = this;
			$("#"+this.props.id).uitooltip({
				position:  {my: "left+15 center", at: "right center"},
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
					return self.props.title;
				},
			});
		},

		getInitialState: function() {
			return {
				icon : this.icon,
				label : this.label,
				tooltip : this.tooltip,
				actions : this.actions,
				disabled : false
			};
		},

		componentDidMount : function(){
			this.attachTooltip();
			this.evaluateState();
		},

		onClick : function(){
			//execute all actions
			for(var action in this.actions){
				if((this.actions).hasOwnProperty(action)){
					GEPPETTO.CommandController.execute(this.actions[action], true);
				}
			}

			this.evaluateState();
		},

		evaluateState : function(){

			// condition could be function or string
			var condition = this.props.configuration.condition;
			var conditionResult = false;
			if(typeof condition === 'function'){
				conditionResult = condition();
			} else {
				if(condition != ''){
					conditionResult = eval(condition);
				}
			}

			if(conditionResult!=undefined){
				if(!conditionResult){
					this.icon = this.props.configuration.false.icon;
					this.actions = this.props.configuration.false.actions;
					this.label = this.props.configuration.false.label;
					this.tooltip = this.props.configuration.false.tooltip;
				}else{
					this.icon = this.props.configuration.true.icon;
					this.actions = this.props.configuration.true.actions;
					this.label = this.props.configuration.true.label;
					this.tooltip = this.props.configuration.true.tooltip;
				}
			}else{
				this.icon = this.props.configuration.icon;
				this.actions = this.props.configuration.actions;
				this.label = this.props.configuration.label;
				this.tooltip = this.props.configuration.tooltip;
			}

			if(this.isMounted()){
				this.setState({toggled: conditionResult, icon:this.icon, actions:this.actions, label: this.label, tooltip: this.tooltip});
			}
		},

		render: function () {
			return (
					<button className="btn btn-default btn-lg button-bar-btn" data-toogle="tooltip" onClick={this.onClick}
					data-placement="bottom" title={this.state.tooltip} id={this.props.id}>
					<span className={this.state.icon}>{this.state.label}</span>
					</button>
			)
		}
	});

	return class ButtonBar extends AbstractComponent {            
		render() {
			var buttons = [];

			//add buttons using the configuration passed on component creation
			for(var key in this.props.configuration){
				var b = this.props.configuration[key];
				var id = b.id;
				//if ID was not assigned as part of the configuration, we assinged the key value to it
				if(id==null || id==undefined){
					id = key;
				}
				buttons.push(<ButtonComponent id={id} key={key} configuration={b}/>);
			}

			return (
					<div id="button-bar-container" className="button-bar-container">
					<div id="bar-div" className="toolbar">
					<div className="btn-group">
					{buttons}
					</div>
					</div>
					</div>
			);
		}
	}
});