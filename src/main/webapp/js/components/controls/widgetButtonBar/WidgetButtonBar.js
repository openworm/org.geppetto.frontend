define(function (require) {

    var createClass = require('create-react-class');
    require("./WidgetButtonBar.less");

    var WidgetButtonBar = createClass({
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