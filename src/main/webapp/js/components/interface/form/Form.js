define(function (require) {

    require('./Form.less')

	var React = require('react');
	var reactJsonSchemaForm = require('react-jsonschema-form');

	var Form = reactJsonSchemaForm.default;

	var uiSchema ={};

	var formComponent = React.createClass({

		shouldComponentUpdate() {
			return false;
		},

		componentDidMount(){
			$("#"+this.props.id).parent().addClass("formDialog");
		},

		render: function(){
			return (
					<Form id={this.props.id}
					className="geppettoForm"
						schema={this.props.schema}
					formData={this.props.formData}
			                uiSchema={this.props.uiSchema ? this.props.uiSchema : uiSchema}
					onChange={this.props.changeHandler}
					onSubmit={this.props.submitHandler}
					onError={this.props.errorHandler} />
			);
		}
	});

	return formComponent;
});
