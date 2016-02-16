/**
 * Popovers used as part of GEPPETTO Components
 *
 * @mixin TutorialMixin
 */
define(function (require) {
    var React = require('react'),
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
            $(this.getDOMNode()).popover('destroy');
        },

        /**
         * Show Popover
         * @returns {HTML-Element} Created Popover
         */
        showPopover: function () {
            $(this.getDOMNode()).popover({
                title: this.props.popoverTitle,
                content: this.props.popoverContent,
                placement: 'auto top',
                template: this.props.template
            }).popover('show');

            $(this.getDOMNode()).on('hidden.bs.popover', (function () {
                $(this.getDOMNode()).popover('destroy');
            }).bind(this));
        }
    };
});