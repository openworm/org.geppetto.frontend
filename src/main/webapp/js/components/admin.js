/**
 * @class components/admin
 */
define(function(require) {

	var $ = require('jquery');

	var React = require('react');
	var ReactDOM = require('react-dom');		
	var adminPanel = React.createFactory(require('jsx!./dev/adminPanel/AdminPanel'));

	var height = window.innerHeight;

	ReactDOM.render(React.createFactory(adminPanel)(), document.getElementById('adminPanel'));
});
