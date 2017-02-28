/**
 * @class The Geppetto admin console
 */
define(function(require) {

	window.$ = require('jquery');
	var React = require('react');
	var ReactDOM = require('react-dom');		
	var adminPanel = React.createFactory(require('./components/adminPanel/AdminPanel'));

	var height = window.innerHeight - 100;

	ReactDOM.render(React.createFactory(adminPanel)({height : height}), document.getElementById('adminPanel'));
});
