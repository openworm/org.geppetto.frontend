/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
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
 * Button Bar Widget class
 *
 * @module Widgets/ButtonBar
 * @author borismarin
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');

    return Widget.View
        .extend({
            variable: null,
            options: null,

            /**
             * Initialises button bar
             *
             * @param {Object}
             *            options - Object with options for the widget
             */
            initialize: function (options) {
                this.id = options.id;
                this.name = options.name;
                this.options = options;

                this.render();

                this.setResizable(false);
                this.setMinSize(0, 0);
                this.setSize(0, 0);
                this.setPosition('center', 0);
                this.setAutoWidth();
                this.setAutoHeight();

                this.innerButtonBarContainer = $('<div/>', {class: 'bubar_body'}).appendTo(this.dialog);

            },

            BootstrapMenuMaker: {
                named: function (constructor, name, def) {
                    return constructor.bind(this)(def).attr('id', name)
                },

                createButtonContent: function (button) {
                    return $('<span>')
                        .addClass(button.icon)
                        .append(' ' + button.label)
                },

                createButtonCallback: function (button) {
                    return function () {
                        button.actions.forEach(function (action) {
                            GEPPETTO.Console.executeCommand(action)
                        });
                    }
                },

                createButton: function (button) {
                    return $('<button>')
                        .addClass('btn btn-default btn-lg')
                        .append(this.createButtonContent(button))
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', button.tooltip)
                        .attr('container', 'body')
                        .on('click', this.createButtonCallback(button))
                },

                createButtonGroup: function (bgName, bgDef) {
                    var that = this;
                    var bg = $('<div>')
                        .addClass('btn-group')
                        .attr('role', 'group')
                        .attr('id', bgName);
                    $.each(bgDef, function (bName, bData) {
                        bg.append(that.named(that.createButton, bName, bData))
                    });
                    return bg;
                },

                generateToolbar: function (buttonGroups) {
                    var that = this;
                    var tbar = $('<div>').addClass('toolbar');
                    $.each(buttonGroups, function (groupName, groupDef) {
                        tbar.append(that.createButtonGroup(groupName, groupDef));
                    });
                    return tbar;
                }
            },

            sample: {
                "Sample ButtonBar": {
                    "buttonGroupOne": {
                        "buttonOne": {
                            "actions": [
                                "GEPPETTO.Console.log('button1.action1')",
                                "GEPPETTO.Console.log('button1.action2')"],
                            "icon": "gpt-osb",
                            "label": "1",
                            "tooltip": "This is a button"
                        },
                        "buttonTwo": {
                            "actions": ["GEPPETTO.Console.log('button2.action1')"],
                            "icon": "gpt-pyramidal-cell",
                            "label": "2",
                            "tooltip": "This is another button"
                        },
                        "buttonThree": {
                            "actions": ["G.addWidget(1).setMessage('hello from button 3')"],
                            "icon": "gpt-ion-channel",
                            "label": "3",
                            "tooltip": "Yet another"
                        }
                    },
                    "buttonGroupTwo": {
                        "buttonFour": {
                            "actions": ["G.addWidget(1).setMessage('hello from button 4')"],
                            "icon": "gpt-make-group",
                            "label": "four",
                            "tooltip": "And yet another..."
                        },
                        "buttonFive": {
                            "actions": ["G.addWidget(1).setMessage('hello from The Worm')"],
                            "icon": "gpt-worm",
                            "label": "five",
                            "tooltip": "OK, I'll stop now!"
                        }
                    }
                }
            },

            renderBar: function (name, barObject) {
                this.setName(name);
                this.setBody(this.BootstrapMenuMaker.generateToolbar(barObject));
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })
                
                return this;
            },


            /**
             * Creates a button bar from definitions specified in an
             * external json file
             *
             * @command fromJSON(url)
             * @param {String} url - URL of the json file defining the button bar
             */
            fromJSON: function (url) {
                var that = this;

                var barDef = null;
                $.ajax({
                    dataType: "json",
                    url: url,
                    context: that,
                    success: function (data) {
                        barDef = data;
                    },
                    error: function (xhr, status, error) {
                        var err = JSON.parse(xhr.responseText);
                        alert(err.Message);
                        GEPPETTO.Console.log('Warning: could not read bar from ' + url + '. Using default.');
                        barDef = that.sample;
                    },
                    complete: function (jqXHR, status) {
                        barName = Object.keys(barDef)[0];
                        bbar = that.renderBar(barName, barDef[barName]);
                        GEPPETTO.Console.log("Button Bar definition read from " + ((status == "success") ? url + ' .' : 'default.'));
                    }
                });

                return 'Loading toolbar definition from ' + url + '...';

            },

            /**
             * @private
             */
            setBody: function (content) {
                this.innerButtonBarContainer.html(content);
            }

        });
});
