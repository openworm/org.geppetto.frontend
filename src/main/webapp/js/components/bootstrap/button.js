/**
 * Bootstrap button
 *
 * @module components/button
 */
define(function (require) {

    var React = require('react');

    return React.createClass({

        mixins: [require('mixins/TutorialMixin')],

        displayName: 'Button',

        /**
         * Get default properties of button component
         * 
         * @returns {Object} Properties for button component
         */
        getDefaultProps: function() {
        	return {
        		disabled: false,
        		className: ''
        	}
        },

        /**
         * Render button 
         */
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