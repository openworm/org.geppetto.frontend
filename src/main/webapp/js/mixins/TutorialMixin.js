/**
 * Popovers used as part of GEPPETTO Components
 *
 * @mixin TutorialMixin
 */
define(function (require) {
    var React = require('react'),
        ReactDOM = require('react-dom'),
        GEPPETTO = require('geppetto'),
        $ = require('jquery');

    return {
        getDefaultProps: function () {
            return {
                popoverTitle: this.popoverTitle || 'Button',
                popoverContent: this.popoverContent || '...',
                template: this.popoverTemplate || '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
            }
        },

        destroyPopover: function () {
            $(ReactDOM.findDOMNode(this)).popover('destroy');
        },

        /**
         * Show Popover
         * @returns {HTML-Element} Created Popover
         */
        showPopover: function () {
            $(ReactDOM.findDOMNode(this)).popover({
                title: this.props.popoverTitle,
                content: this.props.popoverContent,
                placement: 'auto top',
                template: this.props.template
            }).popover('show');

            $(ReactDOM.findDOMNode(this)).on('hidden.bs.popover', (function () {
                $(ReactDOM.findDOMNode(this)).popover('destroy');
            }).bind(this));
        }
    };
});