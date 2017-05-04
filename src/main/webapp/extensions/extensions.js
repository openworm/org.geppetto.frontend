define(['./extensionsConfiguration.json', 'geppetto','../js/components/ComponentFactory'],function(extensionConfiguration, GEPPETTO) {
	//Load extension depending on extension path and init componentsInitialization.
	//Note this needs to be an independent function due to require async nature 
	function loadExtension(extensionPath){
		require(['../extensions/' + extensionPath], function(componentsInitialization){
			componentsInitialization(GEPPETTO);
		});
	}

	//Require your extension in extensionConfiguration.json
	var availableExtensions = [];
	for (var extension in extensionConfiguration){
		if (extensionConfiguration[extension]){
			availableExtensions.push(extension.split("/")[0]);
			loadExtension(extension);
		}
	}
	
    var paths = GEPPETTO.Utility.getPathStringParameters();
    for (var pathIndex in paths){
    	for (var availableExtensionIndex in availableExtensions){
    		try {
		    	require(['../extensions/' + availableExtensions[availableExtensionIndex] + "/" + paths[pathIndex] + "/" + paths[pathIndex]], function(componentsInitialization){
					componentsInitialization(GEPPETTO);
				});
    		}
    		catch( e ) {
    			console.log('Components Initialization ' + paths[pathIndex] + ' can not be found in extension ' + availableExtensions[availableExtensionIndex]);
    		}
    	}
    }
    
});