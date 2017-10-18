define(function(require) {

    var React = require('react');
    var GEPPETTO = require('geppetto');
	require("./ToggleButton.less");

    $.widget.bridge('uitooltip', $.ui.tooltip);

    var ToggleButton = React.createClass({
    	 icon : null,
    	 tooltip : null,
    	 tooltipPosition : null,
    	 label : null,
    	 action : null,
         attachTooltip: function(){
        	 var self = this;
        	 self.tooltipPosition = this.props.configuration.tooltipPosition;
        	 if(self.tooltipPosition==null){
        		 self.tooltipPosition={ my: "center bottom",at: "center top-10"};
        	 }
             $("#"+self.props.configuration.id).uitooltip({
                 position: self.tooltipPosition,
                 tooltipClass: "tooltip-toggle",
                 show: null, // show immediately
                 open: function(event, ui)
                 {
                     if (typeof(event.originalEvent) === 'undefined')
                     {
                         return false;
                     }

                     var $id = $(ui.tooltip).attr('id');

                     // close any lingering tooltips
                     $('div.ui-tooltip').not('#' + $id).remove();
                 },
                 close: function(event, ui)
                 {
                     ui.tooltip.hover(function()
                     {
                         $(this).stop(true).fadeTo(400, 1); 
                     },
                     function()
                     {
                         $(this).fadeOut('400', function()
                         {
                             $(this).remove();
                         });
                     });
                 },
                 content: function () {
                     return self.state.tooltip;
                 }
             });
         },
         
    	getInitialState: function() {
            return {
            	icon : this.icon,
            	label : this.label,
            	tooltip : this.tooltip,
            	action : this.action,
            	disabled : false
            };
        },
        
        componentDidMount: function() {
        	this.attachTooltip();
    		this.evaluateState();
    		
			// attach handlers if any
			if(this.props.configuration.eventHandler!=undefined){
				this.props.configuration.eventHandler(this);
			}
        },

        clickEvent : function(){
        	this.evaluateState();
			// there may or may not be a dynamic action to be executed via console
			if(this.action!='') {
				GEPPETTO.CommandController.execute(this.action, true);
			}
			if(this.props.configuration.clickHandler!=undefined){
				this.props.configuration.clickHandler(this.props.id);
			}
        	$('div.ui-tooltip').remove();
        },
        
        showToolTip : function(){
        	var self = this;
			var selfSelector = $("#"+self.props.configuration.id);
			selfSelector.uitooltip({content: self.state.tooltip, position: { my: "right center", at : "left center"}});
			selfSelector.mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
        },
        
        evaluateState : function(){
			// figure out if disabled
			var disableBtn = this.props.disabled;
			if(disableBtn==undefined){
				// fall back on disableCondition from config if any
				var disableCondition = this.props.configuration.disableCondition;
				if(disableCondition!='' && disableCondition!=undefined){
					disableCondition = disableCondition.replace(/['"]+/g, '');
					disableBtn = eval(disableCondition);
				}
			}

			// figure out if hidden
			var hideBtn = this.props.hidden;
			if(hideBtn==undefined){
				// fall back on disableCondition from config if any
				var hideCondition = this.props.configuration.hideCondition;
				if(hideCondition!='' && hideCondition!=undefined){
					hideCondition = hideCondition.replace(/['"]+/g, '');
					hideBtn = eval(hideCondition);
				}
			}

			// condition could be function or string
			var condition = this.props.configuration.condition;
			var conditionResult = false;
			if(typeof condition === 'function'){
				conditionResult = condition();
			} else {
				if(condition != ''){
					condition = condition.replace(/['"]+/g, '');
					conditionResult = eval(condition);
				}
			}

        	if(!conditionResult){
        		this.icon = this.props.configuration.false.icon;
        		this.action = this.props.configuration.false.action;
        		this.label = this.props.configuration.false.label;
        		this.tooltip = this.props.configuration.false.tooltip;
        	}else{
        		this.icon = this.props.configuration.true.icon;
        		this.action = this.props.configuration.true.action;
        		this.label = this.props.configuration.true.label;
        		this.tooltip = this.props.configuration.true.tooltip;
        	}
        	
        	if(this.isMounted()){
        		this.setState({toggled: conditionResult, icon:this.icon, action:this.action, label: this.label, tooltip: this.tooltip, disabled: disableBtn, hidden: hideBtn});
        	}
        },
        
        render:  function () {
			// build css for button
			var cssClass = this.props.configuration.id + " btn pull-right";

			// figure out if toggled to reflect visually with css class
			var toggled = false;
			if(this.props.toggled!=undefined && typeof(this.props.toggled) === "boolean"){
				// if prop is passed ignore state, prop overrides precedence
				// NOTE: this lets the component be controlled from a parent with props
				toggled = this.props.toggled;
			} else {
				// fallback on internally kept state
				toggled = this.state.toggled;
			}

			if(toggled){
				cssClass += " toggle-button-toggled";
			}

			// check if the button is being hidden from he parent via prop
			if(this.props.hidden===true){
				cssClass += " toggle-button-hidden";
			}

        	return (
        			<div className="toggleButton">
        				<button id={this.props.configuration.id} className={cssClass} type="button" title=''
        				rel="tooltip" onClick={this.clickEvent} disabled={this.props.disabled===true || this.state.disabled===true}>
        					<i className={this.state.icon}></i>{this.state.label}
        				</button>
        			</div>
        	);
        }
    });
    
    return ToggleButton;
});