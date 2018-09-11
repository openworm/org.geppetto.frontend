define(function (require, exports, module) {

    var geppettoCommonLibrary = require('./GeppettoCommonLibrary.json');

    function getTypeById(typeId){
        for (var typeIndex in geppettoCommonLibrary.types){
            if (geppettoCommonLibrary.types[typeIndex].id == typeId){
                return "types." + typeIndex;
            }
        }
    }

    function getGeppettoCommonLibrary(){
        return geppettoCommonLibrary;
    }

    function sendPythonMessage(command, parameters) {
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        var messageID = '_' + Math.random().toString(36).substr(2, 9);
        GEPPETTO.trigger(GEPPETTO.Events.Send_Python_Message, { id: messageID, command: command, parameters: parameters });

        return new Promise((resolve, reject) =>
            GEPPETTO.on(GEPPETTO.Events.Receive_Python_Message, function (data) {
                if (data.id == messageID) {
                    resolve(data.response);
                }

            })
        );
    };

    function execPythonCommand(command) {
        console.log('Executing command', command);
        var kernel = IPython.notebook.kernel;
        kernel.execute(command);
    };


    return {

		getGeppettoCommonLibrary: getGeppettoCommonLibrary,
        getTypeById: getTypeById,
        execPythonCommand: execPythonCommand,
        sendPythonMessage: sendPythonMessage
	};

})