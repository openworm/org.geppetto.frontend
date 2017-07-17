define(function(require, exports, module) {

	var React = require('react');

    var Checkbox = React.createClass({
    	  getInitialState: function () {
    		    return {
    		        value: (this.props.sync_value == 'true')
    		     };
    		  },
    	  handleChange: function(event) {
    		  this.setState({value: event.target.checked});
    	      this.props.handleChange(event.target.value);
    	  },
    	  componentWillReceiveProps: function(nextProps) {
    		  this.setState({
    			  value: (nextProps.sync_value == 'true')
    		  });
    		},

        render: function(){
            return (
            		<p className={"checkboxContainer"}>
            		<input type="checkbox" id={this.props.id} checked={this.state.value} onChange={this.handleChange}/>
            		<label htmlFor={this.props.id}/>
            		</p>
    		);
        }
    });

    return Checkbox;
});
