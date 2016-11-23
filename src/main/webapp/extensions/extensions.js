define(['./extensionsConfiguration.json', 'geppetto','../js/components/ComponentFactory'],function(extensionConfiguration, GEPPETTO) {
	//Load extension depending on extension path and init componentsInitialization.
	//Note this needs to be an independent function due to require async nature 
	function loadExtension(extensionPath){
		require(['../extensions/' + extensionPath], function(componentsInitialization){
			componentsInitialization(GEPPETTO);
		});
	}

	//Require your extension in extensionConfiguration.json
	for (var extension in extensionConfiguration){
		if (extensionConfiguration[extension]){
			loadExtension(extension);
		}
	}
});