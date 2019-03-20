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
    var React = require('react');
    var CreateClass = require('create-react-class');
    var GEPPETTO = require('geppetto');
    require("./MenuButton.less");

    var ListItem = CreateClass({

        updateIcon: false,
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
            this.props.handleSelect(this.props.item.value, this.props.item.radio);

            var iconState = this.icons.default;
            var action = null;

            if (this.props.item.condition != undefined) {
                // evaluate condition
                var condition = null;
                try {
                    condition = eval(this.props.item.condition);
                } catch (e) {
                    throw ("Could not evaluate condition [" + this.props.item.condition + "]");
                }

                if (typeof (condition) === "boolean") {
                    // assign action
                    action = condition ? this.props.item.true.action : this.props.item.false.action;
                    // assign icon status
                    iconState = condition ? this.icons.unchecked : this.icons.checked;
                } else {
                    throw ("The condition [" + this.props.item.condition + "] doesn't resolve to a boolean");
                }
            } else {
                // if condition does not exist, simply assign action
                action = this.props.item.action;
            }

            // execute action
            if (action != null) {
                GEPPETTO.CommandController.execute(action, true);
            }

            this.setState({ icon: iconState });
        },

        componentDidMount: function () {
            var iconState = this.getIconState();
            this.setState({ icon: iconState });
        },

        getIconState: function () {
            // figure out icon for this item
            var iconState = this.icons.default;
            if (this.props.item.condition != undefined) {
                // evaluate condition
                var condition = null;
                try {
                    condition = eval(this.props.item.condition);
                } catch (e) {
                    throw ("Could not evaluate condition [" + this.props.item.condition + "]");
                }

                if (typeof (condition) === "boolean") {
                    // assign icon status
                    iconState = condition ? this.icons.checked : this.icons.unchecked;
                } else {
                    throw ("The condition [" + this.props.item.condition + "] doesn't resolve to a boolean");
                }
            }

            return iconState;
        },

        render: function () {
            var iconState = this.getIconState();
            this.state.icon = iconState;

            var outerClass = "menuBtnListItem";
            var innerClass = "";
            if(this.props.parentDisabled && this.props.item.disabled){
                outerClass += " menuBtnListItemDisabled";
                innerClass += " menuBtnListItemDisabled";
            }

            return (
                <tr className={outerClass} onClick={this.select}>
                    <td className="selectedStatus">
                        <i className={"iconSelectionStatus " + this.state.icon}/></td>
                    <td className="dropDownLabel">
                        <label className={innerClass}>
                            <span>{this.props.item.label}</span>
                        </label>
                    </td>
                </tr>
            )
        }
    });

    var DropDownControlComp = CreateClass({
        onClickHandler: null,
        menuPosition: null,

        getInitialState: function () {
            return {
                visible: this.props.configuration.openByDefault
            };
        },

        componentDidMount: function () {
            var self = this;

            var selector = $("#" + this.props.configuration.id + "-dropDown");

            window.addEventListener('resize', function (event) {
                if (selector != null && selector != undefined) {
                    if (self.state.visible) {
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
            if (this.props.configuration.menuItems != undefined || null) {
                for (var i = 0; i < this.props.configuration.menuItems.length; i++) {
                    var item = this.props.configuration.menuItems[i];
                    if (item.radio) {
                        // include a ref for every radio item so we can call their select method from other items
                        items.push(<ListItem key={i} item={item} ref={item.value} handleSelect={this.handleSelect} parentDisabled={this.props.configuration.buttonDisabled} />);
                    } else {
                        items.push(<ListItem key={i} item={item} handleSelect={this.handleSelect} parentDisabled={this.props.configuration.buttonDisabled} />);
                    }
                }
            }
            return items;
        },

        handleSelect: function (value, radio) {
            // call select on any other 'checked' radio items to deselect them
            if (radio) {
                for (var key in this.refs) {
                    var ref = this.refs[key];
                    if ((ref.props.item.value != value) &&
                        (ref.state.icon == ref.icons.checked) &&
                        ref.props.item.radio) {
                        ref.select();
                    }
                }
            }
            this.props.handleSelect(value);

            if (this.props.configuration.autoFormatMenu) {
                for (var i = 0; i < this.props.configuration.menuItems.length; i++) {
                    var item = this.props.configuration.menuItems[i];
                    if (item.value == value) {
                        this.props.configuration.menuItems.splice(i, 1);
                        this.props.configuration.menuItems.unshift(item);
                    }
                }
            }
        },

        getMenuPosition: function () {
            var selector = $("#" + this.props.configuration.id);
            var horizontalOffset = (this.props.configuration.horizontalOffset != undefined) ? this.props.configuration.horizontalOffset : 0;
            return {
                top: selector.offset().top + selector.outerHeight(),
                left: (selector.offset().left - (selector.outerHeight() - selector.innerHeight()) - horizontalOffset)
            };
        },

        close: function () {
            this.setState({ visible: false });
        },

        calculateSizeandPosition: function () {
            var menuSize = null;
            var self = this;
            //if position wasn't specify for location of menu list
            if (self.props.configuration.menuPosition == null || self.props.configuration.menuPosition == undefined) {
                //compute best spot for menu to show up by getting the button's top
                //and left values, and considering padding values as well
                this.menuPosition = self.getMenuPosition();
            } else {
                //assign position of menu to what it is in configuration passed
                this.menuPosition = self.props.configuration.menuPosition;
            }

            if (self.props.configuration.menuSize != null && self.props.configuration.menuSize != undefined) {
                menuSize = {
                    width: self.props.configuration.menuSize.width,
                    height: self.props.configuration.menuSize.height
                }
            }

            var selector = $("#" + this.props.configuration.id + "-dropDown");
            selector.css({
                top: self.menuPosition.top, right: self.menuPosition.right,
                bottom: self.menuPosition.bottom, left: self.menuPosition.left, position: 'fixed',
            });

            var table = $("#" + this.props.configuration.id + "-dropDownTable");
            if (menuSize != null) {
                if (menuSize.width != undefined && menuSize.height != undefined) {
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
            if (this.menuPosition.top <= 0 && this.menuPosition.left <= 0) {
                this.menuPosition = this.getMenuPosition();
                var selector = $("#" + this.props.configuration.id + "-dropDown");

                if (this.menuPosition != null && this.menuPosition != undefined) {
                    var that = this;
                    selector.css({
                        top: that.menuPosition.top, right: that.menuPosition.right,
                        bottom: that.menuPosition.bottom, left: that.menuPosition.left, position: 'fixed'
                    });
                }
            }
            this.setState({ visible: true });
        },

        render: function () {
            return (
                <div id={this.props.configuration.id + "-dropDownTable"} className={(this.state.visible ? 'show' : 'hide') + " dropDownButtonContainer"}>
                    <table className={this.props.configuration.menuCSS + " dropDownTable"} id="dropDownTable">
                        <tbody>
                            {this.renderListItems()}
                        </tbody>
                    </table>
                </div>
            )

        }
    });

    var MenuButton = CreateClass({
        menu: null,
        onLoadHandler: null,
        positionUpdated: false,

        getInitialState: function () {
            return {
                icon: this.props.configuration.iconOff,
                open: false,
                configuration: this.props.configuration
            };
        },

        addMenuItem: function (item) {
            if (this.state.configuration.menuItems == null || this.state.configuration.menuItems == undefined) {
                this.state.configuration.menuItems = new Array();
            }
            this.setState({configuration: Object.assign(this.state.configuration, {menuItems: this.state.configuration.menuItems.concat(item)})});
        },

        removeMenuItem: function(value) {
            var i = this.state.configuration.menuItems.findIndex(x => x.value === value);
            if (i > -1)
                this.setState({configuration: Object.assign(this.state.configuration,
                                                            {menuItems: [...this.state.configuration.menuItems.slice(0,i),
                                                                         ...this.state.configuration.menuItems.slice(i+1)]})});
          
        },

        //Makes the drop down menu visible
        showMenu: function () {
            if (this.state.configuration.menuItems.length > 0) {
                this.refs.dropDown.open();
            }

            if (typeof this.state.configuration.menuItems.then === "function") {
            	this.state.configuration.menuItems.then(
                    function(val){
                	this.state.configuration.menuItems=val;
                	this.refs.dropDown.open();
                    }.bind(this)
                );
            }

            var showIcon = this.props.configuration.iconOn;
            this.setState({ open: true, icon: showIcon });
        },

        hideMenu: function () {
            this.refs.dropDown.close();
            var showIcon = this.props.configuration.iconOff;
            this.setState({ open: false, icon: showIcon });
        },

        //Adds external handler for click events, notifies it when a drop down item is clicked
        selectionChanged: function (value) {
            if (this.props.configuration.closeOnClick) {
                this.toggleMenu();
                if(this.onClickHandler != undefined && this.onClickHandler!= null){
                    this.onClickHandler(value);
                }
            }
        },

        //Adds external load handler, gets notified when component is mounted and ready
        addExternalLoadHandler: function () {
            this.onLoadHandler = this.props.configuration.onLoadHandler;
            if (this.onLoadHandler)
                this.onLoadHandler(this);
        },

        componentWillUnmount: function () {
            this.onLoadHandler = null;
            this.onClickHandler = null;
        },

        componentDidMount: function () {
            //attach external handler for loading events
            this.onClickHandler = this.props.configuration.onClickHandler;

            //attach external handler for clicking events
            this.addExternalLoadHandler();
            if (this.props.configuration.closeOnClick) {
                var container = $('#' + this.props.configuration.id + "-container");
                $('body').click(function (e) {
                    // if the target of the click isn't the container nor a descendant of the container
                    if (!container.is(e.target) && container.has(e.target).length === 0) {
                        if (this.props.configuration.closeOnClick) {
                            if (this.state.open) {
                                if (this.isMounted()) {
                                    this.hideMenu();
                                }
                            }
                        }
                    }
                }.bind(this));
            }
        },

        //toggles visibility of drop down menu
        toggleMenu: function () {
            if (this.state.open) {
                this.hideMenu();
            } else {
                this.showMenu();
            }
        },

        render: function () {
            return (
                <div id={this.props.configuration.id + "-container"} className="menuButtonContainer">
                    <button className={this.props.configuration.id + " btn " + this.props.configuration.buttonClassName} type="button" title=''
                        id={this.props.configuration.id} onClick={this.toggleMenu}
                        disabled={this.props.configuration.buttonDisabled && this.props.configuration.disableable} ref="menuButton">
                        <i className={this.state.icon + " menuButtonIcon"}></i>
                        {this.props.configuration.label}
                    </button>
                    <div id={this.props.configuration.id + "-dropDown"} className="menuListContainer">
                        <DropDownControlComp handleSelect={this.selectionChanged} ref="dropDown" configuration={this.state.configuration} parentDisabled={this.props.configuration.buttonDisabled} /></div>
                </div>
            );
        }
    });

    return MenuButton;
});
