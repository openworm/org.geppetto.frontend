define(function(require) {

	var React = require('react');
	var ReactDOM = require('react-dom');
	var GEPPETTO = require('geppetto');

	$.widget.bridge('uitooltip', $.ui.tooltip);

	var comp = React.createClass({
		attachTooltip: function(){
			var self = this;
			$('button[rel="tooltip"]').uitooltip({
				position: { my: "left center", at: "right center" },
				tooltipClass: "tooltip-persist",
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
					return self.state.tooltipLabel;
				},
			});
		},

		getInitialState: function() {
			return {
				icon : this.props.iconOff,
				iconOn : this.props.iconOn,
				iconOff : this.props.iconOff,
				open : false,
				tooltipLabel : "Press for more options"
			};
		},

		componentDidMount: function(){  
			this.attachTooltip();
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
			var iconClass = this.state.icon;
			return(
					React.createElement("div", {className:"dropDownButton"},
					        React.createElement("button", {onClick: this.clickEvent, className:"btn squareB pull-right"},
					        			React.createElement("i", {className:iconClass}))
					      )
			);
		}
	});
    
    return comp;

});