define(function (require) {

    var React = require('react'),
        HelpModal = require('jsx!components/help/HelpModal');

    return React.createClass({
        mixins: [require('mixins/Button')],

        onClick: function() {
            React.renderComponent(HelpModal({show:true}), document.getElementById('modal-region'));
        },

        getDefaultProps: function() {
            return {
                label: 'Help',
                className: 'pull-right btn-info',
                icon:'icon-info-sign',
                onClick: this.onClick
            }
        }
    });
});