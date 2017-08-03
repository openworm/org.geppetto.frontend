/**
 *
 * Synched capability
 * @module Widgets/Widget
 * @author Adrian Quintana (adrian@metacell.us)
 * @author Matteo Cantarelli (matteo@metacell.us)
 */
define(function (require) {

    var $ = require('jquery');
    var React = require('react');

    module.exports = {
        createPythonControlledComponent(WrappedComponent) {

            class PythonControlledComponent extends WrappedComponent {

                constructor(props) {
                    super(props);
                    this.state = $.extend(this.state, {
                        value: undefined
                    });
                    
                    this.id=this.props.model;
                    this.handleChange = this.handleChange.bind(this);
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id=nextProps.model;
                    GEPPETTO.ComponentFactory.addExistingComponent(nextProps.componentType, this);
                    this.connectToPython(nextProps.componentType, nextProps.model);
                }

                setSyncValueWithPythonHandler(handler){
                    this.syncValueWithPython=handler;
                }

                handleChange(event) {
                    this.state.value = event.target.value;
                    //whenever we invoke syncValueWithPython we will propagate the Javascript value of the model to Python
                    if(this.syncValueWithPython){
                        this.syncValueWithPython(event.target.value);
                    }
                    this.forceUpdate();
                }

                connectToPython(componentType, model) {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.ComponentSync(componentType="' + componentType +'",model="' + model + '").connect()');
                }

                disconnectFromPython(componentType, model) {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.remove_component_sync(componentType="' + this.props.componentType +'",model="' + this.props.model + '")');
                    GEPPETTO.ComponentFactory.removeExistingComponent(this.props.componentType, this);
                }

                componentDidMount() {
                    GEPPETTO.ComponentFactory.addExistingComponent(this.props.componentType, this);
                    this.connectToPython(this.props.componentType, this.props.model);
                }


                render() {
                    return (
                        <WrappedComponent {...this.props} componentType={WrappedComponent.name} value={this.state.value} onChange={this.handleChange} />
                    );
                }

            };

            return PythonControlledComponent;
        }
    }
})