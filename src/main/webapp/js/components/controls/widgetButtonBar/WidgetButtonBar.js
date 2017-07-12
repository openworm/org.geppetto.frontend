define(function (require) {

    var React = require('react');
    require("./WidgetButtonBar.less");

    var WidgetButtonBar = React.createClass({
        getInitialState: function () {
            return {

            };
        },

        componentDidMount: function () {

        },

        render: function () {
            return (
                <div className="displayArea">
                    {this.props.children}
                </div>
            );
        }
    });

    return WidgetButtonBar;
});