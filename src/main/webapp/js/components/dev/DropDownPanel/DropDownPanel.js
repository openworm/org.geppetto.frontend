define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/DropDownPanel/dropdownpanel.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react');
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

            this.state.icon = iconState;
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
        getInitialState: function () {
            return {
                visible: this.props.openByDefault,
                configuration: null,
                position: {
                    top: this.props.position.top,
                    right: this.props.position.right,
                    left: this.props.position.left,
                    bottom: this.props.position.bottom
                }
            };
        },

        componentWillMount: function() {
            GEPPETTO.DropDownPanel = this;
        },

        componentDidMount: function () {

            this.setState({configuration: this.props.data})

            if (GEPPETTO.ForegroundControls != undefined) {
                GEPPETTO.ForegroundControls.refresh();
            }

            if (this.state.visible) {
                this.open();
            }
        },

        clickEvent: function () {
            var self = this;
            self.setState({disableSave: true});
            GEPPETTO.Console.executeCommand("Project.persist();");
        },

        renderListItems: function () {
            var items = [];
            for (var i = 0; i < this.props.configuration.length; i++) {
                var item = this.props.configuration[i];
                items.push(<ListItem key={i} item={item}/>);
            }
            return items;
        },

        select: function (item) {
            this.props.selected = item;
            GEPPETTO.Console.log("selected " + item.name);
        },

        close: function () {
            this.setState({visible: false});
            $("#dropDownPanel").hide()
        },

        open: function () {
            var self = this;
            self.setState({visible: true});
            $("#dropDownPanel").css({
                top: self.state.position.top, right: self.state.position.right,
                bottom: self.state.position.bottom, left: self.state.position.left, position: 'fixed'
            });
            $("#dropDownPanel").show();
        },

        isOpen: function () {
            return this.state.visible;
        },

        render: function () {
            return (
                <div className={"dropdown-container" + (this.state.visible ? " show" : "")}>
                    <table className="dropDownTable" id="dropDownTable">
                        <tbody>
                            {this.renderListItems()}
                        </tbody>
                    </table>
                </div>
            )

        }
    });

    return DropDownControlComp;
});
