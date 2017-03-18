
define(function (require) {
    return function (GEPPETTO) {

        var commandsProviders = {};

        /**
         * @class GEPPETTO.MenuManager
         */
        GEPPETTO.MenuManager = {

            resetMap: function () {
                commandsProviders = {};
            },
            registerNewCommandProvider: function (nodeTypes, handler) {
                for (var nodeTypeKey in nodeTypes) {
                    nodeType = nodeTypes[nodeTypeKey];
                    commandsItem = [];
                    if (nodeType in commandsProviders) {
                        commandsItem = commandsProviders[nodeType];
                    }
                    commandsItem.push(handler);
                    commandsProviders[nodeType] = commandsItem;
                }
            },


            getCommandsProvidersFor: function (nodeType) {
                var commandsProvidersForNodeType = [];
                if (nodeType in commandsProviders) {
                    commandsProvidersForNodeType = commandsProviders[nodeType];
                }
                return commandsProvidersForNodeType;
            }


        };
    };
});