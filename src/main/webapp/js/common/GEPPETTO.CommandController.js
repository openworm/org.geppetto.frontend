/**
 * Controls execution and propagation of commands and command related logic
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
        GEPPETTO.CommandController = {
            aProperty: undefined,

            executeCommand: function(){
                // TODO: eval
                // TODO: raise event command_executed passing command as argument
            },

            createCommandTags: function(){
                // TODO: raise event create_command_tags passing arguments
            },

            updateCommandTags: function(){
                // TODO: raise event update_command_tags passing arguments
            }
        };
    };
});
