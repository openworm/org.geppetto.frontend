define(function(require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/dev/DropDownPanel/dropdownpanel.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react');
	var ReactDOM = require('react-dom');
	var GEPPETTO = require('geppetto');

	$.widget.bridge('uitooltip', $.ui.tooltip);

	var ListItem = React.createClass({
		getInitialState : function(){
			return {
				selected : false,
				icon : "",
				checked : "fa fa-check-circle",
				unchecked : "" 
			};
		},
		
		select : function(){
			var state = !this.state.selected;
			var iconState =this.state.unchecked;
			if(state){
				iconState = this.state.checked;
			}
			this.setState({selected : state, icon : iconState});
			
			var action = this.props.item.action;
			GEPPETTO.Console.executeCommand(action);
		},
		
		render: function () {
			return <tr onClick={this.select}><td className="selectedStatus">
					<i className={"iconSelectionStatus " + this.state.icon}></i></td>
					<td className="dropDownLabel"><label>
					<span>{this.props.item.label}</span>
				   </label></td></tr>
		}
	});

	var dropDownControlComp = React.createClass({
		getInitialState: function() {
			return {
				visible : this.props.openedByDefault,
				list : null,
				position : {top : this.props.position.top, right: this.props.position.right, 
							left: this.props.position.left, bottom : this.props.position.bottom},
			};
		},

		componentDidMount: function() {

			this.setState({list : this.props.data})
			
			GEPPETTO.DropDownPanel = this;

			if(GEPPETTO.ForegroundControls != undefined){
				GEPPETTO.ForegroundControls.refresh();
			}
			
			if(this.state.visible){
				this.open();
			}
		},

		clickEvent : function(){
			var self = this;
			self.setState({disableSave: true});
			GEPPETTO.Console.executeCommand("Project.persist();");        	
		},

		renderListItems : function(){
			var items = [];
			for (var i = 0; i < this.props.list.length; i++) {
				var item = this.props.list[i];
				items.push(<ListItem item={item}/>);
			}
			return items;
		},

		select: function(item) {
			this.props.selected = item;
			GEPPETTO.Console.log("selected "+item.name);
		},

		close : function () {
			this.setState({visible : false});
			$("#dropDownPanel").hide()
		},

		open: function() {
			var self = this;
			self.setState({visible : true});
			$("#dropDownPanel").css({top: self.state.position.top, right: self.state.position.right, 
				bottom: self.state.position.bottom, left: self.state.position.left,position:'fixed'});
			$("#dropDownPanel").show();
		},

		isOpen : function(){
			return this.state.visible;
		},

		render:  function () {
			return( 
					<div className={"dropdown-container" + (this.state.visible ? " show" : "")}>
					<table className="dropDownTable" id="dropDownTable">
						{this.renderListItems()}
					</table>
					</div>
			)

		}
	});

	return dropDownControlComp;

});