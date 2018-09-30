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
    var Utils = require('./GeppettoJupyterUtils');

    module.exports = {
        createPythonControlledComponent(WrappedComponent) {
            class PythonControlledComponent extends WrappedComponent {
                constructor(props) {
                    super(props);
                    if (this.state == undefined) {
                        this.state = {};
                    }
                    this.state.model = props.model;
                    this.state.componentType = WrappedComponent.name;
                    this.id = (this.props.id == undefined) ? this.props.model : this.props.id;
                }

                setSyncValueWithPythonHandler(handler) {
                    this.syncValueWithPython = handler;
                }

                connectToPython(componentType, model) {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.ComponentSync(componentType="' + componentType + '",model="' + model + '",id="' + this.id + '").connect()');
                }

                disconnectFromPython() {
                    var kernel = IPython.notebook.kernel;
                    kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
                    kernel.execute('GeppettoJupyterGUISync.remove_component_sync(componentType="' + this.state.componentType + '",model="' + this.id + '")');
                    GEPPETTO.ComponentFactory.removeExistingComponent(this.state.componentType, this);
                }

                componentWillUnmount() {
                    this.disconnectFromPython();
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id = (nextProps.id == undefined) ? nextProps.model : nextProps.id;
                    GEPPETTO.ComponentFactory.addExistingComponent(this.state.componentType, this);
                    this.connectToPython(this.state.componentType, nextProps.model);
                    if (this.state.value != nextProps.value) {
                        this.setState({ value: (nextProps.value === undefined) ? '' : nextProps.value });
                    }
                }

                componentDidMount() {
                    GEPPETTO.ComponentFactory.addExistingComponent(this.state.componentType, this, true);
                    if (this.props.model != undefined) {
                        this.connectToPython(this.state.componentType, this.props.model);
                    }
                    if (this.props.value != undefined) {
                        this.setState({ value: this.props.value });
                    }
                }
            }

            return PythonControlledComponent;
        },

        createPythonControlledControl(WrappedComponent) {

            var PythonControlledComponent = this.createPythonControlledComponent(WrappedComponent);
            class PythonControlledControl extends PythonControlledComponent {

                constructor(props) {
                    super(props);
                    this.state = $.extend(this.state, {
                        value: '',
                        searchText: '',
                        checked: false
                    });

                    // If a handleChange method is passed as a props it will overwrite the handleChange python controlled capability
                    this.handleChange = (this.props.handleChange == undefined) ? this.handleChange.bind(this) : this.props.handleChange.bind(this);
                    this.handleUpdateInput = this.handleUpdateInput.bind(this);
                    this.handleUpdateCheckbox = this.handleUpdateCheckbox.bind(this);
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id = (nextProps.id == undefined) ? nextProps.model : nextProps.id;
                    GEPPETTO.ComponentFactory.addExistingComponent(this.state.componentType, this);
                    this.connectToPython(this.state.componentType, nextProps.model);
                    if (this.state.searchText != nextProps.searchText) {
                        this.setState({ searchText: (nextProps.searchText === undefined) ? '' : nextProps.searchText });
                    }
                    if (this.state.checked != nextProps.checked) {
                        this.setState({ checked: (nextProps.checked === undefined) ? false : nextProps.checked });
                    }
                    if (this.state.value != nextProps.value) {
                        this.setState({ value: (nextProps.value === undefined) ? '' : nextProps.value });
                    }
                    if (this.state.model != nextProps.model) {
                        this.setState({ model: (nextProps.model === undefined) ? '' : nextProps.model });
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
                    if (this.props.validate) {
                        this.props.validate(this.state.value).then((errorState) => {
                            this.setState(errorState);
                        });
                    }
                }

                updatePythonValue(newValue) {
                    if (this.props.prePythonSyncProcessing!==undefined) {
                        newValue = this.props.prePythonSyncProcessing(newValue);
                    }
                    //whenever we invoke syncValueWithPython we will propagate the Javascript value of the model to Python
                    if (this.syncValueWithPython) {
                        // this.syncValueWithPython((event.target.type == 'number') ? parseFloat(this.state.value) : this.state.value, this.props.requirement);
                        switch (this.props.realType) {
                            case 'float':
                                if (!isNaN(newValue) && newValue !== '') {
                                    newValue = parseFloat(newValue)
                                }
                                break;
                            case 'dict':
                                if (typeof newValue === 'string') {
                                    newValue = JSON.parse(newValue)
                                }
                                break;
                            default:
                                break;
                        }
                        if (newValue !== '') {
                            this.syncValueWithPython(newValue, window.requirement);
                        }
                    }
                    this.setState({ value: newValue, searchText: newValue, checked: newValue });
                    this.forceUpdate();
                }

                triggerUpdate(updateMethod) {
                    //common strategy when triggering processing of a value change, delay it, every time there is a change we reset
                    if (this.updateTimer != undefined) {
                        clearTimeout(this.updateTimer);
                    }
                    this.updateTimer = setTimeout(updateMethod, 1000);
                }
                // Default handle (mainly textfields and dropdowns)
                handleChange(event, index, value) {
                    var targetValue = value;
                    if (event != null && event.target.value != undefined) {
                        targetValue = event.target.value;
                    }
                    this.setState({ value: targetValue });

                    if (this.props.validate) {
                        this.props.validate(targetValue).then((errorState) => {
                            this.setState(errorState);
                        });
                    }

                    // For textfields value is retrieved from the event. For dropdown value is retrieved from the value
                    this.triggerUpdate(() => this.updatePythonValue(targetValue));
                }

                // Autocomplete handle
                handleUpdateInput(value) {
                    this.triggerUpdate(() => this.updatePythonValue(value));
                }

                //Checkbox
                handleUpdateCheckbox(event, isInputChecked) {
                    this.triggerUpdate(() => this.updatePythonValue(isInputChecked));
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

                    delete wrappedComponentProps.modelName;
                    delete wrappedComponentProps.dimensionType;
                    delete wrappedComponentProps.noStyle;
                    delete wrappedComponentProps.validate;
                    delete wrappedComponentProps.prePythonSyncProcessing;

                    if (wrappedComponentProps.realType == 'func' || wrappedComponentProps.realType == 'float') {
                        wrappedComponentProps['errorText'] = this.state.errorMsg;
                    }
                    if (WrappedComponent.name != 'ListComponent') {
                        delete wrappedComponentProps.realType;
                    }

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
                            delete wrappedComponentProps.floatingLabelText;
                            delete wrappedComponentProps.hintText;
                            break;
                        default:
                            wrappedComponentProps['onChange'] = this.handleChange;
                            wrappedComponentProps['value'] = (typeof this.state.value === 'object' && this.state.value !== null && !Array.isArray(this.state.value)) ? JSON.stringify(this.state.value) : this.state.value;
                            delete wrappedComponentProps.searchText;
                            delete wrappedComponentProps.dataSource;
                            break;
                    }

                    return (
                        <WrappedComponent {...wrappedComponentProps} />
                    );
                }

            };

            return PythonControlledControl;
        },

        createPythonControlledControlWithPythonDataFetch(WrappedComponent) {

            var PythonControlledComponent = this.createPythonControlledComponent(WrappedComponent);
            class PythonControlledControlWithPythonDataFetch extends PythonControlledComponent {

                constructor(props) {
                    super(props);
                    this.state = $.extend(this.state, {
                        value: [],
                        items: [],
                        pythonData: []
                    });
                    // If a handleChange method is passed as a props it will overwrite the handleChange python controlled capability
                    this.handleChange = (this.props.handleChange == undefined) ? this.handleChange.bind(this) : this.props.handleChange.bind(this);
                    this.callPythonMethod();
                }

                componentWillReceiveProps(nextProps) {
                    this.disconnectFromPython();
                    this.id = (nextProps.id == undefined) ? nextProps.model : nextProps.id;
                    GEPPETTO.ComponentFactory.addExistingComponent(this.state.componentType, this);
                    this.connectToPython(this.state.componentType, nextProps.model);
                }

                componentDidUpdate(prevProps, prevState) {
                    if (this.state.value != prevState.value && this.props.onChange) {
                        this.props.onChange(null, null, this.state.value);
                    }
                }

                updatePythonValue(newValue) {
                    this.setState({ value: newValue, searchText: newValue, checked: newValue });
                    if (this.syncValueWithPython) {
                        this.syncValueWithPython(newValue, window.requirement);
                    }

                    this.forceUpdate();
                }


                // Default handle (mainly textfields and dropdowns)
                handleChange(event, index, value) {
                    var targetValue = value;
                    if (event != null && event.target.value != undefined) {
                        targetValue = event.target.value;
                    }
                    this.setState({ value: targetValue });
                    this.updatePythonValue(targetValue);
                }


                compareArrays(array1, array2) {
                    // if the other array is a falsy value, return
                    if (!array1 || !array2)
                        return false;

                    // compare lengths - can save a lot of time 
                    if (array1.length != array2.length)
                        return false;

                    for (var i = 0, l = array1.length; i < l; i++) {
                        // Check if we have nested arrays
                        if (array1[i] instanceof Array && array2[i] instanceof Array) {
                            // recurse into the nested arrays
                            if (!array1[i].equals(array2[i]))
                                return false;
                        }
                        else if (array1[i] != array2[i]) {
                            // Warning - two different object instances will never be equal: {x:20} != {x:20}
                            return false;
                        }
                    }
                    return true;
                }

                callPythonMethod = (value) => {
                    Utils.sendPythonMessage(this.props.method, []).then((response) => {
                        if (Object.keys(response).length != 0) {
                            this.setState({ pythonData: response });
                        }
                    });
                }

                componentDidUpdate(prevProps, prevState) {
                    if (!this.compareArrays(this.state.value, prevState.value)) {
                        if ($.isArray(this.state.value)) {
                            for (var v in this.state.value) {
                                if (this.state.pythonData.indexOf(this.state.value[v]) < 0) {
                                    var newValue = [this.state.value[v]];
                                    this.setState({ pythonData: this.state.pythonData.concat(newValue) });
                                }
                            }
                        }
                    }
                }

                shouldComponentUpdate(nextProps, nextState) {
                    return !this.compareArrays(this.state.pythonData, nextState.pythonData) || !this.compareArrays(this.state.value, nextState.value);
                }

                render() {
                    const wrappedComponentProps = Object.assign({}, this.props);
                    if (wrappedComponentProps.key == undefined) {
                        wrappedComponentProps.key = wrappedComponentProps.model;
                    }
                    if (wrappedComponentProps.id == undefined) {
                        wrappedComponentProps.id = wrappedComponentProps.model;
                    }
                    wrappedComponentProps['onChange'] = this.handleChange;
                    wrappedComponentProps['value'] = this.state.value;
                    delete wrappedComponentProps.model;
                    delete wrappedComponentProps.postProcessItems;
                    delete wrappedComponentProps.validate;
                    delete wrappedComponentProps.prePythonSyncProcessing;
                    
                    if (this.props.postProcessItems) {
                        var items = this.props.postProcessItems(this.state.pythonData, this.state.value);
                    }
                    return (
                        <WrappedComponent {...wrappedComponentProps}>
                            {items}
                        </WrappedComponent>
                    );
                }

            };

            return PythonControlledControlWithPythonDataFetch;
        },
    }
})
