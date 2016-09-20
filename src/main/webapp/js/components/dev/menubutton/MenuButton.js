define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/menubutton/menubutton.css";
    document.getElementsByTagName("head")[0].appendChild(link);
    
    var React = require('react');
    var GEPPETTO = require('geppetto');

    var MenuButton = React.createClass({
        menu: new GEPPETTO.ContextMenuView(),
        menuPosition : {},
        menuSize : {},
        clickHandler : null,
        
        menuItemsIcons: {
            checked: "fa fa-check-circle-o",
            unchecked: "fa fa-circle-o",
            default: "fa fa-bolt"
        },
        
    	getInitialState: function () {
            return {
                icon: this.props.configuration.iconOff,
                open: false,
                disabled: true,
                menuItems : null
            };
        },
        
        getMenuItems: function () {
            var iconState = this.menuItemsIcons.default;
            var data = [];
            for (var i = 0; i < this.state.menuItems.length; i++) {
            	var action = null;
            	if (this.state.menuItems[i].condition != undefined) {
                    // evaluate condition
                    var condition = null;
                    try {
                        condition = eval(this.state.menuItems[i].condition);
                    } catch(e){
                        throw( "Could not evaluate condition [" + this.state.menuItems[i].condition + "]" );
                    }

                    if(typeof(condition) === "boolean"){
                        // assign action
                        action = condition ? this.state.menuItems[i].true.action : this.state.menuItems[i].false.action;
                        // assign icon status
                        iconState = condition ? this.menuItemsIcons.unchecked : this.menuItemsIcons.checked;
                    } else {
                        throw( "The condition [" + this.state.menuItems[i].condition + "] doesn't resolve to a boolean" );
                    }
                } else {
                    // if condition does not exist, simply assign action
                    action = this.state.menuItems[i].action;
                }

                data.push({
                    "label": this.state.menuItems[i].label,
                    "action": [action],
                    "icon": iconState,
                    "position": i
                })
            }
            return data;
        },
        
        showMenu: function () {
            var self = this;
            if (self.state.menuItems.length > 0) {
                self.menu.show({
                    top: self.menuPosition.top,
                    left: self.menuPosition.left,
                    height: self.menuSize.height,
                    width: self.menuSize.width,
                    closeOnClick : self.props.configuration.closeOnClick,
                    groups: self.getMenuItems(),
                    data: self
                });    
            }
            return false;
        },
        
        hideMenu : function(){
        	this.menu.hide();
        },
        
        addExternalHandler : function(){
        	var self = this;
        	if(self.props.configuration.clickHandler !=null || undefined){
        		$(self.menu.el).on('click', function (event) {
        			var itemId = $(event.target).attr('id');
        			var registeredItem = self.menu.getClickedItem(itemId);
        			if(registeredItem != null || undefined){
        				var label = registeredItem["label"];
        				var value = null;
        				for(var i =0; i<self.state.menuItems.length; i++){
        					if(self.state.menuItems[i].label == label){
        						value = self.state.menuItems[i].value;
        					}
        				}

        				self.props.configuration.clickHandler(value);
        			}
        		});
        	}
        },

        componentDidMount: function () {
            var self = this;
            GEPPETTO.on(Events.Experiment_active, function () {
                if (!self.state.disabled) {
                    if (self.state.open) {
                        self.hideMenu();
                    }
                }
                var experiment = window.Project.getActiveExperiment();
                var newState = true;
                if (experiment != null || undefined) {
                    if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        newState = false;
                    }
                }
                self.setState({disabled: newState});
            });

            GEPPETTO.on(Events.Experiment_completed, function (experimentID) {
                var newState = self.state.disabled;
                var experiment = window.Project.getActiveExperiment();
                if (experiment.getId() == experimentID) {
                    newState = false;
                }
                self.setState({disabled: newState});
            });
            
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuPosition == null || undefined){
            	self.menuPosition = { 
            			top : $("#"+self.props.configuration.id).position().top + 35,
            			left: $("#"+self.props.configuration.id).position().left
            	}
            }else{
            	//assign position of menu to what it is in configuration passed
            	self.menuPosition = self.configuration.menuPosition;
            }
            
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuSize != null || undefined){
            	self.menuSize = { 
            			width : self.props.configuration.menuSize.width,
            			height: self.props.configuration.menuSize.height
            	}
            }
            
            //update the state of menu with position, list to display and handler
            self.setState({menuItems : self.props.configuration.menuItems});
            
            //attach handler to clicking on menu to notify attached handlers
            self.addExternalHandler();
        },
        
        clickEvent: function () {
            var showIcon;
            if (this.state.open) {
                this.hideMenu();
            	showIcon = this.props.configuration.iconOff;
                this.setState({open: false, icon: showIcon});
            } else {
            	this.showMenu();
                showIcon = this.props.configuration.iconOn;
                this.setState({open: true, icon: showIcon});
            }
        },

        render: function () {
            return (
                <div className="menuButtonContainer">
                    <button className="btn menuButton pull-right" type="button" title=''
                          id={this.props.configuration.id}  onClick={this.clickEvent} disabled={this.state.disabled} ref="menuButton">
                        <i className={this.state.icon}></i>
                        {this.props.configuration.label}
                    </button>
                </div>
            );
        }
    });

    return MenuButton;
});