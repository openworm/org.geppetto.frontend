define(function (require, exports, module) {

	var React = require('react');
	var AbstractComponent = require('../AComponent');


	return class TextField extends AbstractComponent {

		constructor(props) {
			super(props);
			this.state = {
				value: this.props.sync_value,
				handleChange: this.handleChange.bind(this),
				handleBlur: this.handleBlur.bind(this)
			}

			this.handleChange = this.handleChange.bind(this);
			this.handleBlur = this.handleBlur.bind(this);
		}
		// getInitialState: function () {
		// 	return { value: this.props.sync_value };
		// },
		handleChange(event) {
			this.setState({ value: event.target.value });
			this.state.handleChange(event.target.value);
		}
		handleBlur(event) {
			//this.setState({value: event.target.value});
			this.state.handleBlur(event.target.value);
		}
		componentWillReceiveProps(nextProps) {
			this.setState({
				value: nextProps.sync_value
			});
		}
		sync() {
			var kernel = IPython.notebook.kernel;
			kernel.execute('from jupyter_geppetto.geppetto_comm import GeppettoJupyterGUISync');
			kernel.execute('tf = GeppettoJupyterGUISync.TextFieldSync(path="' + this.props.path + '",value="' + this.props.value + '")');
			kernel.execute('tf.sync()');
		}

		componentDidMount() {
			if (!('TEXTFIELD' in GEPPETTO.ComponentFactory.componentsMap)) {
				GEPPETTO.ComponentFactory.componentsMap['TEXTFIELD'] = []
			}
			GEPPETTO.ComponentFactory.componentsMap['TEXTFIELD'].push(this);


			this.sync();
		}

		render() {
			var readOnly = this.props.readOnly === true;
			return (
				<input readOnly={readOnly} type="text" id={this.props.id} value={this.state.value} onChange={this.handleChange} onBlur={this.handleBlur} />
			);
		}
	};


});
