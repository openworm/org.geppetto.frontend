

/**
 * Factory class with model creation methods.
 *
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    return function (GEPPETTO) {
        var GeppettoModel = require('./model/GeppettoModel');
        var Library = require('./model/Library');
        var Type = require('./model/Type');
        var Variable = require('./model/Variable');
        var Value = require('./model/Value');
        var Datasource = require('./model/Datasource');
        var Query = require('./model/Query');
        var CompositeType = require('./model/CompositeType');
        var CompositeVisualType = require('./model/CompositeVisualType');
        var ArrayType = require('./model/ArrayType');
        var ImportType = require('./model/ImportType');
        var ImportValue = require('./model/ImportValue');
        var Instance = require('./model/Instance');
        var ExternalInstance = require('./model/ExternalInstance');
        var ArrayInstance = require('./model/ArrayInstance');
        var ArrayElementInstance = require('./model/ArrayElementInstance');
        var VisualGroup = require('./model/VisualGroup');
        var VisualGroupElement = require('./model/VisualGroupElement');
        var Pointer = require('./model/Pointer');
        var PointerElement = require('./model/PointerElement');
        var AVisualCapability = require('./capabilities/AVisualCapability');
        var AVisualGroupCapability = require('./capabilities/AVisualGroupCapability');
        var AConnectionCapability = require('./capabilities/AConnectionCapability');
        var AParameterCapability = require('./capabilities/AParameterCapability');
        var AParticlesCapability = require('./capabilities/AParticlesCapability');
        var AStateVariableCapability = require('./capabilities/AStateVariableCapability');
        var ADerivedStateVariableCapability = require('./capabilities/ADerivedStateVariableCapability');
       
        /**
         * @class GEPPETTO.ModelFactory
         */
        GEPPETTO.ModelFactory =
        {
            /*
             * Variables to keep track of tree building state go here if needed
             */
            rawGeppetoModel: null,
            geppettoModel: null,
            instances: null,
            allPaths: [],
            allStaticVarsPaths: {},
            allPathsIndexing: [],
            newPathsIndexing: [],
            instanceTags: {},

            /**
             * Creates and populates Geppetto model
             *
             * @param jsonModel
             * @param storeRaw - store the raw and object models in the model factory
             * @param populateRefs - populate type references after model creation
             *
             * @returns {GeppettoModel}
             */
            createGeppettoModel: function (jsonModel, storeModel, populateRefs) {
                // set defaults for optional flags
                if (storeModel == undefined) {
                    // default behaviour store model
                    storeModel = true;
                }
                if (populateRefs == undefined) {
                    // default behaviour populate type references
                    populateRefs = true;
                }

                var geppettoModel = null;

                if (jsonModel.eClass == 'GeppettoModel') {
                    if (storeModel) {
                        // store raw model for easy access during model building operations
                        this.rawGeppetoModel = jsonModel;
                    }

                    geppettoModel = this.createModel(jsonModel);

                    if (storeModel) {
                        // store raw model for easy access during model building operations
                        this.rawGeppetoModel = jsonModel;
                        // store object model
                        this.geppettoModel = geppettoModel;
                    }

                    // create variables
                    geppettoModel.variables = this.createVariables(jsonModel.variables, geppettoModel);

                    // create libraries
                    for (var i = 0; i < jsonModel.libraries.length; i++) {
                        if (!jsonModel.libraries[i].synched) {
                            var library = this.createLibrary(jsonModel.libraries[i]);
                            library.parent = geppettoModel;
                            library.setTypes(this.createTypes(jsonModel.libraries[i].types, library));
                            geppettoModel.getLibraries().push(library);
                        }
                    }

                    // create datasources
                    geppettoModel.datasources = this.createDatasources(jsonModel.dataSources, geppettoModel);

                    // create top level queries (potentially cross-datasource)
                    geppettoModel.queries = this.createQueries(jsonModel.queries, geppettoModel);

                    if (populateRefs) {
                        // traverse everything and build shortcuts to children if composite --> containment == true
                        this.populateChildrenShortcuts(geppettoModel);

                        // traverse everything and populate type references in variables
                        this.populateTypeReferences(geppettoModel);
                    }
                }

                return geppettoModel;
            },

            /**
             * Populate shortcuts of children onto parents
             */
            populateChildrenShortcuts: function (node) {
                // check if getChildren exists, if so add shortcuts based on ids and recurse on each
                if (typeof node.getChildren === "function") {
                    var children = node.getChildren();

                    if (children != undefined) {
                        for (var i = 0; i < children.length; i++) {
                            // do not populate shortcuts for array instances - children are accessed as array elements
                        	if(node instanceof Variable && children[i] instanceof Type){
                        		//it's an anonymous type we don't want it to be in the path
                        		this.populateChildrenShortcuts(children[i]);
                        		
                        		var grandChildren = children[i].getChildren();
                        		for (var j = 0; j < grandChildren.length; j++) {
                        			node[grandChildren[j].getId()] = grandChildren[j];	
                        		}
                        		
                        		continue;
                        	}
                            if (node.getMetaType() != GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                                node[children[i].getId()] = children[i];
                            }

                            this.populateChildrenShortcuts(children[i]);
                        }
                    }
                }
            },

            /**
             * Populate type references
             */
            populateTypeReferences: function (node) {

                // check if variable, if so populate type references
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    var types = node.getTypes();
                    var referencedTypes = [];
                    var hasPointerType = false;
                    var swapTypes = true;

                    if (types != undefined) {
                        for (var i = 0; i < types.length; i++) {
                            // check if references are already populated
                            if (types[i] instanceof Type) {
                                swapTypes = false;
                                break;
                            }

                            // get reference string - looks like this --> '//@libraries.1/@types.5';
                            var refStr = types[i].$ref;

                            //if it's anonymous there's no reference
                            if (refStr != undefined) {
                                // go grab correct type from Geppetto Model
                                var typeObj = this.resolve(refStr);

                                // track if we have pointer type
                                if (typeObj.getMetaType() == GEPPETTO.Resources.POINTER_TYPE) {
                                    hasPointerType = true;
                                }

                                // add to list
                                referencedTypes.push(typeObj);
                            }
                        }

                        if (swapTypes) {
                            // set types to actual object references using backbone setter
                            node.setTypes(referencedTypes);
                        }
                    }

                    // check if pointer type
                    if (hasPointerType) {
                        var initialValues = node.getInitialValues();

                        if (initialValues != undefined && initialValues.length == 1) {
                            // go to initial values and parse pointer into Pointer with its PointerElements
                            var val = initialValues[0];
                            var pointer = this.createPointer(val.value);
                            // populate pointerValue on variable
                            node.pointerValue = pointer;
                        } else {
                            throw( "The variable " + node.getId() + " does not have initial values. Initial values expected." );
                        }
                    }

                    // add capabilities to variables
                    var resolvedTypes = node.getTypes();
                    for (var j = 0; j < resolvedTypes.length; j++) {
                        if (resolvedTypes[j].getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                            // if a variable has a Parameter type, add AParameterCapability to the variable
                            node.extendApi(AParameterCapability);
                        } else if (resolvedTypes[j].getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                            // if a variable has a connection type, add connection capability
                            node.extendApi(AConnectionCapability);
                            this.resolveConnectionValues(node);
                        }
                    }
                } else if (!(node instanceof ArrayType) && (node instanceof Type || node instanceof CompositeType)) {
                    // take visual type string - looks like this --> '//@libraries.1/@types.5'
                    var vizType = node.getVisualType();

                    if (vizType != undefined) {
                        // replace with reference to actual type
                        var typeObj = this.resolve(vizType.$ref);
                        node.visualType = typeObj;
                    }

                    // resolve super type
                    var superType = node.getSuperType();
                    if (superType != undefined) {
                        var typeObjs = [];

                        // convert to array if single element
                        if (!(superType instanceof Array)) {
                            superType = [superType];
                        }

                        for (var a = 0; a < superType.length; a++) {
                            if (superType[a].$ref) {
                                // replace with reference to actual type
                                typeObjs.push(this.resolve(superType[a].$ref));
                            }
                            else {
                                // replace with reference to actual type
                                typeObjs.push(superType[a]);
                            }
                        }

                        node.superType = typeObjs;
                    }
                } else if (node instanceof ArrayType) {
                    // take array type string - looks like this --> '//@libraries.1/@types.5'
                    var arrayType = node.getType();

                    if (arrayType != undefined) {
                        var typeObj = this.resolve(arrayType.$ref);
                        node.type = typeObj;
                    }

                    // resolve super type
                    var superType = node.getSuperType();
                    if (superType != undefined) {
                        var typeObjs = [];

                        // convert to array if single element
                        if (!(superType instanceof Array)) {
                            superType = [superType];
                        }

                        for (var a = 0; a < superType.length; a++) {
                            if (superType[a].$ref) {
                                // replace with reference to actual type
                                typeObjs.push(this.resolve(superType[a].$ref));
                            }
                            else {
                                // replace with reference to actual type
                                typeObjs.push(superType[a]);
                            }
                        }

                        node.superType = typeObjs;
                    }
                }

                // check if getChildren exists, if so recurse over children
                if (typeof node.getChildren === "function") {
                    var children = node.getChildren();

                    if (children != undefined) {
                        for (var i = 0; i < children.length; i++) {
                            this.populateTypeReferences(children[i]);
                        }
                    }
                }
            },

            /**
             * Creates pointer given a pointer in raw json format
             */
            createPointer: function (jsonPointer) {

                // get raw pointer elements
                var rawElements = jsonPointer.elements;
                var pointerElements = [];

                // loop elements and create PointerElements (resolving variables / types)
                for (var i = 0; i < rawElements.length; i++) {
                    var element = this.createPointerElement(rawElements[i]);
                    pointerElements.push(element);
                }

                // create pointer object setting elements
                var pointer = new Pointer({"wrappedObj": jsonPointer, "elements": pointerElements});

                return pointer;
            },

            /**
             * Creates pointer given a pointer in raw json format
             */
            createPointerElement: function (jsonPointerElement) {
                var variable = this.resolve(jsonPointerElement.variable.$ref);
                var type = this.resolve(jsonPointerElement.type.$ref);
                var index = jsonPointerElement.index;

                // create pointer object setting elements
                var pointerElement = new PointerElement({
                    "wrappedObj": jsonPointerElement,
                    "variable": variable,
                    "type": type,
                    "index": index
                });

                return pointerElement;
            },

            /**
             * Creates datasources starting from an array of datasources in the json model format
             */
            createDatasources: function (jsonDataSources, parent) {
                var dataSources = [];

                if (jsonDataSources != undefined) {
                    for (var i = 0; i < jsonDataSources.length; i++) {
                        var ds = this.createDatasource(jsonDataSources[i]);
                        ds.parent = parent;

                        dataSources.push(ds);
                    }
                }

                return dataSources;
            },

            /**
             * Creates variables starting from an array of variables in the json model format
             */
            createVariables: function (jsonVariables, parent) {
                var variables = [];

                if (jsonVariables != undefined) {
                    for (var i = 0; i < jsonVariables.length; i++) {
                        if (!jsonVariables[i].synched) {
                            var variable = this.createVariable(jsonVariables[i]);
                            variable.parent = parent;

                            // check if it has an anonymous type
                            if (jsonVariables[i].anonymousTypes != undefined) {
                                variable.anonymousTypes = this.createTypes(jsonVariables[i].anonymousTypes, variable);
                            }

                            variables.push(variable);
                        }
                    }
                }

                return variables;
            },

            /**
             * Creates type objects starting from an array of types in the json model format
             */
            createTypes: function (jsonTypes, parent) {
                var types = [];

                if (jsonTypes != undefined) {
                    for (var i = 0; i < jsonTypes.length; i++) {
                        if (!jsonTypes[i].synched) {
                            var type = null;

                            // check if it's composite type, visual type, array type or simple type
                            if (jsonTypes[i].eClass == 'CompositeType' || jsonTypes[i].eClass == 'ConnectionType') {
                                type = this.createCompositeType(jsonTypes[i]);
                            }
                            else if (jsonTypes[i].eClass == 'CompositeVisualType') {
                                type = this.createCompositeVisualType(jsonTypes[i]);
                                // inject visual capability to all CompositeVisualType
                                type.extendApi(AVisualCapability);
                            }
                            else if (jsonTypes[i].eClass == 'ImportType') {
                                type = this.createImportType(jsonTypes[i], null);
                                //we store the index of the importType to speed up swapping procedures
                                type._index = i;
                            }
                            else if (jsonTypes[i].eClass == 'ArrayType') {
                                type = this.createArrayType(jsonTypes[i]);
                            }
                            else {
                                type = this.createType(jsonTypes[i]);
                                // inject visual capability if MetaType == VisualType
                                if (type.getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE) {
                                    type.extendApi(AVisualCapability);
                                }
                            }

                            // if getVisualType != null also inject visual capability
                            if (type.getVisualType() != undefined) {
                                type.extendApi(AVisualCapability);
                            }

                            // set parent
                            type.parent = parent;

                            types.push(type);
                            GEPPETTO.CommandController.createTags(type.getPath(), GEPPETTO.Utility.extractMethodsFromObject(type, true));
                        }
                    }
                }

                return types;
            },

            /**
             * Creates and populates initial instance tree skeleton with any instance that needs to be visualized
             */
            createInstances: function (geppettoModel) {

                var instances = [];

                // pre-populate instance tags for console suggestions
                this.populateInstanceTags();

                // we need to explode instances for variables with visual types
                var varsWithVizTypes = [];

                // we need to fetch all potential instance paths (even for not exploded instances)
                var allPotentialInstancePaths = [];
                var allPotentialInstancePathsForIndexing = [];

                // builds list of vars with visual types and connection types - start traversing from top level variables
                var vars = geppettoModel.getVariables();
                for (var i = 0; i < vars.length; i++) {
                    this.fetchVarsWithVisualTypes(vars[i], varsWithVizTypes, '');
                    this.fetchAllPotentialInstancePaths(vars[i], allPotentialInstancePaths, allPotentialInstancePathsForIndexing, '');
                }

                this.allPaths = allPotentialInstancePaths;
                this.allPathsIndexing = allPotentialInstancePathsForIndexing;
                var varsToInstantiate = varsWithVizTypes;

                // based on list, traverse again and build instance objects
                for (var j = 0; j < varsToInstantiate.length; j++) {
                    this.buildInstanceHierarchy(varsToInstantiate[j], null, geppettoModel, instances);
                }

                // set instances to internal cache of the factory
                this.instances = instances;

                // populate shortcuts / populate connection references
                for (var k = 0; k < instances.length; k++) {
                    this.populateChildrenShortcuts(instances[k]);
                    this.populateConnections(instances[k]);
                }

                return instances;
            },

            /**
             * Checks if new instances need to be created
             *
             * @param diffReport - lists variables and types that we need to check instances for
             */
            createInstancesFromDiffReport: function (diffReport) {
                // get initial instance count (used to figure out if we added instances at the end)
                var instanceCount = this.getInstanceCount(window.Instances);

                var newInstancePaths = [];

                // shortcut function to get potential instance paths given a set types
                // NOTE: defined as a nested function to avoid polluting the visible API of ModelFactory
                var that = this;
                var getPotentialInstancePaths = function (types) {
                    var paths = [];

                    for (var l = 0; l < types.length; l++) {
                        if (types[l].hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                            // get potential instances with that type
                            paths = paths.concat(that.getAllPotentialInstancesOfType(types[l].getPath()));
                        }
                    }

                    return paths;
                };

                // STEP 1: check new variables to see if any new instances are needed
                var varsWithVizTypes = [];
                for (var i = 0; i < diffReport.variables; i++) {
                    GEPPETTO.ModelFactory.fetchVarsWithVisualTypes(diffReport.variables[i], varsWithVizTypes, '');
                }
                // for each variable, get types and potential instances of those types
                for (var j = 0; j < varsWithVizTypes.length; j++) {
                    // var must exist since we just fetched it from the geppettoModel
                    var variable = eval(varsWithVizTypes[j]);
                    var varTypes = variable.getTypes();
                    newInstancePaths = newInstancePaths.concat(getPotentialInstancePaths(varTypes));
                }

                // STEP 2: check types and create new instances if need be
                var diffTypes = diffReport.types;
                newInstancePaths = newInstancePaths.concat(getPotentialInstancePaths(diffTypes));

                // STEP 3: call getInstance to create the instances
                var newInstances = window.Instances.getInstance(newInstancePaths);

                // STEP 4: If instances were added, re-populate shortcuts
                for (var k = 0; k < newInstances.length; k++) {
                    GEPPETTO.ModelFactory.populateChildrenShortcuts(newInstances[k]);
                }


                for (var k = 0; k < window.Instances.length; k++) {
                    GEPPETTO.ModelFactory.populateConnections(window.Instances[k]);
                }

                return newInstances;
            },

            /**
             * Populate connections
             */
            populateConnections: function (instance) {
                // check if it's a connection
                if (instance.getVariable().getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                    // do the bit of bidness
                    this.resolveConnectionValues(instance);
                }

                // check if getChildren exists, if so add shortcuts based on ids and recurse on each
                if (typeof instance.getChildren === "function") {
                    var children = instance.getChildren();
                    if (children != undefined) {
                        for (var i = 0; i < children.length; i++) {
                            // recurse like no tomorrow
                            this.populateConnections(children[i]);
                        }
                    }
                }
            },

            /**
             * Merge Geppetto model parameter into existing Geppetto model
             *
             * @param rawModel - raw model to be merged, by deault only adds new vars / libs / types
             * @param overrideTypes - bool, mergeModel overrides type
             */
            mergeModel: function (rawModel, overrideTypes) {
                if (overrideTypes == undefined) {
                    overrideTypes = false;
                }

                this.newPathsIndexing = [];

                // diff object to report back what changed / has been added
                var diffReport = {variables: [], types: [], libraries: []};

                // STEP 1: create new geppetto model to merge into existing one
                var diffModel = this.createGeppettoModel(rawModel, false, false);

                // STEP 2: add libraries/types if any are different (both to object model and json model)
                var diffLibs = diffModel.getLibraries();
                var libs = this.geppettoModel.getLibraries();

                for (var i = 0; i < diffLibs.length; i++) {
                    if (diffLibs[i].getWrappedObj().synched == true) {
                        // if synch placeholder lib, skip it
                        continue;
                    }

                    var libMatch = false;

                    for (var j = 0; j < libs.length; j++) {
                        // if the library exists, go in and check for types diff
                        if (diffLibs[i].getPath() == libs[j].getPath()) {
                            libMatch = true;

                            var diffTypes = diffLibs[i].getTypes();
                            var existingTypes = libs[j].getTypes();

                            // first loop on types - add new ones
                            var addedTypes = [];

                            //the types that need to be swapped in in the first array, the ImportTypes that need to be swapped out in the second one
                            //these two arrays are synched by their index
                            var typeMatched = [];
                            var importTypeMatched = [];

                            for (var k = 0; k < diffTypes.length; k++) {
                                if (diffTypes[k].getWrappedObj().synched == true) {
                                    // if synch placeholder type, skip it
                                    continue;
                                }

                                var typeMatch = false;

                                for (var m = 0; m < existingTypes.length; m++) {
                                    // check if the given diff type already exists
                                    if (diffTypes[k].getPath() == existingTypes[m].getPath()) {
                                        typeMatch = true;
                                        typeMatched.push(diffTypes[k]);
                                        importTypeMatched.push(existingTypes[m]);
                                        break;
                                    }
                                }

                                // if the type doesn't exist, append it to the library
                                if (!typeMatch) {
                                    // add to list of types on raw library object
                                    if (libs[j].getWrappedObj().types == undefined) {
                                        libs[j].getWrappedObj().types = [];
                                    }

                                    libs[j].getWrappedObj().types.push(diffTypes[k].getWrappedObj());

                                    // add to library in geppetto object model
                                    libs[j].addType(diffTypes[k]);

                                    addedTypes.push(diffTypes[k]);


                                    // TODO: add potential instance paths
                                    // NOTE: maybe not needed? the path will be added if a variable uses the type

                                    // add to diff report
                                    diffReport.types.push(diffTypes[k]);

                                    //populate the shortcuts for the added type
                                    this.populateChildrenShortcuts(diffTypes[k]);
                                    //let's populate the shortcut in the parent of the type, this might not exist if it was a fetch
                                    diffTypes[k].getParent()[diffTypes[k].getId()] = diffTypes[k];
                                }

                            }

                            for (var k = 0; k < addedTypes.length; k++) {
                                // populate references for the new type
                                this.populateTypeReferences(addedTypes[k]);
                            }

                            // second loop on types - override (if flag is set)
                            if (overrideTypes) {
                                for (var k = 0; k < typeMatched.length; k++) {

                                    // populate references for the swapped type
                                    this.populateTypeReferences(typeMatched[k]);
                                    var index = importTypeMatched[k]._index;

                                    var variablesToUpdate = importTypeMatched[k].getVariableReferences();
                                    // swap type reference in ALL variables that point to it
                                    for (var x = 0; x < variablesToUpdate.length; x++) {
                                        this.swapTypeInVariable(variablesToUpdate[x], importTypeMatched[k], typeMatched[k]);
                                    }

                                    // swap type in raw model
                                    libs[j].getWrappedObj().types[index] = typeMatched[k].getWrappedObj();

                                    // store overridden type (so that unresolve type can swap it back)
                                    typeMatched[k].overrideType = importTypeMatched[k];

                                    // swap in object model
                                    typeMatched[k].parent = libs[j];
                                    libs[j].getTypes()[index] = typeMatched[k];
                                    //libs[j].removeImportType(importTypeMatched[k]);

                                    // add potential instance paths
                                    this.addPotentialInstancePathsForTypeSwap(typeMatched[k]);

                                    // update capabilities for variables and instances if any
                                    this.updateCapabilities(variablesToUpdate);

                                    // add to diff report
                                    diffReport.types.push(typeMatched[k]);

                                    //populate the shortcuts for the swapped type
                                    this.populateChildrenShortcuts(typeMatched[k]);
                                    //let's populate the shortcut in the parent of the type, this might not exist if it was a fetch
                                    typeMatched[k].getParent()[typeMatched[k].getId()] = typeMatched[k];

                                }
                            }
                        }
                    }

                    // if the library doesn't exist yet, append it to the model with everything that's in it
                    if (!libMatch) {
                        if (this.geppettoModel.getWrappedObj().libraries == undefined) {
                            this.geppettoModel.getWrappedObj().libraries = [];
                        }

                        // add to raw model
                        this.geppettoModel.getWrappedObj().libraries.push(diffLibs[i].getWrappedObj());

                        // add to geppetto object model
                        diffLibs[i].parent = this.geppettoModel;
                        this.geppettoModel.getLibraries().push(diffLibs[i]);

                        // add to diff report
                        diffReport.libraries.push(diffLibs[i]);

                        //populate the shortcuts for the added library
                        this.populateChildrenShortcuts(diffLibs[i]);
                        //let's populate the shortcut in the parent of the library, this might not exist if it was a fetch
                        diffLibs[i].getParent()[diffLibs[i].getId()] = diffLibs[i];
                    }
                }

                // STEP 3: add variables if any new ones are found (both to object model and json model)
                var diffVars = diffModel.getVariables();
                var vars = this.geppettoModel.getVariables();

                for (var x = 0; x < diffVars.length; x++) {
                    if (diffVars[x].getWrappedObj().synched == true) {
                        // if synch placeholder var, skip it
                        continue;
                    }

                    var varMatch = false;

                    for (var y = 0; y < vars.length; y++) {
                        if (diffVars[x].getPath() == vars[y].getPath()) {
                            varMatch = true;
                        }
                    }

                    // if no match, add it, it's actually new
                    if (!varMatch) {
                        if (this.geppettoModel.getWrappedObj().variables == undefined) {
                            this.geppettoModel.getWrappedObj().variables = [];
                        }

                        // append variable to raw model
                        this.geppettoModel.getWrappedObj().variables.push(diffVars[x].getWrappedObj());

                        // add variable to geppetto object model
                        diffVars[x].parent = this.geppettoModel;
                        this.geppettoModel.getVariables().push(diffVars[x]);

                        // populate references for new vars
                        this.populateTypeReferences(diffVars[x]);

                        // find new potential instance paths and add to the list
                        this.addPotentialInstancePaths([diffVars[x]]);

                        diffReport.variables.push(diffVars[x]);

                        //populate the shortcuts for the added variable
                        this.populateChildrenShortcuts(diffVars[x]);
                        //let's populate the shortcut in the parent of the variable, this might not exist if it was a fetch
                        diffVars[x].getParent()[diffVars[x].getId()] = diffVars[x];
                    }
                }

                return diffReport;
            },
            
            mergeValue: function (rawModel, overrideTypes) {
                if (overrideTypes == undefined) {
                    overrideTypes = false;
                }

                this.newPathsIndexing = [];

                // diff object to report back what changed / has been added
                var diffReport = {variables: [], types: [], libraries: []};

                // STEP 1: create new geppetto model to merge into existing one
                var diffModel = this.createGeppettoModel(rawModel, false, false);

                // STEP 2: add libraries/types if any are different (both to object model and json model)
                var diffLibs = diffModel.getLibraries();
                var libs = this.geppettoModel.getLibraries();
                var libMatch = false;
                var i = 0, j=0;
                for (i = 0; i < diffLibs.length; i++) {
                    if (diffLibs[i].getWrappedObj().synched == true) {
                        continue;
                    }
                    for (j = 0; j < libs.length; j++) {
                        if (diffLibs[i].getPath() == libs[j].getPath()) {
                            libMatch = true;
                            break;
                        }
                    }
                    if(libMatch)
                        break;
                    }   
                   // diffReport.libraries.push(diffLibs[i]);
                	var diffTypes = diffLibs[i].getTypes();
                    var existingTypes = libs[j].getTypes();
                    var typeMatch = false;
                    var k = 0, m=0;
		            for (k = 0; k < diffTypes.length; k++) {
		                if (diffTypes[k].getWrappedObj().synched == true){
		                    continue;
		                }
			            for (m = 0; m < existingTypes.length; m++) {		                    
		                    if (diffTypes[k].getPath() == existingTypes[m].getPath()) {
		                        typeMatch = true;
		                        break;
		                    }
			            }
			            if(typeMatch)
			            	break;
			        }
		           // diffReport.types.push(diffTypes[k]);
	                var diffVars = diffTypes[k].getVariables();
	                var vars = existingTypes[m].getVariables();
	                var varMatch = false;
                    for (var x = 0; x < diffVars.length; x++) {
                      if (diffVars[x].getWrappedObj().synched == true) {
                    	  	continue;
                       }
                      for (var y = 0; y < vars.length; y++) {
	                      if (diffVars[x].getPath() == vars[y].getPath()) {
	                          varMatch = true;
	                          this.populateTypeReferences(diffVars[x]);
	                          vars[y] = diffVars[x];
	                          diffReport.variables.push(vars[y]);
	                          break;
	                      }
                      }
                      if(varMatch)
                    	  break;
                    }            
                return diffReport;
            },
             
            /**
             * Updates capabilities of variables and their instances if any
             *
             * @param variables
             */
            updateCapabilities: function (variables) {
                // some bit of code encapsulated for private re-use
                var that = this;
                var updateInstancesCapabilities = function (instances) {
                    for (var j = 0; j < instances.length; j++) {
                        // check if visual type and inject AVisualCapability
                        var visualType = instances[j].getVisualType();
                        // check if visual type and inject AVisualCapability
                        if ((!(visualType instanceof Array) && visualType != null && visualType != undefined) ||
                            (visualType instanceof Array && visualType.length > 0)) {

                            if (!instances[j].hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                                instances[j].extendApi(AVisualCapability);
                                that.propagateCapabilityToParents(AVisualCapability, instances[j]);

                                if (visualType instanceof Array && visualType.length > 1) {
                                    throw( "Support for more than one visual type is not implemented." );
                                }

                                // check if it has visual groups - if so add visual group capability
                                if ((typeof visualType.getVisualGroups === "function") &&
                                    visualType.getVisualGroups() != null &&
                                    visualType.getVisualGroups().length > 0) {
                                    instances[j].extendApi(AVisualGroupCapability);
                                    instances[j].setVisualGroups(visualType.getVisualGroups());
                                }


                            }
                        }

                        // check if it has connections and inject AConnectionCapability
                        if (instances[j].getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                            if (!instances[j].hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY)) {
                                instances[j].extendApi(AConnectionCapability);
                                that.resolveConnectionValues(instances[j]);
                            }
                        }

                        if (instances[j].getType().getMetaType() == GEPPETTO.Resources.STATE_VARIABLE_TYPE) {
                            if (!instances[j].hasCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY)) {
                                instances[j].extendApi(AStateVariableCapability);
                            }
                        }

                        if (instances[j].getType().getMetaType() == GEPPETTO.Resources.DERIVED_STATE_VARIABLE_TYPE) {
                            if (!instances[j].hasCapability(GEPPETTO.Resources.DERIVED_STATE_VARIABLE_CAPABILITY)) {
                                instances[j].extendApi(ADerivedStateVariableCapability);
                            }
                        }
                        
                        if (instances[j].getType().getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                            if (!instances[j].hasCapability(GEPPETTO.Resources.PARAMETER_CAPABILITY)) {
                                instances[j].extendApi(AParameterCapability);
                            }
                        }

                        // getChildren of instance and recurse by the power of greyskull!
                        updateInstancesCapabilities(instances[j].getChildren());
                        GEPPETTO.CommandController.createTags(instances[j].getPath(), GEPPETTO.Utility.extractMethodsFromObject(instances[j], true));
                    }
                };

                // update capabilities for variables
                for (var i = 0; i < variables.length; i++) {
                    var resolvedTypes = variables[i].getTypes();
                    for (var j = 0; j < resolvedTypes.length; j++) {
                        if (resolvedTypes[j].getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                            // if a variable has a Parameter type, add AParameterCapability to the variable
                            if (!variables[i].hasCapability(GEPPETTO.Resources.PARAMETER_CAPABILITY)) {
                                variables[i].extendApi(AParameterCapability);
                            }
                        } else if (resolvedTypes[j].getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                            // if a variable has a connection type, add connection capability
                            if (!variables[i].hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY)) {
                                variables[i].extendApi(AConnectionCapability);
                            }
                        }
                    }

                    var varInstances = this.getAllInstancesOf(variables[i]);

                    // update instances capabilities
                    updateInstancesCapabilities(varInstances);
                    if(variables[i]!=null || undefined){
                    	GEPPETTO.CommandController.createTags(variables[i].getPath(), GEPPETTO.Utility.extractMethodsFromObject(variables[i], true));
                    }
                }
            },

            /**
             * Adds potential instance paths to internal cache
             *
             * @param variables
             */
            addPotentialInstancePaths: function (variables) {
                var potentialInstancePaths = [];
                var potentialInstancePathsForIndexing = [];

                for (var i = 0; i < variables.length; i++) {
                    this.fetchAllPotentialInstancePaths(variables[i], potentialInstancePaths, potentialInstancePathsForIndexing, '');
                }

                // add to allPaths and to allPathsIndexing (assumes they are new paths)
                this.allPaths = this.allPaths.concat(potentialInstancePaths);
                this.allPathsIndexing = this.allPathsIndexing.concat(potentialInstancePathsForIndexing);
                this.newPathsIndexing = this.newPathsIndexing.concat(potentialInstancePathsForIndexing);
            },

            /**
             * Add potential instance paths to internal cache given a new type
             *
             * @param type
             */
            addPotentialInstancePathsForTypeSwap: function (type) {

                var typePath = type.getPath();
                // Get all paths for the new type
                var partialPathsForNewType = [];
                var partialPathsForNewTypeIndexing = [];

                this.fetchAllPotentialInstancePathsForType(type, partialPathsForNewType, partialPathsForNewTypeIndexing, []);

                // Get all potential instances for the type we are swapping
                var potentialInstancesForNewtype = GEPPETTO.ModelFactory.getAllPotentialInstancesOfType(typePath);
                var potentialInstancesForNewtypeIndexing = GEPPETTO.ModelFactory.getAllPotentialInstancesOfType(typePath, this.allPathsIndexing);

                this.allPaths.replace = [];
                // Generate new paths and add
                for (var i = 0; i < potentialInstancesForNewtype.length; i++) {
                    for (var j = 0; j < partialPathsForNewType.length; j++) {

                        // figure out is we are dealing with statics
                        var path = undefined;
                        if(partialPathsForNewType[j].static === true) {
                            path = partialPathsForNewType[j].path;
                        } else {
                            path = potentialInstancesForNewtype[i] + '.' + partialPathsForNewType[j].path;
                        }

                        var entry = {
                            path: path,
                            metaType: partialPathsForNewType[j].metaType,
                            type: partialPathsForNewType[j].type
                        };

                        this.allPaths.replace.push(entry);
                    }
                }

                this.allPathsIndexing.replace = [];
                this.newPathsIndexing.replace = [];
                // same as above for indexing paths
                for (var i = 0; i < potentialInstancesForNewtypeIndexing.length; i++) {
                    for (var j = 0; j < partialPathsForNewTypeIndexing.length; j++) {

                        // figure out is we are dealing with statics
                        var path = undefined;
                        if(partialPathsForNewTypeIndexing[j].static === true) {
                            path = partialPathsForNewTypeIndexing[j].path;
                        } else {
                            path = potentialInstancesForNewtypeIndexing[i] + '.' + partialPathsForNewTypeIndexing[j].path;
                        }

                        var entry = {
                            path: path,
                            metaType: partialPathsForNewType[j].metaType,
                            type: partialPathsForNewType[j].type
                        };

                        this.allPathsIndexing.replace.push(entry);
                        this.newPathsIndexing.replace.push(entry);
                    }
                }

                // If variable already in allPathsIndexing, newPathsIndexing and allPaths, remove it before adding the new variable
                for (var list of [this.allPathsIndexing, this.newPathsIndexing, this.allPaths]) {
                    var is = [];
                    for (var i = 0; i < list.length; ++i)
                        if (list.replace.indexOf(list[i].path) > -1)
                            is.push(i);
                    for (var i = 0; i < list.replace.length; ++i) {
                        if (is[i] > -1) list.splice(is[i],1);
                        list.push(list.replace[i]);
                    }
                    delete list.replace;
                }

                // look for import type references and amend type
                for (var list of [this.allPaths, this.allPathsIndexing])
                    for (var i = 0; i < list.length; ++i)
                        if (list[i].type == typePath)
                            list[i].metaType = type.getMetaType();
            },

            /**
             * Given a variable, swap a given type out for another type (recursive on nested types and vars)
             *
             * @param variable
             * @param typeToSwapOut
             * @param typeToSwapIn
             */
            swapTypeInVariable: function (variable, typeToSwapOut, typeToSwapIn) {
                // ugly but we need the actual arrays stored in the variable as we'll be altering them
                var types = variable.types;
                var anonTypes = variable.anonymousTypes;

                if (types && types.length > 0) {
                    this.swapTypeInTypes(types, typeToSwapOut, typeToSwapIn);
                }
                if (anonTypes && anonTypes.length > 0) {
                    this.swapTypeInTypes(anonTypes, typeToSwapOut, typeToSwapIn);
                }
            },

            /**
             * Given a set of types, swap a given type out for another type (recursive on nested variables)
             *
             * @param types
             * @param typeToSwapOut
             * @param typeToSwapIn
             */
            swapTypeInTypes: function (types, typeToSwapOut, typeToSwapIn) {
                for (var y = 0; y < types.length; y++) {
                    if (types[y].getMetaType() == typeToSwapOut.getMetaType() && types[y].getId() == typeToSwapOut.getId()) {
                        // swap type referenced with the override one
                        types[y] = typeToSwapIn;
                    } else if (types[y].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                        // if composite - recurse for each var
                        var nestedVars = types[y].getVariables();
                        for (var x = 0; x < nestedVars.length; x++) {
                            this.swapTypeInVariable(nestedVars[x], typeToSwapOut, typeToSwapIn);
                        }
                    }
                }
            },

            /**
             * Adds instances to a list of existing instances. It will expand the instance tree if it partially exists or create it if doesn't.
             * NOTE: instances will only be added if a matching variable can be found in the GeppettoModel
             */
            addInstances: function (newInstancesPaths, topInstances, geppettoModel) {
                // based on list of new paths, expand instance tree
                for (var j = 0; j < newInstancesPaths.length; j++) {
                    // process instance paths and convert instance path syntax to raw id concatenation syntax
                    // e.g. acnet2.baskets_12[0].v --> acnet2.baskets_12.baskets_12[0].v
                    var idConcatPath = '';
                    var splitInstancePath = newInstancesPaths[j].split('.');
                    for (var i = 0; i < splitInstancePath.length; i++) {
                        if (splitInstancePath[i].indexOf('[') > -1) {
                            // contains array syntax = so grab array id
                            var arrayId = splitInstancePath[i].split('[')[0];
                            // replace brackets
                            var arrayElementId = splitInstancePath[i];

                            splitInstancePath[i] = arrayId + '.' + arrayElementId;
                        }

                        idConcatPath += (i != splitInstancePath.length - 1) ? (splitInstancePath[i] + '.') : splitInstancePath[i];
                    }

                    this.buildInstanceHierarchy(idConcatPath, null, geppettoModel, topInstances);
                }

                // populate shortcuts including new instances just created
                for (var k = 0; k < topInstances.length; k++) {
                    this.populateChildrenShortcuts(topInstances[k]);

                    // populate at window level
                    window[topInstances[k].getId()] = topInstances[k];
                    window.Instances[topInstances[k].getId()] = topInstances[k];
                }
                //TODO Should we trigger that instances were added?
            },

            /**
             * Build instance hierarchy
             */
            buildInstanceHierarchy: function (path, parentInstance, model, topLevelInstances) {
                var variable = null;
                var newlyCreatedInstance = null;
                var newlyCreatedInstances = [];

                // STEP 1: find matching first variable in path in the model object passed in
                var varsIds = path.split('.');
                // check model MetaType and find variable accordingly
                if (model.getMetaType() == GEPPETTO.Resources.GEPPETTO_MODEL_NODE) {
                    var variables = model.getVariables();
                    for (var i = 0; i < variables.length; i++) {
                        if (varsIds[0] === variables[i].getId()) {
                            variable = variables[i];
                            break;
                        }
                    }
                }
                else if (model.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    var allTypes = model.getTypes();

                    // if array, and the array type
                    if (allTypes.length == 1 && allTypes[0].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                        allTypes.push(model.getTypes()[0].getType());
                    }

                    // get all variables and match it from there
                    for (var i = 0; i < allTypes.length; i++) {
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                            var variables = allTypes[i].getVariables();

                            for (var m = 0; m < variables.length; m++) {
                                if (varsIds[0] === variables[m].getId()) {
                                    variable = variables[m];
                                    break;
                                }
                            }

                            // break outer loop too
                            if (variable != null) {
                                break;
                            }
                        }
                    }

                    // check if parent is an array - if so we know the variable cannot exist so set the same variable as the array
                    if (variable == null && parentInstance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                        // the variable associated to an array element is still the array variable
                        variable = model;
                    }
                }

                // STEP 2: create instance for given variable
                if (variable != null) {

                    var types = variable.getTypes();
                    var arrayType = null;
                    for (var j = 0; j < types.length; j++) {
                        if (types[j].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            arrayType = types[j];
                            break;
                        }
                    }

                    // check in top level instances if we have an instance for the current variable already
                    var instancePath = (parentInstance != null) ? (parentInstance.getInstancePath() + '.' + varsIds[0]) : varsIds[0];
                    var matchingInstance = this.findMatchingInstance(instancePath, topLevelInstances);

                    if (matchingInstance != null) {
                        // there is a match, simply re-use that instance as the "newly created one" instead of creating a new one
                        newlyCreatedInstance = matchingInstance;
                    } else if (arrayType != null) {
                        // when array type, explode into multiple ('size') instances
                        var size = arrayType.getSize();

                        // create new ArrayInstance object, add children to it
                        var arrayOptions = {
                            id: variable.getId(),
                            name: variable.getName(),
                            _metaType: GEPPETTO.Resources.ARRAY_INSTANCE_NODE,
                            variable: variable,
                            size: size,
                            parent: parentInstance
                        };
                        var arrayInstance = this.createArrayInstance(arrayOptions);

                        
                   
                        for (var i = 0; i < size; i++) {
                            // create simple instance for this variable
                            var options = {
                                id: variable.getId() + '[' + i + ']',
                                name: variable.getName() + '[' + i + ']',
                                _metaType: GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE,
                                variable: variable,
                                children: [],
                                parent: arrayInstance,
                                index: i
                            };
                            var explodedInstance = this.createArrayElementInstance(options);

                            // check if visual type and inject AVisualCapability
                            var visualType = explodedInstance.getVisualType();
                            if ((!(visualType instanceof Array) && visualType != null && visualType != undefined) ||
                                (visualType instanceof Array && visualType.length > 0)) {
                                explodedInstance.extendApi(AVisualCapability);
                                this.propagateCapabilityToParents(AVisualCapability, explodedInstance);

                                if (visualType instanceof Array && visualType.length > 1) {
                                    throw( "Support for more than one visual type is not implemented." );
                                }

                                // check if it has visual groups - if so add visual group capability
                                if ((typeof visualType.getVisualGroups === "function") &&
                                    visualType.getVisualGroups() != null &&
                                    visualType.getVisualGroups().length > 0) {
                                    explodedInstance.extendApi(AVisualGroupCapability);
                                    explodedInstance.setVisualGroups(visualType.getVisualGroups());
                                }
                            }

                            // check if it has connections and inject AConnectionCapability
                            if (explodedInstance.getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                                explodedInstance.extendApi(AConnectionCapability);
                                this.resolveConnectionValues(explodedInstance);
                            }

                            if (explodedInstance.getType().getMetaType() == GEPPETTO.Resources.STATE_VARIABLE_TYPE) {
                                explodedInstance.extendApi(AStateVariableCapability);
                            }

                            if (explodedInstance.getType().getMetaType() == GEPPETTO.Resources.DERIVED_STATE_VARIABLE_TYPE) {
                                explodedInstance.extendApi(ADerivedStateVariableCapability);
                            }

                            if (explodedInstance.getType().getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                                explodedInstance.extendApi(AParameterCapability);
                            }

                            // add to array instance (adding this way because we want to access as an array)
                            arrayInstance[i] = explodedInstance;

                            // ad to newly created instances list
                            newlyCreatedInstances.push(explodedInstance);
                            
                            if(explodedInstance != null || undefined){
                                GEPPETTO.CommandController.createTags(explodedInstance.getInstancePath(), GEPPETTO.Utility.extractMethodsFromObject(explodedInstance, true));
                            }
                        }

                        //  if there is a parent add to children else add to top level instances
                        if (parentInstance != null && parentInstance != undefined) {
                            parentInstance.addChild(arrayInstance);
                        } else {
                            // NOTE: not sure if this can ever happen (top level instance == array)
                            topLevelInstances.push(arrayInstance);
                        }

                    } else if (!variable.isStatic()) {
                        // NOTE: only create instances if variable is NOT static

                        // create simple instance for this variable
                        var options = {
                            id: variable.getId(),
                            name: variable.getName(),
                            _metaType: GEPPETTO.Resources.INSTANCE_NODE,
                            variable: variable,
                            children: [],
                            parent: parentInstance
                        };
                        newlyCreatedInstance = this.createInstance(options);

                        // check if visual type and inject AVisualCapability
                        var visualType = newlyCreatedInstance.getVisualType();
                        // check if visual type and inject AVisualCapability
                        if ((!(visualType instanceof Array) && visualType != null && visualType != undefined) ||
                            (visualType instanceof Array && visualType.length > 0)) {
                            newlyCreatedInstance.extendApi(AVisualCapability);
                            //particles can move, we store its state in the time series coming from the statevariablecapability
                            if (visualType.getId() == GEPPETTO.Resources.PARTICLES_TYPE) {
                                newlyCreatedInstance.extendApi(AParticlesCapability);
                            }
                            this.propagateCapabilityToParents(AVisualCapability, newlyCreatedInstance);

                            if (visualType instanceof Array && visualType.length > 1) {
                                throw( "Support for more than one visual type is not implemented." );
                            }

                            // check if it has visual groups - if so add visual group capability
                            if ((typeof visualType.getVisualGroups === "function") &&
                                visualType.getVisualGroups() != null &&
                                visualType.getVisualGroups().length > 0) {
                                newlyCreatedInstance.extendApi(AVisualGroupCapability);
                                newlyCreatedInstance.setVisualGroups(visualType.getVisualGroups());
                            }

                        }

                        // check if it has connections and inject AConnectionCapability
                        if (newlyCreatedInstance.getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                            newlyCreatedInstance.extendApi(AConnectionCapability);
                            this.resolveConnectionValues(newlyCreatedInstance);
                        }

                        if (newlyCreatedInstance.getType().getMetaType() == GEPPETTO.Resources.STATE_VARIABLE_TYPE) {
                            newlyCreatedInstance.extendApi(AStateVariableCapability);
                        }

                        if (newlyCreatedInstance.getType().getMetaType() == GEPPETTO.Resources.DERIVED_STATE_VARIABLE_TYPE) {
                            newlyCreatedInstance.extendApi(ADerivedStateVariableCapability);
                        }

                        if (newlyCreatedInstance.getType().getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                            newlyCreatedInstance.extendApi(AParameterCapability);
                        }

                        //  if there is a parent add to children else add to top level instances
                        if (parentInstance != null && parentInstance != undefined) {
                            parentInstance.addChild(newlyCreatedInstance);
                        } else {
                            topLevelInstances.push(newlyCreatedInstance);
                        }
                        
                        if(newlyCreatedInstance != null || undefined){
                        	GEPPETTO.CommandController.createTags(newlyCreatedInstance.getInstancePath(), GEPPETTO.Utility.extractMethodsFromObject(newlyCreatedInstance, true));
                        }
                    }
                }

                // STEP: 3 recurse rest of path (without first / leftmost var)
                var newPath = '';
                for (var i = 0; i < varsIds.length; i++) {
                    if (i != 0) {
                        newPath += (i < (varsIds.length - 1)) ? (varsIds[i] + '.') : varsIds[i];
                    }
                }

                // if there is a parent instance - recurse with new parameters
                if (newlyCreatedInstance != null && newPath != '') {
                    this.buildInstanceHierarchy(newPath, newlyCreatedInstance, variable, topLevelInstances);
                }

                // if there is a list of exploded instances recurse on each
                if (newlyCreatedInstances.length > 0 && newPath != '') {
                    for (var x = 0; x < newlyCreatedInstances.length; x++) {
                        this.buildInstanceHierarchy(newPath, newlyCreatedInstances[x], variable, topLevelInstances);
                    }
                }
            },

            /**
             * Resolve connection values
             */
            resolveConnectionValues: function (connectionInstanceOrVariable) {

                // get initial values
                var initialValues = null;
                if (connectionInstanceOrVariable instanceof Instance) {
                    initialValues = connectionInstanceOrVariable.getVariable().getWrappedObj().initialValues;
                } else if (connectionInstanceOrVariable.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    initialValues = connectionInstanceOrVariable.getWrappedObj().initialValues;
                }

                // get pointer A and pointer B
                var connectionValue = initialValues[0].value;
                // resolve A and B to Pointer Objects
                var pointerA = this.createPointer(connectionValue.a);
                var pointerB = this.createPointer(connectionValue.b);

                if (connectionInstanceOrVariable instanceof Instance) {
                    this.augmentPointer(pointerA, connectionInstanceOrVariable);
                    this.augmentPointer(pointerB, connectionInstanceOrVariable);
                }

                // set A and B on connection
                connectionInstanceOrVariable.setA(pointerA);
                connectionInstanceOrVariable.setB(pointerB);
            },

            /**
             * Augment pointer with fully qualified chain to point to a specific instance
             */
            augmentPointer: function (pointer, connectionInstance) {
                // find root for this branch
                var rootInstance = this.findRoot(connectionInstance);

                // find instance for given pointed variable if any
                var pointedVariable = pointer.getElements()[0].getVariable();
                var pointedIndex = pointer.getElements()[0].getIndex();

                // TODO: this could return potentially more than one match - need to extend to resolve to one
                var matchingInstance = this.findMatchingInstanceByID(pointedVariable.getId(), [rootInstance]);

                // traverse branch and build new array of PointerElements down to instance, given instancepath
                var pointerElements = [];
                var originalElement = pointer.getElements()[0];
                this.buildPointerElementsChain(matchingInstance.getRawInstancePath(), rootInstance, pointerElements, originalElement);

                // horribly override elements with newly created ones
                pointer.elements = pointerElements;

                // add connection instance reference to matching instance for easy retrieval
                if (pointedIndex > -1) {
                    matchingInstance.getChildren()[pointedIndex].addConnection(connectionInstance);
                } else {
                    matchingInstance.addConnection(connectionInstance);
                }
            },

            /**
             * Build Pointer elements chain
             *
             */
            buildPointerElementsChain: function (path, instance, pointerElements, originalElement) {
                var instanceIds = path.split('.');

                if (instance.getId() === instanceIds[0]) {
                    if (originalElement.getVariable().getId() === instanceIds[0]) {
                        // re-use original element
                        pointerElements.push(originalElement);
                    } else {
                        // create pointer element
                        var options = {
                            "variable": instance.getVariable(),
                            "type": instance.getType(),
                            "index": undefined
                        };
                        var pointerEl = new PointerElement(options);
                        pointerElements.push(pointerEl);
                    }

                    // build new path
                    var newPath = '';
                    for (var i = 0; i < instanceIds.length; i++) {
                        if (i != 0) {
                            newPath += (i < (instanceIds.length - 1)) ? (instanceIds[i] + '.') : instanceIds[i];
                        }
                    }

                    // recurse
                    if (newPath != '') {
                        var children = instance.getChildren();
                        for (var i = 0; i < children.length; i++) {
                            this.buildPointerElementsChain(newPath, children[i], pointerElements, originalElement);
                        }
                    }
                }
                // else do nothing, do not recurse on dead branches
            },

            /**
             * Find root instance
             */
            findRoot: function (instance) {
                var matching = null;

                var parent = instance.getParent();
                if (parent == undefined || parent == null) {
                    matching = instance;
                } else {
                    var recurseMatching = this.findRoot(parent);
                    if (recurseMatching != null) {
                        matching = recurseMatching;
                    }
                }

                return matching;
            },

            /**
             * Propagates a capability to parents of the given instance
             */
            propagateCapabilityToParents: function (capability, instance) {
                var parent = instance.getParent();

                // check if it has capability
                if (!(parent == undefined || parent == null) && !parent.hasCapability(capability.capabilityId)) {
                    // apply capability
                    parent.extendApi(capability);
                    
                	GEPPETTO.CommandController.createTags(parent.getPath(), GEPPETTO.Utility.extractMethodsFromObject(parent, true));

                    this.propagateCapabilityToParents(capability, parent);
                }

                // else --> live & let die
            },

            /**
             * Find instance(s) given variable id, if any
             */
            findMatchingInstanceByID: function (id, instances) {
                var matching = null;

                for (var i = 0; i < instances.length; i++) {
                    if (instances[i].getId() == id) {
                        matching = instances[i];
                        break;
                    } else {
                        if (typeof instances[i].getChildren === "function") {
                            var recurseMatch = this.findMatchingInstanceByID(id, instances[i].getChildren());
                            if (recurseMatch != null) {
                                matching = recurseMatch;
                                break;
                            }
                        }
                    }
                }

                return matching;
            },

            /**
             * Find instance given instance path (unique), if any
             */
            findMatchingInstance: function (instancePath, instances) {
                var matching = null;

                for (var i = 0; i < instances.length; i++) {
                    if (instances[i].getRawInstancePath() == instancePath) {
                        matching = instances[i];
                        break;
                    } else {
                        if (typeof instances[i].getChildren === "function") {
                            var recurseMatch = this.findMatchingInstance(instancePath, instances[i].getChildren());
                            if (recurseMatch != null) {
                                matching = recurseMatch;
                                break;
                            }
                        }
                    }
                }

                return matching;
            },

            /**
             * Find instance given Type
             */
            findMatchingInstancesByType: function (type, instances, matchingInstance) {
                for (var i = 0; i < instances.length; i++) {
                    var types = instances[i].getTypes();
                    for (var j = 0; j < types.length; j++) {
                        if (types[j] === type || types[j].getVisualType() === type) {
                            matchingInstance.push(instances[i]);
                            break;
                        }
                    }

                    if (typeof instances[i].getChildren === "function") {
                        this.findMatchingInstancesByType(type, instances[i].getChildren(), matchingInstance);
                    }
                }
            },

            /**
             * Find instance given Variable
             */
            findMatchingInstancesByVariable: function (variable, instances, matchingInstance) {
                for (var i = 0; i < instances.length; i++) {
                    if (instances[i].getVariable() === variable) {
                        matchingInstance.push(instances[i]);
                        break;
                    }

                    if (typeof instances[i].getChildren === "function") {
                        this.findMatchingInstancesByVariable(variable, instances[i].getChildren(), matchingInstance);
                    }
                }
            },

            /**
             * Build "list" of variables that have a visual type
             */
            fetchVarsWithVisualTypes: function (node, varsWithVizTypes, parentPath) {
                // build "list" of variables that have a visual type (store "path")
                // check meta type - we are only interested in variables
                var path = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    var allTypes = node.getTypes();
                    for (var i = 0; i < allTypes.length; i++) {
                        // if normal type or composite type check if it has a visual type
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.TYPE_NODE || allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                            var vizType = allTypes[i].getVisualType();

                            if (vizType != undefined && vizType != null) {
                                // ADD to list of vars with viz types
                                varsWithVizTypes.push(path);
                            }
                        }
                        else if (allTypes[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            // if array type, need to check what type the array is of
                            var arrayType = allTypes[i].getType();
                            var vizType = arrayType.getVisualType();

                            if (vizType != undefined && vizType != null) {
                                // ADD to list of vars with viz types
                                varsWithVizTypes.push(path);
                            }
                        }
                        else if ((allTypes[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE) || (allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE)) {
                            varsWithVizTypes.push(path);
                        }

                        // RECURSE on any variables inside composite types
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                            var vars = allTypes[i].getVariables();

                            if (vars != undefined && vars != null) {
                                for (var j = 0; j < vars.length; j++) {
                                    this.fetchVarsWithVisualTypes(vars[j], varsWithVizTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
                                }
                            }
                        }
                        else if (allTypes[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            var arrayType = allTypes[i].getType();

                            // check if the array is of composite type and if so recurse too on contained variables
                            if (arrayType.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                                var vars = arrayType.getVariables();

                                if (vars != undefined && vars != null) {
                                    for (var j = 0; j < vars.length; j++) {
                                        this.fetchVarsWithVisualTypes(vars[j], varsWithVizTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
                                    }
                                }
                            }
                        }
                    }
                }
            },

            /**
             *
             * @param node
             * @param path
             * @returns {boolean}
             */
            includePotentialInstance: function (node, path) {
                if (node.getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                    return false;
                }

                if (node.getType().getMetaType() == GEPPETTO.Resources.TEXT_TYPE) {
                    return false;
                }

                var nested = this.getNestingLevel(path);
                if (node.getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE && nested > 2) {
                    return false;
                }

                return true;
            },

            /**
             * Get nesting level given entity path
             *
             * @param path
             * @returns {number}
             */
            getNestingLevel: function (path) {
                return path.length - path.replace(/\./g, '').length;
            },

            /**
             * Utility function to print instance tree to console
             */
            printInstanceStats: function () {
                var stats = {};
                for (var i = 0; i < this.allPaths.length; i++) {
                    var path = this.allPaths[i];
                    if (!stats.hasOwnProperty(path.metaType)) {
                        stats[path.metaType] = 0;
                    }
                    stats[path.metaType]++;
                }
                console.log(stats);
            },

            /**
             * Build list of potential instance paths (excluding connection instances)
             */
            fetchAllPotentialInstancePaths: function (node, allPotentialPaths, allPotentialPathsForIndexing, parentPath) {
                // build new path
                var xpath = '';
                var nodeRef = node;
                var isStaticVar = (nodeRef instanceof Variable) && node.isStatic();

                if (isStaticVar){
                    // NOTE: for static variables, we add the variable path to the indexing list as ...
                    // NOTE: it's the only way to access the variable since there are no instances for static variables
                    xpath = node.getPath();
                } else {
                    xpath = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());
                }

                // build entry for path storing and indexing
                var entry = {path: xpath, metaType: node.getType().getMetaType(), type: node.getType().getPath(), static: isStaticVar};

                // if this is a static node check if we already added entry for the exact same path
                // NOTE: can't do it always for instances as it would slow things down A LOT
                var staticVarAlreadyAdded = false;
                if(isStaticVar){
                    staticVarAlreadyAdded = (this.allStaticVarsPaths[entry.path] != undefined);
                    if(!staticVarAlreadyAdded){
                        this.allStaticVarsPaths[entry.path] = entry;
                    }
                }

                // always add if not a static var, otherwise check that it wasnt already added
                if(!isStaticVar || (isStaticVar && !staticVarAlreadyAdded)){
                    allPotentialPaths.push(entry);
                    // only add to indexing if it's not a connection or nested in a composite type
                    if (this.includePotentialInstance(node, xpath)) {
                        allPotentialPathsForIndexing.push(entry);
                    }
                }

                var potentialParentPaths = [];
                // check meta type - we are only interested in NON-static variables
                if ((nodeRef instanceof Variable) && !node.isStatic()) {
                    var allTypes = node.getTypes();

                    var arrayType = undefined;
                    for (var m = 0; m < allTypes.length; m++) {
                        if (allTypes[m].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            arrayType = allTypes[m];
                        }
                    }

                    // STEP 1: build list of potential parent paths
                    if (arrayType != undefined) {
                        var arrayPath = arrayType.getType().getPath();
                        var arrayMetaType = arrayType.getType().getMetaType();
                        // add the [*] entry
                        if (arrayType.getSize() > 1) {
                            var starPath = xpath + '[' + '*' + ']';
                            potentialParentPaths.push(starPath);

                            var starEntry = {
                                path: starPath,
                                metaType: arrayMetaType,
                                type: arrayPath
                            };
                            allPotentialPaths.push(starEntry);
                            allPotentialPathsForIndexing.push(starEntry);
                        }

                        // add each array element path
                        for (var n = 0; n < arrayType.getSize(); n++) {
                            var arrayElementPath = xpath + '[' + n + ']';
                            potentialParentPaths.push(arrayElementPath);

                            var arrayElementEntry = {
                                path: arrayElementPath,
                                metaType: arrayMetaType,
                                type: arrayPath
                            };
                            allPotentialPaths.push(arrayElementEntry);
                            if (this.includePotentialInstance(node, arrayElementPath)) {
                                allPotentialPathsForIndexing.push(arrayElementEntry);
                            }
                        }
                    } else {
                        potentialParentPaths.push(xpath);
                    }

                    // STEP 2: RECURSE on ALL potential parent paths
                    var allTypes = node.getTypes();
                    for (var i = 0; i < allTypes.length; i++) {
                        // RECURSE on any variables inside composite types
                        this.fetchAllPotentialInstancePathsForType(allTypes[i], allPotentialPaths, allPotentialPathsForIndexing, potentialParentPaths);
                    }
                }
            },

            /**
             * Build list of partial instance types starting from a type
             */
            fetchAllPotentialInstancePathsForType: function (type, allPotentialPaths, allPotentialPathsForIndexing, potentialParentPaths) {
                if (type.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                    var vars = type.getVariables();

                    if (vars != undefined && vars != null) {
                        for (var j = 0; j < vars.length; j++) {
                            if (potentialParentPaths.length > 0) {
                                for (var g = 0; g < potentialParentPaths.length; g++) {
                                    this.fetchAllPotentialInstancePaths(vars[j], allPotentialPaths, allPotentialPathsForIndexing, potentialParentPaths[g]);
                                }
                            } else {
                                // used for partial instance path generation
                                this.fetchAllPotentialInstancePaths(vars[j], allPotentialPaths, allPotentialPathsForIndexing, '');
                            }
                        }
                    }
                }
                else if (type.getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    var arrayType = type.getType();

                    // check if the array is of composite type and if so recurse too on contained variables
                    if (arrayType.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                        var vars = arrayType.getVariables();

                        if (vars != undefined && vars != null) {
                            for (var l = 0; l < vars.length; l++) {
                                if (potentialParentPaths.length > 0) {
                                    for (var h = 0; h < potentialParentPaths.length; h++) {
                                        this.fetchAllPotentialInstancePaths(vars[l], allPotentialPaths, allPotentialPathsForIndexing, potentialParentPaths[h]);
                                    }
                                } else {
                                    // used for partial instance path generation
                                    this.fetchAllPotentialInstancePaths(vars[l], allPotentialPaths, allPotentialPathsForIndexing, '');
                                }
                            }
                        }
                    }
                }
            },

            /** Creates a simple composite */
            createModel: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node, parent: undefined};
                }

                var n = new GeppettoModel(options);

                return n;
            },

            /** Creates a simple composite */
            createLibrary: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var n = new Library(options);

                return n;
            },

            /** Creates a variable */
            createVariable: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node, types: node.types};
                }

                var v =  new Variable(options);
                v.values=this.createValues(node.initialValues, v);
                return v;
            },

            createValues: function (initialValuesObject, variable){
            	var values = [];
            	var options;
            	if (initialValuesObject != undefined){
            		for (var i=0; i< initialValuesObject.length; i++){
            			var value = this.createValue(initialValuesObject[i], options);
            			value.parent = variable;
            			values.push(value);
            		}
            	}
            	return values;
            }, 
            
            createValue: function(valueNode, options){
            	 if (options == null || options == undefined) {
                     options = {wrappedObj: valueNode};   
            	 }
            	 var value;
            	 if (valueNode.value.eClass == "ImportValue"){
            		 // getID() was returning undefined, hence hack - ask about this.
            		 // if I dont do this then path is "Model.nwbLibrary.responseType_10.recording_10.undefined"
            		 value = new ImportValue(options);
            	 }else{
            		 value = new Value(options);
            	 }
            	 
            	 return value;
            },
            
            /** Creates a datasource */
            createDatasource: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var d = new Datasource(options);

                // create queries
                d.queries = this.createQueries(node.queries, d);

                return d;
            },

            /**
             * Create array of client query objects given raw json query objects and a parent
             *
             * @param rawQueries
             * @param parent
             * @returns {Array}
             */
            createQueries: function(rawQueries, parent) {
                var queries = [];

                if(rawQueries!=undefined) {
                    for (var i = 0; i < rawQueries.length; i++) {
                        var q = this.createQuery(rawQueries[i]);
                        // set datasource as parent
                        q.parent = parent;
                        // push query to queries array
                        queries.push(q);
                    }
                }

                return queries;
            },

            createQuery: function(node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var q = new Query(options);

                // set matching criteria
                var matchingCriteriaRefs = node.matchingCriteria;
                if(node.matchingCriteria!=undefined){
	                for(var i=0; i<matchingCriteriaRefs.length; i++){
	                    // get type ref
	                    var typeRefs = matchingCriteriaRefs[i].type;
	                    var typesCriteria = [];
	                    for(var j=0; j<typeRefs.length; j++)
	                    {
	                        // resolve type ref
	                        var ref = typeRefs[j].$ref;
	                        var type = this.resolve(ref);
	
	                        // push to q.matchingCriteria
	                        if(type instanceof Type) {
	                            typesCriteria.push(type);
	                        }
	                    }
	
	                    q.matchingCriteria.push(typesCriteria);
	                }
                }

                return q;
            },

            getTypeOptions: function (node, options) {
                if (options == null || options == undefined) {
                    return {wrappedObj: node, superType: node.superType, visualType: node.visualType};
                }
                else {
                    return options;
                }
            },

            /** Creates a type */
            createType: function (node, options) {
                var t = new Type(this.getTypeOptions(node, options));
                return t;
            },

            /** Creates an import type */
            createImportType: function (node, options) {
                var it = new ImportType(this.getTypeOptions(node, options));
                return it;
            },

            /** Creates a composite type */
            createCompositeType: function (node, options) {
                var t = new CompositeType(this.getTypeOptions(node, options));
                t.variables = this.createVariables(node.variables, t);

                return t;
            },

            /** Creates a composite visual type */
            createCompositeVisualType: function (node, options) {
                var t = new CompositeVisualType(this.getTypeOptions(node, options));
                t.variables = this.createVariables(node.variables, t);
                if (node.visualGroups != undefined) {
                    t.visualGroups = this.createVisualGroups(node.visualGroups, t);
                }

                return t;
            },

            /** Creates a composite type */
            createArrayType: function (node, options) {
                var t = new ArrayType(this.getTypeOptions(node, options));
                t.size = node.size;
                t.type = node.arrayType;

                return t;
            },

            updateConnectionInstances: function (instance) {
                var typesToSearch = this.getAllTypesOfMetaType(GEPPETTO.Resources.COMPOSITE_TYPE_NODE);
                var connectionVariables = this.getAllVariablesOfMetaType(typesToSearch, GEPPETTO.Resources.CONNECTION_TYPE);
                var connectionInstances = [];

                for (var x = 0; x < connectionVariables.length; x++) {
                    var variable = connectionVariables[x];
                    var present = false;
                    if (instance.connections) {
                        //if there's already connections we haave to check if there is already one for this variable
                        for (var y = 0; y < instance.connections.length; y++) {
                            if (instance.connections[y].getVariable() == variable) {
                                present = true;
                                break;
                            }
                        }

                    }
                    if (!present) {
                        var initialValues = variable.getWrappedObj().initialValues;

                        var connectionValue = initialValues[0].value;
                        // resolve A and B to Pointer Objects
                        var pointerA = this.createPointer(connectionValue.a);
                        var pointerB = this.createPointer(connectionValue.b);
                        if (pointerA.getPath() == instance.getId() || pointerB.getPath() == instance.getId()) {
                            //TODO if there is more than one instance of the same projection this code will break
                            var parentInstance = this.instances.getInstance(this.getAllPotentialInstancesEndingWith(variable.getParent().getId())[0]);
                            var options = {
                                id: variable.getId(),
                                name: variable.getId(),
                                _metaType: GEPPETTO.Resources.INSTANCE_NODE,
                                variable: variable,
                                children: [],
                                parent: parentInstance
                            };
                            var connectionInstance = this.createInstance(options);
                            connectionInstance.extendApi(AConnectionCapability);
                            this.augmentPointer(pointerA, connectionInstance);
                            this.augmentPointer(pointerB, connectionInstance);

                            // set A and B on connection
                            connectionInstance.setA(pointerA);
                            connectionInstance.setB(pointerB);

                            connectionInstances.push(connectionInstance);
                        }
                    }
                }

            },

            /** Creates an instance */
            createExternalInstance: function (path, projectId, experimentId) {
                var options = {
            		_metaType: GEPPETTO.Resources.INSTANCE_NODE,
            		path: path,
                    projectId: projectId,
                    experimentId: experimentId
        		};
          
                return new ExternalInstance(options);
            },
            
            /** Creates an instance */
            createInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.INSTANCE_NODE};
                }

                var i = new Instance(options);

                return i;
            },

            /** Creates an array element istance */
            createArrayElementInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE};
                }

                var aei = new ArrayElementInstance(options);

                return aei;
            },

            /** Creates an array istance */
            createArrayInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.ARRAY_INSTANCE_NODE};
                }

                var a = new ArrayInstance(options);

                return a;
            },


            /** Creates visual groups */
            createVisualGroups: function (nodes, parent) {
                var visualGroups = [];

                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].visualGroupElements != undefined) {
                        var options = {
                            wrappedObj: nodes[i]
                        };

                        // get tags from raw json abd add to options
                        var tagRefObjs = nodes[i].tags;
                        if (tagRefObjs != undefined) {
                            var tags = [];

                            // populate tags from references
                            for (var j = 0; j < tagRefObjs.length; j++) {
                                tags.push(this.resolve(tagRefObjs[j].$ref).name);
                            }

                            // add to options to init object
                            options.tags = tags;
                        }

                        var vg = new VisualGroup(options);
                        vg.parent = parent;
                        vg.visualGroupElements = this.createVisualGroupElements(nodes[i].visualGroupElements, vg);

                        visualGroups.push(vg);
                    }
                }

                return visualGroups;
            },


            /** Creates visual group elements */
            createVisualGroupElements: function (nodes, parent) {
                var visualGroupElements = [];

                for (var i = 0; i < nodes.length; i++) {
                    var options = {wrappedObj: nodes[i], parent: parent};

                    var vge = new VisualGroupElement(options);

                    visualGroupElements.push(vge);
                }

                return visualGroupElements;
            },

            /**
             * Clean up state of instance tree
             */
            cleanupInstanceTreeState: function () {
                // get state variables - clean out time series and watched status
                var stateVariableInstances = this.getAllInstancesOf(GEPPETTO.Resources.STATE_VARIABLE_TYPE_PATH);
                for (var i = 0; i < stateVariableInstances.length; i++) {
                    stateVariableInstances[i].setTimeSeries(null);
                    stateVariableInstances[i].setWatched(false, false);
                }
                // get parameters - clean out values
                var parameterInstances = this.getAllInstancesOf(GEPPETTO.Resources.PARAMETER_TYPE_PATH);
                for (var j = 0; j < parameterInstances.length; j++) {
                    parameterInstances[j].setValue(null,false);
                }
            },

            /**
             * Gets all instances with given capability
             *
             * @param capabilityId
             * @returns {Array}
             */
            getAllInstancesWithCapability: function (capabilityId, instances) {
                var matchingInstances = [];

                // traverse everything and populate matching instances
                for (var i = 0; i < instances.length; i++) {
                    if (instances[i].hasCapability(capabilityId)) {
                        matchingInstances.push(instances[i]);
                    }

                    if (typeof instances[i].getChildren === "function") {
                        matchingInstances = matchingInstances.concat(this.getAllInstancesWithCapability(capabilityId, instances[i].getChildren()));
                    }
                }

                return matchingInstances;
            },

            /**
             * Get all instance given a type or a variable (path or actual object)
             */
            getAllInstancesOf: function (typeOrVar, instances) {
                if (typeof typeOrVar === 'string' || typeOrVar instanceof String) {
                    // it's an evil string, try to eval as path in the name of satan
                    typeOrVar = eval(typeOrVar);
                }

                var allInstances = [];

                if (instances == undefined) {
                    instances = this.instances;
                }

                if (typeOrVar instanceof Type) {
                    allInstances = this.getAllInstancesOfType(typeOrVar, instances);
                } else if (typeOrVar.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    allInstances = this.getAllInstancesOfVariable(typeOrVar, instances);
                } else {
                    // good luck
                    throw( "The argument " + typeOrVar + " is neither a Type or a Variable. Good luck." );
                }

                return allInstances;
            },

            /**
             * Get all instances given a type
             */
            getAllInstancesOfType: function (type, instances) {
                if (!(type instanceof Type)) {
                    // raise hell
                    throw( "The argument " + type + " is not a Type or a valid Type path. Good luck." );
                }

                if (instances == undefined) {
                    instances = this.instances;
                }

                // do stuff
                var matchingInstances = [];
                this.findMatchingInstancesByType(type, instances, matchingInstances);

                return matchingInstances;
            },

            /**
             * Get all instances given a variable
             */
            getAllInstancesOfVariable: function (variable, instances) {
                if (!(variable.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE)) {
                    // raise hell
                    throw( "The argument " + variable + " is not a Type or a valid Type path. Good luck." );
                }

                if (instances == undefined) {
                    instances = this.instances;
                }

                // do stuff
                var matchingInstances = [];
                this.findMatchingInstancesByVariable(variable, instances, matchingInstances);

                return matchingInstances;
            },

            /**
             * Get all POTENTIAL instances ending with a given string
             */
            getAllPotentialInstancesEndingWith: function (endingString) {
                var matchingPotentialInstances = [];

                for (var i = 0; i < this.allPaths.length; i++) {
                    if (this.allPaths[i].path.endsWith(endingString) && this.allPaths[i].path.indexOf("*") == -1) {
                        matchingPotentialInstances.push(this.allPaths[i].path);
                    }
                }

                return matchingPotentialInstances;
            },


            /**
             * Get all POTENTIAL instances starting with a given string
             */
            getAllPotentialInstancesStartingWith: function (startingString) {
                var matchingPotentialInstances = [];

                for (var i = 0; i < this.allPaths.length; i++) {
                    if (this.allPaths[i].path.startsWith(startingString) && this.allPaths[i].path.indexOf("*") == -1) {
                        matchingPotentialInstances.push(this.allPaths[i].path);
                    }
                }

                return matchingPotentialInstances;
            },

            /**
             * Get all POTENTIAL instances of a given type
             */
            getAllPotentialInstancesOfType: function (typePath, paths) {
                if (paths == undefined) {
                    paths = this.allPaths;
                }

                var matchingPotentialInstances = [];

                for (var i = 0; i < paths.length; i++) {
                    if (paths[i].type == typePath) {
                        matchingPotentialInstances.push(paths[i].path);
                    }
                }

                return matchingPotentialInstances;
            },

            /**
             * Get all POTENTIAL instances of a given meta type
             */
            getAllPotentialInstancesOfMetaType: function (metaType, paths, includeType) {
                if (paths == undefined) {
                    paths = this.allPaths;
                }

                var matchingPotentialInstances = [];

                for (var i = 0; i < paths.length; i++) {
                    if (paths[i].metaType == metaType) {
                        var itemToPush = paths[i].path;
                        if(includeType === true){
                            itemToPush = paths[i];
                        }
                        matchingPotentialInstances.push(itemToPush);
                    }
                }

                return matchingPotentialInstances;
            },

            /**
             * Get all types of given a meta type (string)
             *
             * @param metaType - metaType String
             *
             * @returns {Array} - Types
             */
            getAllTypesOfMetaType: function (metaType) {
                var types = [];

                // iterate all libraries
                var libraries = this.geppettoModel.getLibraries();
                for (var i = 0; i < libraries.length; i++) {
                    // iterate all types within library
                    var libraryTypes = libraries[i].getTypes();
                    for (var j = 0; j < libraryTypes.length; j++) {
                        // add if its metatype matches
                        if (libraryTypes[j].getMetaType() == metaType) {
                            types.push(libraryTypes[j]);
                        }
                    }
                }

                return types;
            },

            /**
             * Get all types of given a type (checks inheritance)
             *
             * @param type - Type object or Type path string
             *
             * @returns {Array} - Types
             */
            getAllTypesOfType: function (type) {
                if (typeof type === 'string' || type instanceof String) {
                    // it's an evil string, try to eval as type path in the name of baal
                    type = eval(type);
                }

                var types = [];

                // iterate all libraries
                var libraries = this.geppettoModel.getLibraries();
                for (var i = 0; i < libraries.length; i++) {
                    // iterate all types within library
                    var libraryTypes = libraries[i].getTypes();
                    for (var j = 0; j < libraryTypes.length; j++) {
                        if (libraryTypes[j] == type) {
                            // add if it's a straight match (the type himself)
                            types.push(libraryTypes[j]);
                        } else if (libraryTypes[j].getSuperType() != undefined && libraryTypes[j].getSuperType() != null) {
                            // check list of super types
                            var superTypes = libraryTypes[j].getSuperType();

                            if (!(superTypes instanceof Array)) {
                                superTypes = [superTypes];
                            }

                            for (var w = 0; w < superTypes.length; w++) {
                                if (superTypes[w] == type) {
                                    // add if superType matches
                                    types.push(libraryTypes[j]);
                                    // sufficient condition met, break the loop
                                    break;
                                }
                            }
                        } else {
                            // TODO: no immediate matches - recurse on super type and see if any matches if any matches add this type
                            /*if(libraryTypes[j].getSuperType() != undefined && libraryTypes[j].getSuperType() != null) {
                             var superTypeMatches = this.getAllTypesOfType(libraryTypes[j].getSuperType());
                             if (superTypeMatches.length > 0) {
                             types.push(libraryTypes[j]);
                             }
                             }*/
                        }
                    }
                }

                return types;
            },

            /**
             * Gets all variables of the types provided
             *
             * @param typesToSearch
             *
             * @param typeToMatch
             *
             * @returns {Array}
             */
            getAllVariablesOfType: function (typesToSearch, typeToMatch, recursive) {
                // check if array and if not "make it so"
                if (!(typesToSearch instanceof Array)) {
                    typesToSearch = [typesToSearch];
                }

                var variables = [];

                for (var i = 0; i < typesToSearch.length; i++) {
                    if (typesToSearch[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                        var nestedVariables = typesToSearch[i].getVariables();
                        if (typeToMatch != undefined && typeToMatch != null) {
                            for (var j = 0; j < nestedVariables.length; j++) {
                                var varTypes = nestedVariables[j].getTypes();
                                for (var x = 0; x < varTypes.length; x++) {
                                    if (varTypes[x] == typeToMatch) {
                                        variables.push(nestedVariables[j]);
                                    } else if (varTypes[x].getSuperType() != undefined) {
                                        // check list of super types
                                        var superTypes = varTypes[x].getSuperType();

                                        if (!(superTypes instanceof Array)) {
                                            superTypes = [superTypes];
                                        }

                                        for (var w = 0; w < superTypes.length; w++) {
                                            if (superTypes[w] == typeToMatch) {
                                                variables.push(nestedVariables[j]);
                                                // sufficient condition met, break the loop
                                                break;
                                            }
                                        }
                                    } else if (varTypes[x].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                                        // check if type is composite and recurse
                                        variables = variables.concat(this.getAllVariablesOfType([varTypes[x]], typeToMatch));
                                    }
                                    if (recursive) {
                                        this.getAllVariablesOfType(varTypes[x], typeToMatch, recursive, variables);
                                    }
                                }
                            }
                        } else {
                            variables = variables.concat(nestedVariables);
                        }
                    }
                }

                return variables;
            },


            /**
             * Gets all variables with the given metaType
             *
             * @param typesToSearch
             *
             * @param metaType
             *
             * @returns {Array}
             */
            getAllVariablesOfMetaType: function (typesToSearch, metaType) {
                // check if array and if not "make it so"
                if (!(typesToSearch.constructor === Array)) {
                    typesToSearch = [typesToSearch];
                }

                var variables = [];

                for (var i = 0; i < typesToSearch.length; i++) {
                    if (typesToSearch[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                        var nestedVariables = typesToSearch[i].getVariables();
                        if (metaType != undefined && metaType != null) {
                            for (var j = 0; j < nestedVariables.length; j++) {
                                var varTypes = nestedVariables[j].getTypes();
                                for (var x = 0; x < varTypes.length; x++) {
                                	if (varTypes[x].getMetaType() == metaType) {
                                		variables.push(nestedVariables[j]);
                                	}
                                }
                            }
                        } else {
                            variables = variables.concat(nestedVariables);
                        }
                    }
                }

                return variables;
            },

            /**
             * Get top level variables by id
             *
             * @param variableIds
             * @returns {Array}
             */
            getTopLevelVariablesById: function(variableIds){
                var variables = [];

                for(var i=0; i<variableIds.length; i++){
                  if(window.Model[variableIds[i]]!= undefined){
                      variables.push(window.Model[variableIds[i]]);
                  }
                }

                return variables;
            },

            /**
             * Get matching queries given a type and optional results type
             *
             * @param type
             * @param resultType
             */
            getMatchingQueries : function(type, resultType){
                var topLevelQueries = window.Model.getQueries();
                var matchingQueries = [];

                // iterate top level queries
                for(var k=0; k<topLevelQueries.length; k++){
                    // check matching criteria first
                    if(topLevelQueries[k].matchesCriteria(type)){
                        // if resultType is defined then match on that too
                        if(resultType != undefined){
                            if(resultType == topLevelQueries[k].getResultType()){
                                matchingQueries.push(topLevelQueries[k]);
                            }
                        } else {
                            matchingQueries.push(topLevelQueries[k]);
                        }
                    }
                }

                return matchingQueries;
            },
            
            getHTMLVariable: function(typesToSearch, metaType, identifier){
            	var variables = this.getAllVariablesOfMetaType(typesToSearch, metaType);
            	for(var i in variables){
            		if(identifier != null && identifier != undefined){
            			if(variables[i].getId()==identifier){
            				return variables[i];
            			}
            		}
            	}
            	
            	return null;
            },

            /**
             * Get total count of instances including children
             *
             * @param instances
             */
            getInstanceCount: function (instances) {
                var count = 0;

                count += instances.length;

                for (var i = 0; i < instances.length; i++) {
                    count += this.getInstanceCount(instances[i].getChildren());
                }

                return count;
            },

            /**
             * Delete instance, also removing types and variables
             *
             * @param instance
             */
            deleteInstance: function (instance) {
                var instancePath = instance.getPath();
                var removeMatchingInstanceFromArray = function (instanceArray, instance) {
                    var index = null;
                    for (var i = 0; i < instanceArray.length; i++) {
                        if (instanceArray[i].getPath() == instance.getPath()) {
                            index = i;
                            break;
                        }
                    }

                    if (index != null) {
                        instanceArray.splice(index, 1);
                    }
                };

                // delete instance
                var parent = instance.getParent();
                if (parent == undefined) {
                    // parent is window
                    // remove from array of children
                    removeMatchingInstanceFromArray(window.Instances, instance);
                    // remove reference
                    delete window[instance.getId()];
                } else {
                    // remove from array of children
                    removeMatchingInstanceFromArray(parent.getChildren(), instance);
                    // remove reference
                    delete parent[instance.getId()];
                }

                // unresolve type
                for (var j = 0; j < instance.getTypes().length; j++) {
                    this.unresolveType(instance.getTypes()[j]);
                }

                // re-run model shortcuts
                this.populateChildrenShortcuts(this.geppettoModel);

                GEPPETTO.trigger(GEPPETTO.Events.Instance_deleted, instancePath);
            },

            /**
             * Unresolve type
             *
             * @param type
             */
            unresolveType: function (type) {
                var libs = this.geppettoModel.getLibraries();
                var typePath = type.getPath();
                // swap the type with type.overrideType if any is found
                if (type.overrideType != undefined) {
                    // get all types in the current model
                    var typeToLibraryMap = [];
                    var allTypesInModel = [];
                    for (var w = 0; w < libs.length; w++) {
                        allTypesInModel = allTypesInModel.concat(libs[w].getTypes());
                        for (var v = 0; v < libs[w].getTypes().length; v++) {
                            typeToLibraryMap[libs[w].getTypes()[v].getPath()] = libs[w];
                        }
                    }

                    // fetch variables pointing to the old version of the type
                    var variablesToUpdate = type.getVariableReferences();

                    // swap type reference in ALL variables that point to it
                    for (var x = 0; x < variablesToUpdate.length; x++) {
                        this.swapTypeInVariable(variablesToUpdate[x], type, type.overrideType);
                    }

                    // find type in library (we need the index)
                    for (var m = 0; m < typeToLibraryMap[typePath].getTypes().length; m++) {
                        if (type.getPath() == typeToLibraryMap[typePath].getTypes()[m].getPath()) {
                            // swap type in raw model
                            typeToLibraryMap[typePath].getWrappedObj().types[m] = type.overrideType.getWrappedObj();

                            // swap in object model (this line is probably redundant as the parent hasn't changed)
                            type.overrideType.parent = typeToLibraryMap[typePath];
                            typeToLibraryMap[typePath].getTypes()[m] = type.overrideType;
                        }
                    }

                    // populate references for the swapped type
                    this.populateTypeReferences(type.overrideType);

                    // add potential instance paths
                    this.addPotentialInstancePaths(variablesToUpdate);

                    // update capabilities for variables and instances if any
                    this.updateCapabilities(variablesToUpdate);
                }
            },

            /**
             * A generic method to resolve a reference
             */
            resolve: function (refStr) {

                var reference = undefined;

                // Examples of reference strings
                // //@libraries.0/@types.20/@variables.5/@anonymousTypes.0/@variables.7
                // //@libraries.1/@types.5
                // //@tags.1/@tags.5
                // //@libraries.0/@types.8/@visualGroups.0/@visualGroupElements.1
                var raw = refStr.replace("geppettoModel#", "");

                raw = raw.replace(/\//g, '').split('@');
                for (var i = 0; i < raw.length; i++) {
                    var index = parseInt(raw[i].split('.')[1]);
                    if (raw[i].indexOf('libraries') > -1) {
                        reference = this.geppettoModel.getLibraries()[index];
                    } else if (raw[i].indexOf('variables') > -1) {
                        if (reference == undefined) {
                            reference = this.geppettoModel.getVariables()[index];
                        }
                        else {
                            reference = reference.getVariables()[index];
                        }
                    } else if (raw[i].indexOf('types') > -1) {
                        reference = reference.getTypes()[index];
                    } else if (raw[i].indexOf('anonymousTypes') > -1) {
                        reference = reference.getAnonymousTypes()[index];
                    } else if (raw[i].indexOf('tags') > -1 && i === 1) {
                        reference = this.rawGeppetoModel.tags[index]
                    } else if (raw[i].indexOf('tags') > -1 && i === 2) {
                        reference = reference.tags[index];
                    } else if (raw[i].indexOf('visualGroups') > -1) {
                        reference = reference.getVisualGroups()[index];
                    } else if (raw[i].indexOf('visualGroupElements') > -1) {
                        reference = reference.getVisualGroupElements()[index];
                    }
                }

                return reference;
            },

            /**
             * Populates "tags" for instances
             */
            populateInstanceTags: function () {
                var i = new Instance({});
                this.instanceTags[GEPPETTO.Resources.INSTANCE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(i, true);
                var ai = new ArrayInstance({});
                this.instanceTags[GEPPETTO.Resources.ARRAY_INSTANCE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(ai, true);
                var aei = new ArrayElementInstance({});
                this.instanceTags[GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE] = GEPPETTO.Utility.extractMethodsFromObject(aei, true);
            }
        };
    };
});
