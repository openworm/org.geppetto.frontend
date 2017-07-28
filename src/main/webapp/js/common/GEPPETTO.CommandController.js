/**
 * Controls execution and propagation of commands and command related logic
 *
 */
define(function (require) {
    return function (GEPPETTO) {
        GEPPETTO.CommandController = {
            aProperty: undefined,

            // Set of commands being inherited from Backbone ojects, ignored them while displaying autocomplete commands
            nonCommands: ["constructor()", "constructor(options)", "initialize(options)", "on(t,e,i)", "once(t,e,r)", "off(t,e,r)", "trigger(t)", "stopListening(t,e,r)", "listenTo(e,r,s)",
                "listenToOnce(e,r,s)", "bind(t,e,i)", "unbind(t,e,r)", "$(t)", "initialize()", "remove()", "setElement(t,i)", "delegateEvents(t)",
                "undelegateEvents()", "_ensureElement()", "constructor(a,c)", "on(a,c,d)", "off(a,c,d)", "get(a)", "set(a,c,d)", "_set(a,c)",
                "_setAttr(c={})", "_bubbleEvent(a,c,d)", "_isEventAvailable(a,c)", "_setupParents(a,c)", "_createCollection(a,c)", "_processPendingEvents()",
                "_transformRelatedModel(a,c)", "_transformCollectionType(a,c,d)", "trigger(a)", "toJSON(a)", "clone(a)", "cleanup(a)", "render()", "getState(tree,state)",
                "destroy(a)", "_getAttr(a)", "on(t,e,i)", "once(t,e,r)", "off(t,e,r)", "trigger(t)", "stopListening(t,e,r)", "listenTo(e,r,s)", "listenToOnce(e,r,s)",
                "bind(t,e,i)", "unbind(t,e,r)", "initialize()", "toJSON(t)", "sync()", "get(t)", "escape(t)", "has(t)", "set(t,e,r)",
                "unset(t,e)", "clear(t)", "hasChanged(t)", "changedAttributes(t)", "previous(t)", "previousAttributes()", "fetch(t)", "save(t,e,r)", "destroy(t)",
                "url()", "parse(t,e)", "clone()", "isNew()", "isValid(t)", "_validate(t,e)", "keys()", "values()", "pairs()", "invert()", "pick()", "omit()",
                "selectChildren(entity,apply)", "showChildren(entity,mode)", "getZoomPaths(entity)", "getAspectsPaths(entity)", "toggleUnSelected(entities,mode)",
                "addOnNodeUpdatedCallback(varnode,callback)", "traverseSelection(entities)", "clearOnNodeUpdateCallback(varnode)", "updateDataSet()",
                "showAllVisualGroupElements(visualizationTree,elements,mode)", "_all(predicate,matches)"],

            /**
             * Gets commands to exclude from autocomplete
             */
            getNonCommands()
            {
                return this.nonCommands;
            },

            executeCommand: function () {
                // TODO: eval
                // TODO: raise event command_executed passing command as argument
            },

            createCommandTags: function () {
                // TODO: raise event create_command_tags passing arguments
            },

            updateCommandTags: function () {
                // TODO: raise event update_command_tags passing arguments
            }
        }
    };
});
