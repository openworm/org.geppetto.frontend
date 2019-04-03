define(function (require) {

    var React = require('react');
    var createClass = require('create-react-class');
    return createClass({

        mixins: [],

        displayName: 'Button',

        getDefaultProps: function () {
            return {
                disabled: false,
                className: ''
            }
        },

        render: function () {
            return (
                React.DOM.button({
                    type: 'button',
                    className: 'btn ' + this.props.className,
                    'data-toggle': this.props['data-toggle'],
                    onClick: this.props.onClick,
                    disabled: this.props.disabled
                }, React.DOM.i({className: this.props.icon}, " " + this.props.children))
            );
        }
    });
});