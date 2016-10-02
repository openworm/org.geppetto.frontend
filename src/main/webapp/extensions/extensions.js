require(['json!../extensions/extensionsConfiguration.json', 'geppetto'], function(extensionConfiguration, GEPPETTO) {

	//Require your extension in extensionConfiguration.json
	for (var extension in extensionConfiguration){
		if (extensionConfiguration[extension]){
			require(['../extensions/' + extension], function(componentsInitialization){
				componentsInitialization(GEPPETTO);
			});
		}
	}
});