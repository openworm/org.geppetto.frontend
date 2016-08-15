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
        
        /*ADD COMPONENTS*/

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

        //Query control initialization
        GEPPETTO.ComponentFactory.addComponent('QUERY', {}, document.getElementById("querybuilder"));

        //Loading spinner initialization
        GEPPETTO.on('show_spinner', function (label) {
            GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {
                show: true,
                keyboard: false,
                text: label,
                logo: "gpt-fly"
            }, document.getElementById("modal-region"));
        });

        /*CONFIGURE COMPONENTS*/
        
        // CONTROLPANEL configuration
        // set column meta - which custom controls to use, source configuration for data, custom actions
        GEPPETTO.ControlPanel.setColumnMeta([{
            "columnName": "path",
            "order": 1,
            "locked": false,
            "displayName": "Path",
            "source": "$entity$.getPath()"
        }, {
            "columnName": "name",
            "order": 2,
            "locked": false,
            "displayName": "Name",
            "source": "$entity$.getName()"
        }, {
            "columnName": "type",
            "order": 3,
            "locked": false,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
            "actions": "var displayText = '$entity$'.split('.')['$entity$'.split('.').length - 1]; G.addWidget(1).setData($entity$[displayText + '_meta']).setName(displayText).addCustomNodeHandler(customHandler,'click');"
        }, {
            "columnName": "controls",
            "order": 4,
            "locked": false,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "source": "",
            "actions": "GEPPETTO.FE.refresh();"
        }, {
            "columnName": "image",
            "order": 5,
            "locked": false,
            "customComponent": GEPPETTO.ImageComponent,
            "displayName": "Image",
            "cssClassName": "img-column",
            "source": "GEPPETTO.ModelFactory.getAllVariablesOfMetaType($entity$.$entity$_meta.getType(), 'ImageType')[0].getInitialValues()[0].value.data"
        }]);
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
                    "actions": ["var displayTexxxt = '$instance$'.split('.')['$instance$'.split('.').length - 1]; G.addWidget(1).setData($instance$[displayTexxxt + '_meta']).setName(displayTexxxt).addCustomNodeHandler(customHandler,'click');"],
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
                            "G.addWidget(1).setData($variableid$['$variableid$' + '_meta']).setName('$variableid$').addCustomNodeHandler(customHandler,'click');",
                        ],
                        "icon": "fa-puzzle-piece",
                        "label": "Explore type",
                        "tooltip": "Explore type"
                    }
                },
                "TextType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).setText($instance0$).setName('$variableid$')",
                        ],
                        "icon": "fa-eye",
                        "label": "View text",
                        "tooltip": "View text"
                    }
                },
                "HTMLType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).setHTML($instance0$).setName('$variableid$').addCustomNodeHandler(function(node){G.addWidget(3).setData(node);}, 'click');",
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
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){});"],
                        icon: "fa-dot-circle-o"
                    },
                    individual: {
                        actions: ["Model.getDatasources()[0].fetchVariable('$ID$', function(){ var instance = Instances.getInstance('$ID$'); resolve3D('$ID$', function(){instance.select(); GEPPETTO.Spotlight.openToInstance(instance);}); }); "],
                        icon: "fa-square-o"
                    }
                }
            }
        };
        GEPPETTO.Spotlight.addDataSource(spotlightDataSourceConfig);

        // QUERY configuration
        var queryBuilderConfig = {
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
                }
            }
        };
        GEPPETTO.QueryBuilder.addDataSource(queryBuilderConfig);
    };
});