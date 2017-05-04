define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/interface/form/Form.css";
    document.getElementsByTagName("head")[0].appendChild(link);
	
	var React = require('react');
	var reactJsonSchemaForm = require('./react-jsonschema-form');
	
	var Form = reactJsonSchemaForm.default;

	var uiSchema ={};
	
	var formComponent = React.createClass({

		shouldComponentUpdate() {
			return false;
		},

		render: function(){
		     return (
		    		 <Form id={this.props.id} 
		    		 	className="geppettoForm"
		    		 	schema={this.props.schema}
		    		    formData={this.props.formData}
		    		 	uiSchema={uiSchema}
		    		 	onChange={this.props.changeHandler}
		    		    onSubmit={this.props.submitHandler}
		    		    onError={this.props.errorHandler} />
		     		);
		 	}
		});
	
	return formComponent;
});