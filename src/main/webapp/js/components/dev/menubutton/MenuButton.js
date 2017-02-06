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
    	
    	updateIcon : false,
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
                GEPPETTO.Console.executeImplicitCommand(action);
            }

            this.setState({icon: iconState});
            
            this.props.handleSelect(this.props.item.value);
        },

        componentDidMount: function () {
        	var iconState = this.getIconState();
        	this.setState({icon: iconState});
        }, 
        
        getIconState : function(){
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

        	return iconState;
        },

        render: function () {
        	var iconState = this.getIconState();
        	this.state.icon = iconState;
        	
            return <tr onClick={this.select}>
                <td className="selectedStatus">
                    <i className={"iconSelectionStatus " + this.state.icon} /></td>
                <td className="dropDownLabel"><label>
                    <span>{this.props.item.label}</span>
                </label></td>
            </tr>
        }
    });

    var DropDownControlComp = React.createClass({
    	onClickHandler : null,
    	menuPosition : null,
    	
        getInitialState: function () {
            return {
                visible: this.props.configuration.openByDefault,
                configuration: null
            };
        },

        componentDidMount: function () {
            var self = this;
            
            var selector = $("#"+this.props.configuration.id+"-dropDown");
            
            window.addEventListener('resize', function(event){
            	if(selector!=null && selector!=undefined){
            		if(self.state.visible){
                        self.menuPosition = self.getMenuPosition();
            			selector.css({
            				top: self.menuPosition.top, right: self.menuPosition.right,
            				bottom: self.menuPosition.bottom, left: self.menuPosition.left, position: 'fixed',
            			});
            		}
            	}
            });
        },

        renderListItems: function () {
            var items = [];
            if(this.props.configuration.menuItems != undefined || null){
            	for (var i = 0; i < this.props.configuration.menuItems.length; i++) {
            		var item = this.props.configuration.menuItems[i];
            		items.push(<ListItem key={i} item={item} handleSelect={this.handleSelect}/>);
            	}
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

        getMenuPosition : function(){
            var selector = $("#"+this.props.configuration.id);
        	return { 
        		top : selector.offset().top + selector.outerHeight(),
        		left: (selector.offset().left - (selector.outerHeight()-selector.innerHeight()))
        	};
        },
        
        close: function () {
        	this.setState({visible: false});
        },

        calculateSizeandPosition : function(){
            var menuSize = null;
        	var self = this;
            //if position wasn't specify for location of menu list
            if(self.props.configuration.menuPosition == null || self.props.configuration.menuPosition == undefined){
            	//compute best spot for menu to show up by getting the button's top
            	//and left values, and considering padding values as well
            	this.menuPosition = self.getMenuPosition();
            }else{
            	//assign position of menu to what it is in configuration passed
            	this.menuPosition = self.props.configuration.menuPosition;
            }
            
            if(self.props.configuration.menuSize != null && self.props.configuration.menuSize != undefined){
            	menuSize = { 
            			width : self.props.configuration.menuSize.width,
            			height: self.props.configuration.menuSize.height
            	}
            }
            
            var selector = $("#"+this.props.configuration.id+"-dropDown");
            selector.css({
                top: self.menuPosition.top, right: self.menuPosition.right,
                bottom: self.menuPosition.bottom, left: self.menuPosition.left, position: 'fixed',
            });
            
            var table = $("#"+this.props.configuration.id+"-dropDownTable");
            if(menuSize!=null){
            	if(menuSize.width != undefined && menuSize.height!=undefined){
            		table.css({
            			width: menuSize.width,
            			height: menuSize.height,
            		});
            	}
            }
        },
        
        open: function () {
        	this.calculateSizeandPosition();
            
        	//makes sure that menu position is not offscreen or at 0,0
        	if(this.menuPosition.top <=0 && this.menuPosition.left<=0){
        		this.menuPosition = this.getMenuPosition();
            	var selector = $("#"+this.props.configuration.id+"-dropDown");
            	
            	if(this.menuPosition!= null && this.menuPosition!=undefined){
            		var that = this;
            		selector.css({
            			top: that.menuPosition.top, right: that.menuPosition.right,
            			bottom: that.menuPosition.bottom, left: that.menuPosition.left, position: 'fixed'
            		});
            	}
        	}
            this.setState({visible: true});
        },
        
        render: function () {
            return (
                <div id={this.props.configuration.id+"-dropDownTable"} className={(this.state.visible ? 'show' : 'hide') + " dropDownButtonContainer"}>
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
                menuItems : this.props.configuration.menuItems,        
            };
        },
                
        refresh : function(){
        	this.forceUpdate();
        },
        
        updateMenuItems : function(items){
        	this.setState({menuItems : items});
        },
        
        addMenuItem : function(item){
        	if(this.props.configuration.menuItems== null || this.props.configuration.menuItems== undefined){
        		this.props.configuration.menuItems = new Array();
        	}
        	this.props.configuration.menuItems.push(item);
    		this.refresh();
        },
        
        //Makes the drop down menu visible
        showMenu: function () {
            var self = this;
            if (self.props.configuration.menuItems.length > 0) {
                self.refs.dropDown.open();    
            }
            
            var showIcon = this.props.configuration.iconOn;
            this.setState({open: true, icon: showIcon});
            return false;
        },
        
        hideMenu : function(){
        	this.refs.dropDown.close();
        	var showIcon = this.props.configuration.iconOff;
            this.setState({open: false, icon: showIcon});
        },
        
        //Adds external handler for click events, notifies it when a drop down item is clicked
        selectionChanged : function(value){
        	if(this.props.configuration.closeOnClick){
				this.toggleMenu();
				this.onClickHandler(value);
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
            
            //attach external handler for loading events
            self.onClickHandler = self.props.configuration.onClickHandler;
            
            //attach external handler for clicking events
            self.addExternalLoadHandler();
            if(this.props.configuration.closeOnClick){
            	$('body').click(function(e) {
            	    if (!$(e.target).closest(".btn").length){
            	    	if(self.props.configuration.closeOnClick){
             				if(self.state.open){
             					if(self.isMounted()){
             						self.hideMenu();
             					}
             				}
             			}
            	    }
            	});
            }
        },

        //toggles visibility of drop down menu
        toggleMenu : function(){
        	var showIcon;
        	
            if (this.state.open) {
                this.hideMenu();
            } else {
            	this.showMenu();
            }
        },
        
        render: function () {
            return (
                    <div className="menuButtonContainer">
                    <button className={this.props.configuration.id + " btn "+ this.props.configuration.buttonClassName} type="button" title=''
                          id={this.props.configuration.id}  onClick={this.toggleMenu} disabled={this.props.configuration.buttonDisabled} ref="menuButton">
                        <i className={this.state.icon + " menuButtonIcon"}></i>
                        {this.props.configuration.label}
                     </button>
                     <div id={this.props.configuration.id+"-dropDown"} className="menuListContainer">
                     <DropDownControlComp handleSelect={this.selectionChanged}  ref="dropDown" configuration={this.props.configuration}/></div>
                     </div>
            );
        }
    });

    return MenuButton;
});
