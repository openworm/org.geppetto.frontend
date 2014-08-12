define(function (require) {

    var React = require('react'),
    	$ = require('jquery'),
        HelpModal = require('jsx!components/help/HelpModal');

    return React.createClass({
        mixins: [require('mixins/Button')],

        onClick: function() {
            React.renderComponent(HelpModal({show:true}), document.getElementById('modal-region'));
        	$("#help-modal").css("margin-right", "-20px");
        	$('#help-modal').css('max-height', $(window).height() * 0.7);
        	$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
        },

        getDefaultProps: function() {
            return {
                label: 'Help',
                className: 'pull-right btn-info help-button',
                icon:'icon-info-sign',
                onClick: this.onClick
            }
        }
    });
});