/**
 * Reusable drop down button React component. 
 * Takes in a configuration with properties and data, uses it 
 * to create button and drop down.
 * 
 * @author Jesus R Martinez (jesus@metacell.us) 
 * 
 * @param require
 * @returns
 */
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
        onClickHandler : null,
        onLoadHandler : null,
   
        
        //Set of icons used for different drop down items
        menuItemsIcons: {
            checked: "fa fa-check-circle-o",
            unchecked: "fa fa-circle-o",
            default: "fa fa-bolt"
        },
        
    	getInitialState: function () {
            return {
                icon: this.props.configuration.iconOff,
                open: false,
                disabled: this.props.configuration.buttonDisabled,
                menuItems : null,        
                menuPosition : {},
                menuSize : {}
            };
        },
        
        //Creates array of items used for drop down button
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
        
        //Makes the drop down menu visible
        showMenu: function () {
            var self = this;
            if (self.state.menuItems.length > 0) {
                self.menu.show({
                    top: self.state.menuPosition.top,
                    left: self.state.menuPosition.left,
                    height: self.state.menuSize.height,
                    width: self.state.menuSize.width,
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
        
        //Adds external handler for click events, notifies it when a drop down item is clicked
        addExternalClickHandler : function(){
        	var self = this;
        	self.onClickHandler = self.props.configuration.onClickHandler;
        	if(self.onClickHandler !=null || undefined){
        		$(self.menu.el).on('click', function (event) {
        			if(self.onClickHandler != null || undefined){
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
        					if(self.props.configuration.closeOnClick){
        						self.toggleMenu();
        					}
        					self.onClickHandler(value);
        				}
        			}
        		});
        	}
        },
        
        //Adds external load handler, gets notified when component is mounted and ready
        addExternalLoadHandler : function(){
        	var self = this;
        	self.onLoadHandler = self.props.configuration.onLoadHandler;
        	if(self.onLoadHandler !=null || undefined){
        		self.onLoadHandler(self);
        	}
        },

        componentWillUnmount : function(){
        	this.onLoadHandler = null;
        	this.onClickHandler = null;
        },
        
        componentDidMount: function () {
            var self = this;
            var menuPosition=null
            var menuSize = null;
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuPosition == null || undefined){
            	//compute best spot for menu to show up by getting the button's top
            	//and left values, and considering padding values as well
            	menuPosition = { 
            			top : $("#"+self.props.configuration.id).offset().top + 
            				  $("#"+self.props.configuration.id).outerHeight(),
            			left: ($("#"+self.props.configuration.id).offset().left - 
            				   ($("#"+self.props.configuration.id).outerHeight()-
            				    $("#"+self.props.configuration.id).innerHeight()))
            	}
            }else{
            	//assign position of menu to what it is in configuration passed
            	menuPosition = self.props.configuration.menuPosition;
            }
            
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuSize != null || undefined){
            	menuSize = { 
            			width : self.props.configuration.menuSize.width,
            			height: self.props.configuration.menuSize.height
            	}
            }
            
            //update the state of menu with position, list to display and handler
            self.setState({menuPosition : menuPosition, menuSize : menuSize});

            //attach external handler for loading events
            self.addExternalLoadHandler();
            
            //attach external handler for clicking events
            self.addExternalClickHandler();    
            
            //applies css class to menu, css class specified in configuration
            if(self.props.configuration.menuCSS != null || undefined){
            	self.addCSSMenu(self.props.configuration.menuCSS);
            }
        },

        addCSSMenu : function(className){
        	this.menu.applyCSS(className);
        },
        
        //toggles visibility of drop down menu
        toggleMenu : function(){
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
        	//initializes drop down items from configuration
        	this.state.menuItems = this.props.configuration.menuItems;
        	
            return (
                <div className="menuButtonContainer">
                    <button className={this.props.configuration.id + " btn"} type="button" title=''
                          id={this.props.configuration.id}  onClick={this.toggleMenu} disabled={this.state.disabled} ref="menuButton">
                        <i className={this.state.icon + " menuButtonIcon"}></i>
                        {this.props.configuration.label}
                    </button>
                </div>
            );
        }
    });

    return MenuButton;
});
