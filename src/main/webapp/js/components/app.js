/**
 * @class components/app
 */
define(function(require) {

	var GEPPETTO = require('geppetto');
	
	require('./ComponentFactory')(GEPPETTO);
	require('./ComponentsController')(GEPPETTO);

	GEPPETTO.ComponentFactory.loadSpinner();

	//load extensions
	require('../../extensions/extensions');

});
