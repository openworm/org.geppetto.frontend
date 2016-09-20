define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/menubutton/menubutton.css";
    document.getElementsByTagName("head")[0].appendChild(link);
    
    var React = require('react');
    var GEPPETTO = require('geppetto');

    var MenuButton = React.createClass({
        getInitialState: function () {
            return {
                icon: this.props.configuration.iconOff,
                open: false,
                disabled: true,
                menu : null,
                menuItems : null,
                menuPosition: {
                    top: this.props.configuration.menuPosition.top,
                    right: this.props.configuration.menuPosition.right,
                    left: this.props.configuration.menuPosition.left,
                    bottom: this.props.configuration.menuPosition.bottom
                }
            };
        },
        
        getMenuItems: function () {
            var data = [];
            for (var i = 0; i < this.state.menuItems.length; i++) {
                data.push({
                    "label": this.state.menuItems[i].label,
                    "action": this.state.menuItems[i].action,
                    "condition" : this.state.menuItems[i].condition,
                    "value" : this.state.menuItems[i].value,
                    "icon": "fa fa-bolt",
                    "position": i
                })
            }
            return data;
        },
        
        showMenu: function () {
            var self = this;
            if (self.state.menuItems.length > 0) {
                self.state.menu.show({
                    top: self.state.menuPosition.top,
                    left: self.state.menuPosition.left,
                    groups: self.getMenuItems(),
                    data: self
                });
            }
            return false;
        },
        
        hideMenu : function(){
        	this.state.menu.hide();
        },

        componentDidMount: function () {
            var self = this;
            GEPPETTO.on(Events.Experiment_active, function () {
                if (!self.state.disabled) {
                    if (GEPPETTO.DropDownPanel.isOpen()) {
                        GEPPETTO.DropDownPanel.close();
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
            
            this.setState({ menu: new GEPPETTO.ContextMenuView(), menuItems : self.props.configuration.menuItems});
            
//            this.props.top = parseInt($('.menuButton').css('top'));
//            this.props.left = parseInt($('.menuButton').css('left'));
        },
        
        clickEvent: function () {
            var showIcon;
            if (this.state.open) {
                this.showMenu();
            	showIcon = this.props.configuration.iconOff;
                this.setState({open: false, icon: showIcon});
            } else {
            	this.hideMenu();
                showIcon = this.props.configuration.iconOn;
                this.setState({open: true, icon: showIcon});
            }
        },

        render: function () {
            return (
                <div className="menuButtonContainer">
                    <button className="btn menuButton pull-right" type="button" title=''
                            onClick={this.clickEvent} disabled={this.state.disabled} ref="menuButton">
                        <i className={this.state.icon}></i>
                        {this.props.configuration.label}
                    </button>
                </div>
            );
        }
    });

    return MenuButton;
});