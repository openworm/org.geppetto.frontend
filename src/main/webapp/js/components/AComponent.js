/**
 *
 * High Level widget component
 * @module Widgets/Widget
 * @author Adrian Quintana (adrian@metacell.us)
 */
define(function (require) {

    var Backbone = require('backbone');
    var React = require('react');
    var ReactDOM = require('react-dom');

        /**
         * Creates base view for widget
         */
        //https://gist.github.com/aldendaniels/5d94ecdbff89295f4cd6
        return class AbstractComponent extends React.Component {

            constructor(props) {
                super(props);
                this.dirtyView = false;
                this.container = null;
                window[this.props.id]=this;
            }

            getContainer() {
                if (this.container == null){
                    this.container = $(this.props.parentContainer).children().get(0);
                }

                // If widget is added in a react way parent Container will be null
                if (this.container == null){
                    this.container = ReactDOM.findDOMNode(this);
                }
                
                return this.container;
            }

            isWidget() {
                return false;
            }

            help() {
                return GEPPETTO.CommandController.getObjectCommands(this.props.id);
            }

            getComponentType(){
                return this.props.componentType;
            }


            /**
             * Gets the ID of the widget
             *
             * @command getId()
             * @returns {String} - ID of widget
             */
            getId() {
                return this.props.id;
            }

            getHelp() {
                return '### Inline help not yet available for this widget! \n\n' +
                    'Try the <a href="http://docs.geppetto.org/en/latest/usingwidgets.html" target="_blank">online documentation</a> instead.';
            }


            /**
             * Did something change in the state of the widget?
             *
             * @command isDirty()
             * @returns {boolean} - ID of widget
             */
            isDirty () {
                return this.dirtyView;
            }

            /**
             * Explicitly sets status of view
             * NOTE: we need to be able to control this from outside the component
             *
             * @command setDirty()
             * @param {boolean} dirty
             */
            setDirty (dirty) {
                this.dirtyView = dirty;
            }

            /**
             * Get view with attributes common to all widgets
             *
             * @returns {{size: {height: *, width: *}, position: {left: *, top: *}}}
             */
            getView() {
                return  {
                    widgetType: this.getComponentType(),
                    isWidget: this.isWidget()
                };
            }

            /**
             * Set attributes common to all widgets - override for widget specific behaviour
             *
             * @param view
             */
            setView(view) {
                // after setting view through setView, reset dirty flag
                this.dirtyView = false;
            }

            isStateLess(){
                return this.props.isStateless;
            }

            render () {
                
            }

        };
})
