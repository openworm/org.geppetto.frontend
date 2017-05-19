define(function (require) {
    /**
     * Button used as part of GEPPETTO Components
     *
     * @mixin Button
     */
    var React = require('react');

    return {
        displayName: 'Button',

        render: function () {
            return (
                React.DOM.button({
                    type: 'button',
                    id: this.props.id,
                    className: 'btn ' + this.props.className + ((this.props.hidden === true) ? ' hiddenElement' : ''),
                    'data-toggle': this.props['data-toggle'],
                    onClick: this.props.onClick,
                    disabled: this.props.disabled,
                    icon : this.props.icon
                }, React.DOM.i({className: this.props.icon}), " " + this.props.label)
            );
        }
    };
});