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
                        value: '',
                        searchText: ''
                    });
                    this.id = (this.props.id == undefined) ? this.props.model : this.props.id;
                    this.handleChange = this.handleChange.bind(this);
                    this.handleUpdateInput = this.handleUpdateInput.bind(this);
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id = (nextProps.id == undefined) ? nextProps.model : nextProps.id;
                    GEPPETTO.ComponentFactory.addExistingComponent(nextProps.componentType, this);
                    this.connectToPython(nextProps.componentType, nextProps.model);
                    if (this.state.searchText != nextProps.searchText) {
                        this.setState({ searchText: (nextProps.searchText === undefined) ? '' : nextProps.searchText });
                    }
                    if (this.state.value != nextProps.value) {
                        this.setState({ value: (nextProps.value === undefined) ? '' : nextProps.value });
                    }
                }

                setSyncValueWithPythonHandler(handler) {
                    this.syncValueWithPython = handler;
                }

                handleChange(event, index, value) {
                    // For textfields value is retrived from the event. For dropdown value is retrieved from the value
                    var newValue = (event.target.value == undefined) ? value : event.target.value;
                    this.setState({ value: newValue });

                    //whenever we invoke syncValueWithPython we will propagate the Javascript value of the model to Python
                    if (this.syncValueWithPython) {
                        // this.syncValueWithPython((event.target.type == 'number') ? parseFloat(this.state.value) : this.state.value, this.props.requirement);
                        this.syncValueWithPython(newValue, this.props.requirement);
                    }
                    if (this.props.onChange) {
                        this.props.onChange(event, index, value);
                    }
                    this.forceUpdate();
                }

                handleUpdateInput(value) {
                    // For textfields value is retrived from the event. For dropdown value is retrieved from the value
                    this.setState({ value: value });

                    //whenever we invoke syncValueWithPython we will propagate the Javascript value of the model to Python
                    if (this.syncValueWithPython) {
                        // this.syncValueWithPython((event.target.type == 'number') ? parseFloat(this.state.value) : this.state.value, this.props.requirement);
                        this.syncValueWithPython(value, this.props.requirement);
                    }
                    if (this.props.onChange) {
                        this.props.onChange(value);
                    }
                    this.forceUpdate();
                }

                connectToPython(componentType, model) {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.ComponentSync(componentType="' + componentType + '",model="' + model + '",id="' + this.id + '").connect()');
                }

                disconnectFromPython() {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.remove_component_sync(componentType="' + this.props.componentType + '",model="' + this.id + '")');
                    GEPPETTO.ComponentFactory.removeExistingComponent(this.props.componentType, this);
                }

                componentDidMount() {
                    GEPPETTO.ComponentFactory.addExistingComponent(this.props.componentType, this, true);
                    if (this.props.model != undefined) {
                        this.connectToPython(this.props.componentType, this.props.model);
                    }
                }

                render() {
                    return (
                        <WrappedComponent {...this.props} componentType={WrappedComponent.name} value={this.state.value} searchText={this.state.searchText} onChange={this.handleChange} onUpdateInput={this.handleUpdateInput} />
                    );
                }

            };

            return PythonControlledComponent;
        }
    }
})