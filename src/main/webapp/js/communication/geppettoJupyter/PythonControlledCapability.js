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
                        searchText: '',
                        checked: false
                    });
                    this.id = (this.props.id == undefined) ? this.props.model : this.props.id;

                    // If a handleChange method is passed as a props it will overwrite the handleChange python controlled capability
                    this.handleChange = (this.props.handleChange == undefined) ? this.handleChange.bind(this) : this.props.handleChange;
                    this.handleUpdateInput = this.handleUpdateInput.bind(this);
                    this.handleUpdateCheckbox = this.handleUpdateCheckbox.bind(this);
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id = (nextProps.id == undefined) ? nextProps.model : nextProps.id;
                    GEPPETTO.ComponentFactory.addExistingComponent(nextProps.componentType, this);
                    this.connectToPython(nextProps.componentType, nextProps.model);
                    if (this.state.searchText != nextProps.searchText) {
                        this.setState({ searchText: (nextProps.searchText === undefined) ? '' : nextProps.searchText });
                    }
                    if (this.state.checked != nextProps.checked) {
                        this.setState({ checked: (nextProps.checked === undefined) ? false : nextProps.checked });
                    }
                    if (this.state.value != nextProps.value) {
                        this.setState({ value: (nextProps.value === undefined) ? '' : nextProps.value });
                    }
                }

                componentDidUpdate(prevProps, prevState) {
                    switch (WrappedComponent.name) {
                        case 'AutoComplete':
                            if (this.state.searchText != prevState.searchText && this.props.onChange) {
                                this.props.onChange(this.state.searchText);
                            }
                            break;
                        case 'Checkbox':
                            if (this.state.checked != prevState.checked && this.props.onCheck) {
                                this.props.onCheck(null, this.state.checked);
                            }
                            break;
                        default:
                            if (this.state.value != prevState.value && this.props.onChange) {
                                this.props.onChange(null, null, this.state.value);
                            }
                            break;
                    }
                }

                setSyncValueWithPythonHandler(handler) {
                    this.syncValueWithPython = handler;
                }

                updatePythonValue(newValue) {
                    this.setState({ value: newValue, searchText: newValue, checked: newValue});

                    //whenever we invoke syncValueWithPython we will propagate the Javascript value of the model to Python
                    if (this.syncValueWithPython) {
                        // this.syncValueWithPython((event.target.type == 'number') ? parseFloat(this.state.value) : this.state.value, this.props.requirement);
                        this.syncValueWithPython(newValue, window.requirement);
                    }

                    this.forceUpdate();
                }

                // Default handle (mainly textfields and dropdowns)
                handleChange(event, index, value) {
                    // For textfields value is retrived from the event. For dropdown value is retrieved from the value
                    this.updatePythonValue((event == null || event.target.value == undefined) ? value : event.target.value);
                }

                // Autocomplete handle
                handleUpdateInput(value) {
                    this.updatePythonValue(value);
                }

                //Checkbox
                handleUpdateCheckbox(event, isInputChecked) {
                    this.updatePythonValue(isInputChecked);
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
                    const wrappedComponentProps = Object.assign({}, this.props);
                    if (wrappedComponentProps.key == undefined) {
                        wrappedComponentProps.key = wrappedComponentProps.model;
                    }
                    if (wrappedComponentProps.id == undefined) {
                        wrappedComponentProps.id = wrappedComponentProps.model;
                    }
                    delete wrappedComponentProps.model;
                    delete wrappedComponentProps.handleChange;

                    switch (WrappedComponent.name) {
                        case 'AutoComplete':
                            wrappedComponentProps['onUpdateInput'] = this.handleUpdateInput;
                            wrappedComponentProps['searchText'] = this.state.searchText;
                            break;
                        case 'Checkbox':
                            wrappedComponentProps['onCheck'] = this.handleUpdateCheckbox;
                            wrappedComponentProps['checked'] = this.state.checked;
                            delete wrappedComponentProps.searchText;
                            delete wrappedComponentProps.dataSource;
                            break;
                        default:
                            wrappedComponentProps['onChange'] = this.handleChange;
                            wrappedComponentProps['value'] = this.state.value;
                            delete wrappedComponentProps.searchText;
                            delete wrappedComponentProps.dataSource;
                            break;
                    }

                    return (
                        <WrappedComponent {...wrappedComponentProps} />
                    );
                }

            };

            return PythonControlledComponent;
        }
    }
})