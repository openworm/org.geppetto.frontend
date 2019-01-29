define(function (require) {

    var createClass = require('create-react-class');

    var widgetContainer = createClass({
        getInitialState: function () {
            return {
                items: []
            };
        },

        addChildren: function (items) {
            this.setState({ items: this.state.items.concat(items) });
        },

        setChildren: function (items) {
            this.setState({ items: items });
        },

        render: function () {
            return (
                <div key="widgetContainer">
                    {this.state.items}
                </div>
            );
        }
    });

    return widgetContainer;
});