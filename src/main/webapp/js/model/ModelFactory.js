/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * Factory class with model creation methods.
 *
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    return function (GEPPETTO) {
        var GeppettoModel = require('model/GeppettoModel');
        var Library = require('model/Library');
        var Type = require('model/Type');
        var Variable = require('model/Variable');
        var CompositeType = require('model/CompositeType');
        var CompositeVisualType = require('model/CompositeVisualType');
        var ArrayType = require('model/ArrayType');
        var Instance = require('model/Instance');
        var ArrayInstance = require('model/ArrayInstance');
        var ArrayElementInstance = require('model/ArrayElementInstance');
        var VisualGroup = require('model/VisualGroup');
        var VisualGroupElement = require('model/VisualGroupElement');
        var Pointer = require('model/Pointer');
        var PointerElement = require('model/PointerElement');
        var AVisualCapability = require('model/AVisualCapability');
        var AVisualGroupCapability = require('model/AVisualGroupCapability');
        var AConnectionCapability = require('model/AConnectionCapability');
        var AParameterCapability = require('model/AParameterCapability');
        var AStateVariableCapability = require('model/AStateVariableCapability');

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
            instanceTags: {},

            /**
             * Creates and populates Geppetto model
             */
            createGeppettoModel: function (jsonModel) {
                // store raw model for easy access during model building operations
                this.rawGeppetoModel = jsonModel;

                var geppettoModel = null;

                if (jsonModel.eClass == 'GeppettoModel') {
                    geppettoModel = this.createModel(jsonModel);
                    this.geppettoModel = geppettoModel;
                    geppettoModel.set({"variables": this.createVariables(jsonModel.variables, geppettoModel)});

                    for (var i = 0; i < jsonModel.libraries.length; i++) {
                        var library = this.createLibrary(jsonModel.libraries[i]);
                        library.set({"parent": geppettoModel});
                        library.set({"types": this.createTypes(jsonModel.libraries[i].types, library)});
                        geppettoModel.getLibraries().push(library);
                    }

                    // traverse everything and build shortcuts to children if composite --> containment == true
                    this.populateChildrenShortcuts(geppettoModel);

                    // traverse everything and populate type references in variables
                    this.populateTypeReferences(geppettoModel, geppettoModel);
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
            populateTypeReferences: function (node, geppettoModel) {

                // check if variable, if so populate type references
                if (node instanceof Variable) {
                    var types = node.getTypes();
                    var referencedTypes = [];
                    var hasPointerType = false;

                    if (types != undefined) {
                        for (var i = 0; i < types.length; i++) {
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

                        // set types to actual object references using backbone setter
                        node.set({"types": referencedTypes});
                    }

                    // check if pointer type
                    if (hasPointerType) {
                        var initialValues = node.getInitialValues();

                        if (initialValues != undefined && initialValues.length == 1) {
                            // go to initial values and parse pointer into Pointer with its PointerElements
                            var val = initialValues[0];
                            var pointer = this.createPointer(val.value);
                            // populate pointerValue on variable
                            node.set({"pointerValue": pointer});
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
                        node.set({"visualType": typeObj});
                    }

                    // resolve super type
                    var superType = node.getSuperType();
                    if (superType != undefined) {
                        // replace with reference to actual type
                        var typeObj = this.resolve(superType.$ref);
                        node.set({"superType": typeObj});
                    }
                } else if (node instanceof ArrayType) {
                    // take array type string - looks like this --> '//@libraries.1/@types.5'
                    var arrayType = node.getType();

                    if (arrayType != undefined) {
                        var typeObj = this.resolve(arrayType.$ref);
                        node.set({"type": typeObj});
                    }

                    // resolve super type
                    var superType = node.getSuperType();
                    if (superType != undefined) {
                        // replace with reference to actual type
                        var typeObj = this.resolve(superType.$ref);
                        node.set({"superType": typeObj});
                    }
                }

                // check if getChildren exists, if so recurse over children
                if (typeof node.getChildren === "function") {
                    var children = node.getChildren();

                    if (children != undefined) {
                        for (var i = 0; i < children.length; i++) {
                            this.populateTypeReferences(children[i], geppettoModel);
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
             * Creates variables starting from an array of variables in the json model format
             */
            createVariables: function (jsonVariables, parent) {
                var variables = [];

                if (jsonVariables != undefined) {
                    for (var i = 0; i < jsonVariables.length; i++) {
                        var variable = this.createVariable(jsonVariables[i]);
                        variable.set({"parent": parent});

                        // check if it has an anonymous type
                        if (jsonVariables[i].anonymousTypes != undefined) {
                            variable.set({"anonymousTypes": this.createTypes(jsonVariables[i].anonymousTypes, variable)});
                        }

                        variables.push(variable);
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
                        else if (jsonTypes[i].eClass == 'ArrayType') {
                            type = this.createArrayType(jsonTypes[i]);
                        } else {
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
                        type.set({"parent": parent});

                        types.push(type);
                    }
                }

                return types;
            },

            /**
             * Creates and populates initial instance tree skeleton with any instance that needs to be visualized
             */
            createInstances: function (geppettoModel) {
                // reset scene complexity index
                GEPPETTO.SceneController.complexity = 0;

                var instances = [];

                // pre-populate instance tags for console suggestions
                this.populateInstanceTags();

                // we need to explode instances for variables with visual and connection types
                var varsWithVizTypes = [];
                var varsWithConnTypes = [];
                // we need to fetch all potential instance paths (even for not exploded instances)
                var allPotentialInstancePaths = [];

                // builds list of vars with visual types and connection types - start traversing from top level variables
                var vars = geppettoModel.getVariables();
                for (var i = 0; i < vars.length; i++) {
                    this.fetchVarsWithVisualOrConnectionTypes(vars[i], varsWithVizTypes, varsWithConnTypes, '');
                    this.fetchAllPotentialInstancePaths(vars[i], allPotentialInstancePaths, '');
                }

                this.allPaths = allPotentialInstancePaths;
                var varsToInstantiate = varsWithVizTypes;//.concat(varsWithConnTypes);

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

                                // increase scene complexity counter
                                if (visualType.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                                    GEPPETTO.SceneController.complexity += visualType.getVariables().length;
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

                            if (explodedInstance.getType().getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                                explodedInstance.extendApi(AParameterCapability);
                            }

                            // add to array instance (adding this way because we want to access as an array)
                            arrayInstance[i] = explodedInstance;

                            // ad to newly created instances list
                            newlyCreatedInstances.push(explodedInstance);
                        }

                        //  if there is a parent add to children else add to top level instances
                        if (parentInstance != null && parentInstance != undefined) {
                            parentInstance.addChild(arrayInstance);
                        } else {
                            // NOTE: not sure if this can ever happen (top level instance == array)
                            topLevelInstances.push(arrayInstance);
                        }

                    } else {
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

                            // increase scene complexity counter
                            if (visualType.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                                GEPPETTO.SceneController.complexity += visualType.getVariables().length;
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

                        if (newlyCreatedInstance.getType().getMetaType() == GEPPETTO.Resources.PARAMETER_TYPE) {
                            newlyCreatedInstance.extendApi(AParameterCapability);
                        }

                        //  if there is a parent add to children else add to top level instances
                        if (parentInstance != null && parentInstance != undefined) {
                            parentInstance.addChild(newlyCreatedInstance);
                        } else {
                            topLevelInstances.push(newlyCreatedInstance);
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
                } else if (connectionInstanceOrVariable instanceof Variable) {
                    initialValues = connectionInstanceOrVariable.getWrappedObj().initialValues;
                }

                // get pointer A and pointer B
                var connectionValue = initialValues[0].value;
                // resolve A and B to Pointer Objects
                var pointerA = this.createPointer(connectionValue.a[0]);
                var pointerB = this.createPointer(connectionValue.b[0]);

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
                pointer.set({'elements': pointerElements});

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
            fetchVarsWithVisualOrConnectionTypes: function (node, varsWithVizTypes, varsWithConnTypes, parentPath) {
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

                        // check if type is connection
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                            varsWithConnTypes.push(path);
                        }

                        // RECURSE on any variables inside composite types
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                            var vars = allTypes[i].getVariables();

                            if (vars != undefined && vars != null) {
                                for (var j = 0; j < vars.length; j++) {
                                    this.fetchVarsWithVisualOrConnectionTypes(vars[j], varsWithVizTypes, varsWithConnTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
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
                                        this.fetchVarsWithVisualOrConnectionTypes(vars[j], varsWithVizTypes, varsWithConnTypes, (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId()));
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

                var nested = path.length - path.replace(/\./g, '').length;
                if (node.getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE && nested > 4) {
                    return false;
                }

                return true;
            },

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
            fetchAllPotentialInstancePaths: function (node, allPotentialPaths, parentPath) {
                // build new path
                var path = (parentPath == '') ? node.getId() : (parentPath + '.' + node.getId());

                // only add if it's not a connection
                if (this.includePotentialInstance(node, path)) {
                    allPotentialPaths.push({path: path, metaType: node.getType().getMetaType()});
                }

                var potentialParentPaths = [];
                // check meta type - we are only interested in variables
                if (node.getMetaType() == GEPPETTO.Resources.VARIABLE_NODE) {
                    var allTypes = node.getTypes();

                    var arrayType = undefined;
                    for (var m = 0; m < allTypes.length; m++) {
                        if (allTypes[m].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            arrayType = allTypes[m];
                        }
                    }

                    // STEP 1: build list of potential parent paths
                    if (arrayType != undefined) {
                        // add the [*] entry
                        if (arrayType.getSize() > 1) {
                            var starPath = path + '[' + '*' + ']';
                            potentialParentPaths.push(starPath);
                            allPotentialPaths.push({path: starPath, metaType: arrayType.getMetaType()});
                        }

                        // add each array element path
                        for (var n = 0; n < arrayType.getSize(); n++) {
                            var arrayElementPath = path + '[' + n + ']';
                            potentialParentPaths.push(arrayElementPath);

                            if (this.includePotentialInstance(node, path)) {
                                allPotentialPaths.push({
                                    path: arrayElementPath,
                                    metaType: arrayType.getType().getMetaType()
                                });
                            }
                        }
                    } else {
                        potentialParentPaths.push(path);
                    }

                    // STEP 2: RECURSE on ALL potential parent paths
                    var allTypes = node.getTypes();
                    for (var i = 0; i < allTypes.length; i++) {
                        // RECURSE on any variables inside composite types
                        if (allTypes[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                            var vars = allTypes[i].getVariables();

                            if (vars != undefined && vars != null) {
                                for (var j = 0; j < vars.length; j++) {
                                    for (var g = 0; g < potentialParentPaths.length; g++) {
                                        this.fetchAllPotentialInstancePaths(vars[j], allPotentialPaths, potentialParentPaths[g]);
                                    }
                                }
                            }
                        }
                        else if (allTypes[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                            var arrayType = allTypes[i].getType();

                            // check if the array is of composite type and if so recurse too on contained variables
                            if (arrayType.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                                var vars = arrayType.getVariables();

                                if (vars != undefined && vars != null) {
                                    for (var l = 0; l < vars.length; l++) {
                                        for (var h = 0; h < potentialParentPaths.length; h++) {
                                            this.fetchAllPotentialInstancePaths(vars[l], allPotentialPaths, potentialParentPaths[h]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            /** Creates a simple composite */
            createModel: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node, id: 'Model', parent: undefined};
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
                    options = {wrappedObj: node};
                }

                var v = new Variable(options);
                v.set({"types": node.types});

                return v;
            },

            /** Creates a type node */
            createType: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var t = new Type(options);
                t.set({"visualType": node.visualType});
                t.set({"superType": node.superType});

                return t;
            },

            /** Creates a composite type */
            createCompositeType: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var t = new CompositeType(options);
                t.set({"visualType": node.visualType});
                t.set({"superType": node.superType});
                t.set({"variables": this.createVariables(node.variables, t)});

                return t;
            },

            /** Creates a composite visual type */
            createCompositeVisualType: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var t = new CompositeVisualType(options);
                t.set({"visualType": node.visualType});
                t.set({"superType": node.superType});
                t.set({"variables": this.createVariables(node.variables, t)});
                if (node.visualGroups != undefined) {
                    t.set({"visualGroups": this.createVisualGroups(node.visualGroups, t)});
                }

                return t;
            },

            /** Creates a composite type */
            createArrayType: function (node, options) {
                if (options == null || options == undefined) {
                    options = {wrappedObj: node};
                }

                var t = new ArrayType(options);
                t.set({"size": node.size});
                t.set({"type": node.arrayType});

                return t;
            },

            createConnectionInstances: function (instance) {
                var typesToSearch = this.getAllTypesOfMetaType(GEPPETTO.Resources.COMPOSITE_TYPE_NODE);
                var connectionVariables = this.getAllVariablesOfMetaType(typesToSearch, GEPPETTO.Resources.CONNECTION_TYPE);
                var connectionInstances = [];

                for (var x = 0; x < connectionVariables.length; x++) {
                    var variable = connectionVariables[x];
                    var initialValues = variable.getWrappedObj().initialValues;

                    var connectionValue = initialValues[0].value;
                    // resolve A and B to Pointer Objects
                    var pointerA = this.createPointer(connectionValue.a[0]);
                    var pointerB = this.createPointer(connectionValue.b[0]);
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

                instance.set({'connections': connectionInstances});
                instance.set({'connectionsLoaded': true});
            },

            /** Creates an instance */
            createInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.INSTANCE_NODE};
                }

                var i = new Instance(options);

                GEPPETTO.Console.createTags(i.getInstancePath(), this.instanceTags[GEPPETTO.Resources.INSTANCE_NODE]);

                return i;
            },

            /** Creates an array element istance */
            createArrayElementInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE};
                }

                var aei = new ArrayElementInstance(options);

                GEPPETTO.Console.createTags(aei.getInstancePath(), this.instanceTags[GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE]);

                return aei;
            },

            /** Creates an array istance */
            createArrayInstance: function (options) {
                if (options == null || options == undefined) {
                    options = {_metaType: GEPPETTO.Resources.ARRAY_INSTANCE_NODE};
                }

                var a = new ArrayInstance(options);

                GEPPETTO.Console.createTags(a.getInstancePath(), this.instanceTags[GEPPETTO.Resources.ARRAY_INSTANCE_NODE]);

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
                        vg.set({"parent": parent});
                        vg.set({"visualGroupElements": this.createVisualGroupElements(nodes[i].visualGroupElements, vg)});

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
                    parameterInstances[j].setValue(null);
                }
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
                } else if (typeOrVar instanceof Variable) {
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
                if (!(variable instanceof Variable)) {
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
                        } else if (libraryTypes[j].getSuperType() != undefined &&
                            libraryTypes[j].getSuperType() != null &&
                            libraryTypes[j].getSuperType() == type) {
                            // add if superType matches
                            types.push(libraryTypes[j]);
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
            getAllVariablesOfType: function (typesToSearch, typeToMatch) {
                // check if array and if not "make it so"
                if (!(typesToSearch.constructor === Array)) {
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
                                    if (varTypes[x] == typeToMatch || varTypes[x].getSuperType() == typeToMatch) {
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
             * A generic method to resolve a reference
             */
            resolve: function (refStr) {

                var reference = undefined;

                // Examples of reference strings
                // geppettoModel#//@libraries.0/@types.20/@variables.5/@anonymousTypes.0/@variables.7
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
