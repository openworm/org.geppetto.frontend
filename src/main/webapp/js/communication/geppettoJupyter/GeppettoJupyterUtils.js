define(function (require, exports, module) {

    var geppettoCommonLibrary = require('./GeppettoCommonLibrary.json');

    function getTypeById(typeId) {
        for (var typeIndex in geppettoCommonLibrary.types) {
            if (geppettoCommonLibrary.types[typeIndex].id == typeId) {
                return "types." + typeIndex;
            }
        }
    }

    function getGeppettoCommonLibrary() {
        return geppettoCommonLibrary;
    }

    function sendPythonMessage(command, parameters) {
        var parametersString = "";
        if(parameters && parameters.length>0){
            parametersString = parameters.reduce((acc, p) => acc = acc == "(" ? acc + JSON.stringify(p) : acc + "," + JSON.stringify(p), "(") + ")";
        }
        return this.execPythonCommand(command + parametersString);
    };

    function handle_output(data) {
        //data is the object passed to the callback from the kernel execution
        switch (data.msg_type) {
            case 'error':
                GEPPETTO.CommandController.log("ERROR while executing a Python command:");
                GEPPETTO.CommandController.log(data.content.evalue.trim());
                break;
            case 'execute_result':
                GEPPETTO.CommandController.log(data.content.data['text/plain'].trim(), true);
                GEPPETTO.trigger(GEPPETTO.Events.Receive_Python_Message, { id: data.parent_header.msg_id, type: data.msg_type, response: data.content.data['text/plain'] });
                break;
            default:
                GEPPETTO.CommandController.log(data.content.text.trim(), true);
        }
    };


    function execPythonCommand(command) {
        GEPPETTO.CommandController.log('Executing Python command: ' + command, true);
        var kernel = IPython.notebook.kernel;
        var messageID = kernel.execute(command, { iopub: { output: handle_output } }, { silent: false, stop_on_error: true, store_history: true });

        return new Promise((resolve, reject) =>
            GEPPETTO.on(GEPPETTO.Events.Receive_Python_Message, function (data) {
                if (data.id == messageID) {
                    resolve(data.response);
                }
            })
        );
    };

    return {
        getGeppettoCommonLibrary: getGeppettoCommonLibrary,
        getTypeById: getTypeById,
        execPythonCommand: execPythonCommand,
        sendPythonMessage: sendPythonMessage
    };

})