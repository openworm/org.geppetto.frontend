define(function(require) {

	return function (GEPPETTO) {
		
		//Require your extension here
		//require('./geppetto-default/ComponentsInitialization')(GEPPETTO);
		require('./geppetto-osb/ComponentsInitialization')(GEPPETTO);
		//require('./geppetto-vfb/ComponentsInitialization')(GEPPETTO);

		
	};

});