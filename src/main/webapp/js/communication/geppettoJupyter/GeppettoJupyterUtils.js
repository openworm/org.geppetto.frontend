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

    function handle_output(data){
        //data is the object passed to the callback from the kernel execution
        if (data.msg_type == "error"){
            GEPPETTO.CommandController.log("Error while executing a Python command:");
            GEPPETTO.CommandController.log(JSON.stringify(data));
        }
        GEPPETTO.CommandController.log("Python command returned without errors:", true);
        GEPPETTO.CommandController.log(JSON.stringify(data), true);
    };
    
    function execPythonCommand(command) {
        GEPPETTO.CommandController.log('Executing Python command: '+ command, true);
        var kernel = IPython.notebook.kernel;
        kernel.execute(command, {iopub : {output : handle_output}});
    };


    return {

		getGeppettoCommonLibrary: getGeppettoCommonLibrary,
        getTypeById: getTypeById,
        execPythonCommand: execPythonCommand,
        sendPythonMessage: sendPythonMessage
	};

})