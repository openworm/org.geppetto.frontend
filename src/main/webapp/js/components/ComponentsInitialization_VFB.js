/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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
define(function (require) {
    return function (GEPPETTO) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/js/components/VFB.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        //Logo initialization
        GEPPETTO.ComponentFactory.addComponent('LOGO', {logo: 'gpt-fly'}, document.getElementById("geppettologo"));

        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {}, document.getElementById("controlpanel"));

        //Spotlight initialization
        GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"));

        //Foreground initialization
        GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {}, document.getElementById("foreground-toolbar"));

        //Camera controls initialization
        GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));

        //Loading spinner initialization
        GEPPETTO.on('show_spinner', function (label) {
            GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {
                show: true,
                keyboard: false,
                text: label,
                logo: "gpt-fly"
            }, document.getElementById("modal-region"));
        });
        
        // CONTROLPANEL configuration
        // set column meta - which custom controls to use, source configuration for data, custom actions
        var controlPanelColMeta = [
            {
            "columnName": "path",
            "order": 1,
            "locked": false,
            "displayName": "Path",
            "source": "$entity$.getPath()"
            },
            {
            "columnName": "name",
            "order": 2,
            "locked": false,
            "displayName": "Name",
            "source": "$entity$.getName()"
            },
            {
            "columnName": "type",
            "order": 3,
            "locked": false,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
            "actions": "var displayText = '$entity$'.split('.')['$entity$'.split('.').length - 1]; getTermInfoWidget().setData($entity$[displayText + '_meta']).setName(displayText);"
            },
            {
            "columnName": "controls",
            "order": 4,
            "locked": false,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "cssClassName": "controlpanel-controls-column",
            "source": "",
            "actions": "GEPPETTO.FE.refresh();"
            },
            {
            "columnName": "image",
            "order": 5,
            "locked": false,
            "customComponent": GEPPETTO.ImageComponent,
            "displayName": "Image",
            "cssClassName": "img-column",
            "source": "GEPPETTO.ModelFactory.getAllVariablesOfMetaType($entity$.$entity$_meta.getType(), 'ImageType')[0].getInitialValues()[0].value.data"
            }
        ];
        GEPPETTO.ControlPanel.setColumnMeta(controlPanelColMeta);
        // which columns to display
        GEPPETTO.ControlPanel.setColumns(['name', 'type', 'controls', 'image']);
        // which instances to display in the control panel
        GEPPETTO.ControlPanel.setDataFilter(function (entities) {
            var visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
            var visualParents = [];
            for (var i = 0; i < visualInstances.length; i++) {
                visualParents.push(visualInstances[i].getParent());
            }
            visualInstances = visualInstances.concat(visualParents);
            var compositeInstances = [];
            for (var i = 0; i < visualInstances.length; i++) {
                if (visualInstances[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                    compositeInstances.push(visualInstances[i]);
                }
            }
            return compositeInstances;
        });
        // custom controls configuration in the controls column
        GEPPETTO.ControlPanel.setControlsConfig({
            "VisualCapability": {
                "select": {
                    "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                    "false": {
                        "actions": ["GEPPETTO.SceneController.select($instances$)"],
                        "icon": "fa-hand-stop-o",
                        "label": "Unselected",
                        "tooltip": "Select"
                    },
                    "true": {
                        "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                        "icon": "fa-hand-rock-o",
                        "label": "Selected",
                        "tooltip": "Deselect"
                    },
                    "visibility": {
                        "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                        "false": {
                            "id": "visibility",
                            "actions": ["GEPPETTO.SceneController.show($instances$);"],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show"
                        },
                        "true": {
                            "id": "visibility",
                            "actions": ["GEPPETTO.SceneController.hide($instances$);"],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide"
                        }
                    }
                },
                "color": {
                    "id": "color",
                    "actions": ["$instance$.setColor('$param$');"],
                    "icon": "fa-tint",
                    "label": "Color",
                    "tooltip": "Color"
                },
                "zoom": {
                    "id": "zoom",
                    "actions": ["GEPPETTO.SceneController.zoomTo($instances$)"],
                    "icon": "fa-search-plus",
                    "label": "Zoom",
                    "tooltip": "Zoom"
                },
                "visibility_obj": {
                    "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_obj')",
                    "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_obj != undefined && $instance$.getType().$instance$_obj.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_obj != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_obj]); } return visible; })()",
                    "false": {
                        "id": "visibility_obj",
                        "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_obj'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { instance.getType().resolve(function() { GEPPETTO.FE.refresh() }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                        "icon": "fa-eye-slash",
                        "label": "Hidden",
                        "tooltip": "Show obj"
                    },
                    "true": {
                        "id": "visibility_obj",
                        "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_obj])"],
                        "icon": "fa-eye",
                        "label": "Visible",
                        "tooltip": "Hide obj"
                    }
                },
                "visibility_swc": {
                    "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_swc')",
                    "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_swc != undefined && $instance$.getType().$instance$_swc.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_swc != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_swc]); } return visible; })()",
                    "false": {
                        "id": "visibility_swc",
                        "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_swc'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { instance.getType().resolve(function() { GEPPETTO.FE.refresh() }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                        "icon": "fa-eye-slash",
                        "label": "Hidden",
                        "tooltip": "Show swc"
                    },
                    "true": {
                        "id": "visibility_swc",
                        "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_swc])"],
                        "icon": "fa-eye",
                        "label": "Visible",
                        "tooltip": "Hide swc"
                    }
                },
            },
            "Common": {
                "info": {
                    "id": "info",
                    "actions": ["var displayTexxxt = '$instance$'.split('.')['$instance$'.split('.').length - 1]; getTermInfoWidget().setData($instance$[displayTexxxt + '_meta']).setName(displayTexxxt);"],
                    "icon": "fa-info-circle",
                    "label": "Info",
                    "tooltip": "Info"
                },
                "delete": {
                    "id": "delete",
                    "actions": ["$instance$.delete();"],
                    "icon": "fa-trash-o",
                    "label": "Delete",
                    "tooltip": "Delete"
                }
            }
        });
        // which controls will be rendered, strings need to match ids in the controls configuration
        GEPPETTO.ControlPanel.setControls({
            "Common": ['info', 'delete'],
            "VisualCapability": ['select', 'color', 'visibility', 'zoom', 'visibility_obj', 'visibility_swc']
        });

        // SPOTLIGHT configuration
        var spotlightConfig = {
            "SpotlightBar": {
                "DataSources": {},
                "CompositeType": {
                    "type": {
                        "actions": [
                            "getTermInfoWidget().setData($variableid$['$variableid$' + '_meta']).setName('$variableid$');",
                        ],
                        "icon": "fa-puzzle-piece",
                        "label": "Explore type",
                        "tooltip": "Explore type"
                    }
                },
                "TextType": {
                    "type": {
                        "actions": [
                            "getTermInfoWidget().setText($instance0$).setName('$variableid$')",
                        ],
                        "icon": "fa-eye",
                        "label": "View text",
                        "tooltip": "View text"
                    }
                },
                "HTMLType": {
                    "type": {
                        "actions": [
                            "getTermInfoWidget().setHTML($instance0$).setName('$variableid$');",
                        ],
                        "icon": "fa-eye",
                        "label": "View HTML",
                        "tooltip": "View HTML"
                    }
                },
                "VisualCapability": {
                    "buttonOne": {
                        "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                        "false": {
                            "actions": ["GEPPETTO.SceneController.select($instances$)"],
                            "icon": "fa-hand-stop-o",
                            "label": "Unselected",
                            "tooltip": "Select"
                        },
                        "true": {
                            "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                            "icon": "fa-hand-rock-o",
                            "label": "Selected",
                            "tooltip": "Deselect"
                        },
                    },
                    "buttonTwo": {
                        "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                        "false": {
                            "actions": [
                                "GEPPETTO.SceneController.show($instances$)"
                            ],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show"
                        },
                        "true": {
                            "actions": [
                                "GEPPETTO.SceneController.hide($instances$)"
                            ],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide"
                        }

                    },
                    "buttonThree": {
                        "actions": [
                            "GEPPETTO.SceneController.zoomTo($instances$)"
                        ],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                }
            }
        };
        GEPPETTO.Spotlight.setButtonBarConfiguration(spotlightConfig);
        // external datasource configuration
        var spotlightDataSourceConfig = {
            VFB: {
                url: "http://vfbdev.inf.ed.ac.uk/search/select?fl=short_form,label,synonym,id,type,has_narrow_synonym_annotation,has_broad_synonym_annotation&start=0&fq=ontology_name:(fbbt)&fq=is_obsolete:false&fq=shortform_autosuggest:VFB_*%20OR%20shortform_autosuggest:FBbt_*&rows=250&bq=is_defining_ontology:true%5E100.0%20label_s:%22%22%5E2%20synonym_s:%22%22%20in_subset_annotation:BRAINNAME%5E3%20short_form:FBbt_00003982%5E2&q=$SEARCH_TERM$&defType=edismax&qf=label%20synonym%20label_autosuggest_ws%20label_autosuggest_e%20label_autosuggest%20synonym_autosuggest_ws%20synonym_autosuggest_e%20synonym_autosuggest%20shortform_autosuggest%20has_narrow_synonym_annotation%20has_broad_synonym_annotation&wt=json&indent=true",
                crossDomain: true,
                id: "short_form",
                label: {field: "label", formatting: "$VALUE$ [$ID$]"},
                explode_fields: [{field: "short_form", formatting: "$VALUE$ ($LABEL$)"}],
                explode_arrays: [{field: "synonym", formatting: "$VALUE$ ($LABEL$)[$ID$]"}],
                type: {
                    "class": {
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){ var instance = Instances.getInstance('$ID$.$ID$_meta'); getTermInfoWidget().setData(instance).setName(instance.getParent().getId()); GEPPETTO.Spotlight.close();});"],
                        icon: "fa-dot-circle-o"
                    },
                    individual: {
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){ var instance = Instances.getInstance('$ID$'); var meta = Instances.getInstance('$ID$.$ID$_meta'); resolve3D('$ID$', function(){instance.select(); GEPPETTO.Spotlight.openToInstance(instance); getTermInfoWidget().setData(meta).setName(meta.getParent().getId());}); }); "],
                        icon: "fa-square-o"
                    }
                },
                bloodhoundConfig: {
                    datumTokenizer: function(d) {
                        return Bloodhound.tokenizers.nonword(d.label.replace('_', ' '));
                    },
                    queryTokenizer: function (q) {
                        return Bloodhound.tokenizers.nonword(q.replace('_', ' '));
                    }
                }
            }
        };
        GEPPETTO.Spotlight.addDataSource(spotlightDataSourceConfig);

        // QUERY configuration
        var queryResultsColMeta = [
            {
                "columnName": "id",
                "order": 1,
                "locked": false,
                "visible": true,
                "displayName": "ID",
            },
            {
                "columnName": "name",
                "order": 2,
                "locked": false,
                "visible": true,
                "displayName": "Name",
                "cssClassName": "query-results-name-column",
            },
            {
                "columnName": "description",
                "order": 3,
                "locked": false,
                "visible": true,
                "displayName": "Definition"
            },
            {
                "columnName": "controls",
                "order": 4,
                "locked": false,
                "visible": true,
                "customComponent": GEPPETTO.QueryResultsControlsComponent,
                "displayName": "Controls",
                "action": "",
                "cssClassName": "query-results-controls-column"
            }
        ];
        var queryResultsControlConfig = {
            "Common": {
                "info": {
                    "id": "info",
                    "actions": [
                        "Model.getDatasources()[0].fetchVariable('$ID$', function(){ var instance = Instances.getInstance('$ID$.$ID$_meta'); getTermInfoWidget().setData(instance).setName(instance.getParent().getId());});"
                    ],
                    "icon": "fa-info-circle",
                    "label": "Info",
                    "tooltip": "Info"
                }
            }
        };
        // Query control initialization with properties
        GEPPETTO.ComponentFactory.addComponent('QUERY', {
            resultsColumns: ['name', 'description', 'controls'],
            resultsColumnMeta: queryResultsColMeta,
            resultsControlsConfig: queryResultsControlConfig
        }, document.getElementById("querybuilder"));

        // add datasource config to query control
        var queryBuilderDatasourceConfig = {
            VFB: {
                url: "http://vfbdev.inf.ed.ac.uk/search/select?fl=short_form,label,synonym,id,type,has_narrow_synonym_annotation,has_broad_synonym_annotation&start=0&fq=ontology_name:(fbbt)&fq=is_obsolete:false&fq=shortform_autosuggest:VFB_*%20OR%20shortform_autosuggest:FBbt_*&rows=250&bq=is_defining_ontology:true%5E100.0%20label_s:%22%22%5E2%20synonym_s:%22%22%20in_subset_annotation:BRAINNAME%5E3%20short_form:FBbt_00003982%5E2&q=$SEARCH_TERM$&defType=edismax&qf=label%20synonym%20label_autosuggest_ws%20label_autosuggest_e%20label_autosuggest%20synonym_autosuggest_ws%20synonym_autosuggest_e%20synonym_autosuggest%20shortform_autosuggest%20has_narrow_synonym_annotation%20has_broad_synonym_annotation&wt=json&indent=true",
                crossDomain: true,
                id: "short_form",
                label: {field: "label", formatting: "$VALUE$ [$ID$]"},
                explode_fields: [{field: "short_form", formatting: "$VALUE$ ($LABEL$)"}],
                explode_arrays: [{field: "synonym", formatting: "$VALUE$ ($LABEL$)[$ID$]"}],
                type: {
                    "class": {
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){ GEPPETTO.QueryBuilder.addQueryItem({ term: '$LABEL$', id: '$ID$'}); } ); "],
                        icon: "fa-dot-circle-o"
                    },
                    individual: {
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){ GEPPETTO.QueryBuilder.addQueryItem({ term: '$LABEL$', id: '$ID$'}); } ); "],
                        icon: "fa-square-o"
                    }
                },
                resultsFilters: {
                    getId: function(record){ return record[0] },
                    getName: function(record){ return record[1] },
                    getDescription: function(record){ return record[2] },
                    getRecords: function(payload){ return payload.results.map(function(item){ return item.values })}
                },
                bloodhoundConfig: {
                    datumTokenizer: function(d) {
                        return Bloodhound.tokenizers.nonword(d.label.replace('_', ' '));
                    },
                    queryTokenizer: function (q) {
                        return Bloodhound.tokenizers.nonword(q.replace('_', ' '));
                    }
                }
            }
        };
        GEPPETTO.QueryBuilder.addDataSource(queryBuilderDatasourceConfig);

        // VFB initialization routines
        window.initVFB = function () {
            // camera setup
            GEPPETTO.Init.flipCameraY();
            GEPPETTO.Init.flipCameraZ();
            GEPPETTO.SceneController.setWireframe(true);

            // logic to assign colours to elements in the scene
            window.colours = ["0xb6b6b6", "0x00ff00", "0xff0000", "0x0000ff", "0xffd300", "0x0084f6", "0x008d46", "0xa7613e", "0x4f006a", "0x00fff6", "0x3e7b8d", "0xeda7ff", "0xd3ff95", "0xb94fff", "0xe51a58", "0x848400", "0x00ff95", "0x61002c", "0xf68412", "0xcaff00", "0x2c3e00", "0x0035c1", "0xffca84", "0x002c61", "0x9e728d", "0x4fb912", "0x9ec1ff", "0x959e7b", "0xff7bb0", "0x9e0900", "0xffb9b9", "0x8461ca", "0x9e0072", "0x84dca7", "0xff00f6", "0x00d3ff", "0xff7258", "0x583e35", "0x003e35", "0xdc61dc", "0x6172b0", "0xb9ca2c", "0x12b0a7", "0x611200", "0x2c002c", "0x5800ca", "0x95c1ca", "0xd39e23", "0x84b058", "0xe5edb9", "0xf6d3ff", "0xb94f61", "0x8d09a7", "0x6a4f00", "0x003e9e", "0x7b3e7b", "0x3e7b61", "0xa7ff61", "0x0095d3", "0x3e7200", "0xb05800", "0xdc007b", "0x9e9eff", "0x4f4661", "0xa7fff6", "0xe5002c", "0x72dc72", "0xffed7b", "0xb08d46", "0x6172ff", "0xdc4600", "0x000072", "0x090046", "0x35ed4f", "0x2c0000", "0xa700ff", "0x00f6c1", "0x9e002c", "0x003eff", "0xf69e7b", "0x6a7235", "0xffff46", "0xc1b0b0", "0x727272", "0xc16aa7", "0x005823", "0xff848d", "0xb08472", "0x004661", "0x8dff12", "0xb08dca", "0x724ff6", "0x729e00", "0xd309c1", "0x9e004f", "0xc17bff", "0x8d95b9", "0xf6a7d3", "0x232309", "0xff6aca", "0x008d12", "0xffa758", "0xe5c19e", "0x00122c", "0xc1b958", "0x00c17b", "0x462c00", "0x7b3e58", "0x9e46a7", "0x4f583e", "0x6a35b9", "0x72b095", "0xffb000", "0x4f3584", "0xb94635", "0x61a7ff", "0xd38495", "0x7b613e", "0x6a004f", "0xed58ff", "0x95d300", "0x35a7c1", "0x00009e", "0x7b3535", "0xdcff6a", "0x95d34f", "0x84ffb0", "0x843500", "0x4fdce5", "0x462335", "0x002c09", "0xb9dcc1", "0x588d4f", "0x9e7200", "0xca4684", "0x00c146", "0xca09ed", "0xcadcff", "0x0058a7", "0x2ca77b", "0x8ddcff", "0x232c35", "0xc1ffb9", "0x006a9e", "0x0058ff", "0xf65884", "0xdc7b46", "0xca35a7", "0xa7ca8d", "0x4fdcc1", "0x6172d3", "0x6a23ff", "0x8d09ca", "0xdcc12c", "0xc1b97b", "0x3e2358", "0x7b6195", "0xb97bdc", "0xffdcd3", "0xed5861", "0xcab9ff", "0x3e5858", "0x729595", "0x7bff7b", "0x95356a", "0xca9eb9", "0x723e1a", "0x95098d", "0xf68ddc", "0x61b03e", "0xffca61", "0xd37b72", "0xffed9e", "0xcaf6ff", "0x58c1ff", "0x8d61ed", "0x61b972", "0x8d6161", "0x46467b", "0x0058d3", "0x58dc09", "0x001a72", "0xd33e2c", "0x959546", "0xca7b00", "0x4f6a8d", "0x9584ff", "0x46238d", "0x008484", "0xf67235", "0x9edc84", "0xcadc6a", "0xb04fdc", "0x4f0912", "0xff1a7b", "0x7bb0d3", "0x1a001a", "0x8d35f6", "0x5800a7", "0xed8dff", "0x969696"];
            window.coli = 0;
            window.setSepCol = function (entityPath) {
                var c = coli;
                coli++;
                if (coli > 199) {
                    coli = 0;
                }
                Instances.getInstance(entityPath).setColor(colours[c], true).setOpacity(0.3, true);
                try{
                    Instances.getInstance(entityPath)[entityPath+'_swc'].setOpacity(1.0);
                } catch (ignore) {
                }
                if (c = 0) {
                    Instances.getInstance(entityPath).setOpacity(0.2, true);
                }
            };

            // custom handler for resolving 3d geometries
            window.resolve3D = function (path, callback) {
                var instance = undefined;
                try {
                    instance = Instances.getInstance(path + "." + path + "_swc");
                } catch (ignore) {
                }
                if (instance == undefined) {
                    try {
                        instance = Instances.getInstance(path + "." + path + "_obj");
                    } catch (ignore) {
                    }
                }
                if (instance != undefined) {
                    instance.getType().resolve(function () {
                        setSepCol(path);
                        if (callback != undefined) {
                            callback();
                        }
                    });
                }
            };

            // custom handler for term info clicks
            window.customHandler = function (node, path, widget) {
                var n;
                try {
                    n = eval(path);
                } catch (ex) {
                    node = undefined;
                }
                var meta = path + "." + path + "_meta";
                var target = widget;
                if (GEPPETTO.isKeyPressed("meta")) {
                    target = G.addWidget(1).addCustomNodeHandler(customHandler, 'click');
                }
                if (n != undefined) {
                    var metanode = Instances.getInstance(meta);
                    target.setData(metanode).setName(n.getName());
                } else {
                    Model.getDatasources()[0].fetchVariable(path, function () {
                        Instances.getInstance(meta);
                        target.setData(eval(meta)).setName(eval(path).getName());
                        resolve3D(path);
                    });
                }
            };

            // init empty term info area
            window.termInfoPopup = G.addWidget(1).setPosition((window.innerWidth - (Math.ceil(window.innerWidth / 5) + 10)), 10).setSize((window.innerHeight - 20), Math.ceil(window.innerWidth / 5)).setName('Click on image to show info').addCustomNodeHandler(customHandler, 'click');

            // show term info on selection
            window.oldSelection = "";
            GEPPETTO.on(Events.Select, function () {
                var selection = G.getSelection();
                if (selection.length > 0) {
                    if (selection[0].getParent() != oldSelection) {
                        oldSelection = selection[0].getParent();
                        try {
                            getTermInfoWidget().setData(selection[0].getParent()[selection[0].getParent().getId() + "_meta"]).setName(selection[0].getParent()[selection[0].getParent().getId() + "_meta"].getName());
                        } catch (ignore) {
                        }
                    }
                }
            });

            window.getTermInfoWidget = function() {
              return window.termInfoPopup;
            };
        };
    };
});
