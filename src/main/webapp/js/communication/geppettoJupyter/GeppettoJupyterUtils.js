define(function (require, exports, module) {
    
    function sendPythonMessage(command, parameters) {
        var parametersString = "";
        if(parameters){
            if(parameters.length>0){
                // parametersString = parameters.reduce((acc, p) => acc = acc == "(" ? acc + processParameter(p) : acc + "," + processParameter(p), "(") + ")";
                parametersString = "(" + parameters.map( parameter => "jsonapi.loads('" + JSON.stringify(parameter) + "')").join(",") + ")";
            }
            else{
                parametersString = '()';
            }
        }
        return this.execPythonCommand(command + parametersString, handle_output);

    };

    function handle_output(data) {
        //data is the object passed to the callback from the kernel execution
        switch (data.msg_type) {
            case 'error':
                GEPPETTO.CommandController.log("ERROR while executing a Python command:");
                GEPPETTO.CommandController.log(data.content.evalue.trim());
                console.log(data.content.evalue);
                GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
                break;
            case 'execute_result':
                GEPPETTO.CommandController.log(data.content.data['text/plain'].trim(), true);
                //FIXME Couldnt find a method to avoid this string manipulation.
                //content = content.replace("b'","'");
                //if(content.startsWith("'") && content.endsWith("'")){
                    //  content=content.substr(1, content.length-1)
                    //}
                    //content = content.replace(/\\n/g, ' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'');
                    //GEPPETTO.trigger(GEPPETTO.Events.Receive_Python_Message, { id: data.parent_header.msg_id, type: data.msg_type, response: content });
                    
                let content = data.content.data['text/plain'];
                execPythonCommand('jsonapi.dumps(json_clean(' + content + ')).decode("utf-8")', handle_output2).then((response) => {
                    console.log(response)
                    GEPPETTO.trigger(GEPPETTO.Events.Receive_Python_Message, { id: data.parent_header.msg_id, type: data.msg_type, response: response });
                });

                break;
            case "display_data":
                GEPPETTO.trigger(GEPPETTO.Events.Receive_Python_Message, { id: data.parent_header.msg_id, type: data.msg_type, response: data.content.data['image/png'] });
                break;
            default:
                GEPPETTO.CommandController.log(data.content.text.trim(), true);
        }
    };

    function handle_output2(data) {
        //data is the object passed to the callback from the kernel execution
        switch (data.msg_type) {
            case 'error':
                GEPPETTO.CommandController.log("ERROR while serializing a Python command output:");
                GEPPETTO.CommandController.log(data.content.evalue.trim());
                GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
                break;
            case 'execute_result':
            try {
                var response = JSON.parse(data.content.data['text/plain'].replace(/^'(.*)'$/, '$1'));
            } catch (error) {
                var response = data.content.data['text/plain'].replace(/^'(.*)'$/, '$1');
            }
                GEPPETTO.trigger(GEPPETTO.Events.Receive_Python_Message, { id: data.parent_header.msg_id, type: data.msg_type, response: response });
                break;
            default:
                GEPPETTO.CommandController.log(data.content.text.trim(), true);
        }
    }

    function execPythonCommand(command, callback) {
        GEPPETTO.CommandController.log('Executing Python command: ' + command, true);
        var kernel = IPython.notebook.kernel;
        var messageID = kernel.execute(command, { iopub: { output: callback } }, { silent: false, stop_on_error: true, store_history: true });

        return new Promise((resolve, reject) =>
            GEPPETTO.on(GEPPETTO.Events.Receive_Python_Message, function (data) {
                if (data.id == messageID) {
                    resolve(data.response);
                }
            })
        );
    };

    return {
        execPythonCommand: execPythonCommand,
        sendPythonMessage: sendPythonMessage
    };

})