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
	var ReactDOM = require('react-dom');
    var GEPPETTO = require('geppetto');

    var ListItem = React.createClass({

        icons: {
            checked: "fa fa-check-circle-o",
            unchecked: "fa fa-circle-o",
            default: "fa fa-bolt"
        },

        getInitialState: function () {
            return {
                icon: ""
            };
        },

        select: function () {
            var iconState = this.icons.default;
            var action = null;

            if (this.props.item.condition != undefined) {
                // evaluate condition
                var condition = null;
                try {
                    condition = eval(this.props.item.condition);
                } catch(e){
                    throw( "Could not evaluate condition [" + this.props.item.condition + "]" );
                }

                if(typeof(condition) === "boolean"){
                    // assign action
                    action = condition ? this.props.item.true.action : this.props.item.false.action;
                    // assign icon status
                    iconState = condition ? this.icons.unchecked : this.icons.checked;
                } else {
                    throw( "The condition [" + this.props.item.condition + "] doesn't resolve to a boolean" );
                }
            } else {
                // if condition does not exist, simply assign action
                action = this.props.item.action;
            }

            // execute action
            if(action != null){
                GEPPETTO.Console.executeCommand(action);
            }

            this.setState({icon: iconState});
            
            this.props.handleSelect(this.props.item.value);
        },

        componentDidMount: function () {
            // figure out icon for this item
            var iconState = this.icons.default;
            if (this.props.item.condition != undefined) {
                // evaluate condition
                var condition = null;
                try {
                    condition = eval(this.props.item.condition);
                } catch(e){
                    throw( "Could not evaluate condition [" + this.props.item.condition + "]" );
                }

                if(typeof(condition) === "boolean"){
                    // assign icon status
                    iconState = condition ? this.icons.checked : this.icons.unchecked;
                } else {
                    throw( "The condition [" + this.props.item.condition + "] doesn't resolve to a boolean" );
                }
            }

            this.setState({icon: iconState});
        },

        render: function () {
            return <tr onClick={this.select}>
                <td className="selectedStatus">
                    <i className={"iconSelectionStatus " + this.state.icon}></i></td>
                <td className="dropDownLabel"><label>
                    <span>{this.props.item.label}</span>
                </label></td>
            </tr>
        }
    });

    var DropDownControlComp = React.createClass({
    	onClickHandler : null,
    	
        getInitialState: function () {
            return {
                visible: this.props.configuration.openByDefault,
                configuration: null,
                position: {
                    top: this.props.configuration.position.top,
                    right: this.props.configuration.position.right,
                    left: this.props.configuration.position.left,
                    bottom: this.props.configuration.position.bottom
                }
            };
        },

        componentDidMount: function () {
            if (this.state.visible) {
                this.open();
            }else{
            	this.close();
            }
        },

        clickEvent: function () {
            var self = this;
            self.setState({disableSave: true});
            GEPPETTO.Console.executeCommand("Project.persist();");
        },

        renderListItems: function () {
            var items = [];
            for (var i = 0; i < this.props.configuration.menuItems.length; i++) {
                var item = this.props.configuration.menuItems[i];
                items.push(<ListItem key={i} item={item} handleSelect={this.handleSelect}/>);
            }
            return items;
        },

        handleSelect: function (value) {
        	 this.props.handleSelect(value);
        	 
        	 if(this.props.configuration.autoFormatMenu){
        		 for (var i = 0; i < this.props.configuration.menuItems.length; i++) {
        			 var item = this.props.configuration.menuItems[i];
        			 if(item.value == value){
        				 this.props.configuration.menuItems.splice(i,1);
        				 this.props.configuration.menuItems.unshift(item);
        			 }   
        		 }

        		 this.forceUpdate();
        	 }
        },

        close: function () {
            $("#"+this.props.configuration.id).hide()
        },

        open: function () {
            var self = this;
            $("#"+this.props.configuration.id).css({
                top: self.state.position.top, right: self.state.position.right,
                bottom: self.state.position.bottom, left: self.state.position.left, position: 'fixed'
            });
            $("#"+this.props.configuration.id).show();
        },
        
        render: function () {
            return (
                <div id={this.props.configuration.id} className={"dropDownButtonContainer"}>
                    <table className={this.props.configuration.menuCSS + " dropDownTable"} id="dropDownTable">
                        <tbody>
                            {this.renderListItems()}
                        </tbody>
                    </table>
                </div>
            )

        }
    });

    var MenuButton = React.createClass({
    	menu : null,
        onLoadHandler : null,
        positionUpdated : false,

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
                
        //Makes the drop down menu visible
        showMenu: function () {
            var self = this;
            if (self.state.menuItems.length > 0) {
                self.menu.open();    
            }
            return false;
        },
        
        hideMenu : function(){
        	this.menu.close();
        },
        
        //Adds external handler for click events, notifies it when a drop down item is clicked
        selectionChanged : function(value){
        	if(this.props.configuration.closeOnClick){
				this.toggleMenu();
			}
			this.onClickHandler(value);
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
        
        getMenuPosition : function(){
        	return { 
        		top : $("#"+this.props.configuration.id).offset().top + 
        				$("#"+this.props.configuration.id).outerHeight(),
        		left: ($("#"+this.props.configuration.id).offset().left - 
        				($("#"+this.props.configuration.id).outerHeight()-
        						$("#"+this.props.configuration.id).innerHeight()))
        	};
        },
        
        componentDidMount: function () {
            var self = this;
            var menuPosition=null
            var menuSize = null;
           
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuPosition == null || undefined){
            	//compute best spot for menu to show up by getting the button's top
            	//and left values, and considering padding values as well
            	menuPosition = self.getMenuPosition();
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
            self.onClickHandler = self.props.configuration.onClickHandler;
            
            //attach external handler for clicking events
            self.addExternalLoadHandler();    
            
            var containerID = this.props.configuration.id+"-dropDown";

            var configuration = {
            		openByDefault : self.props.configuration.openByDefault,
            		menuItems : self.props.configuration.menuItems,
            		position : menuPosition,
            		id : containerID,
            		menuCSS : self.props.configuration.menuCSS,
            		autoFormatMenu : self.props.configuration.autoFormatMenu,
            };
            
            self.menu = new DropDownControlComp({configuration});
                        
            ReactDOM.render(<DropDownControlComp handleSelect={this.selectionChanged}  configuration={configuration}/>, document.getElementById(containerID));
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
                    <div id={this.props.configuration.id+"-dropDown"} className="menuListContainer"></div>
                </div>
            );
        }
    });

    return MenuButton;
});
