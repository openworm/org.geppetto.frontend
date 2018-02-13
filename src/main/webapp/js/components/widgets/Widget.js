
/**
 *
 * Base Widget Class, all widgets extend this class.
 * @module Widgets/Widget
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    require("./jquery.dialogextend.min");

    var zIndex = {
        min: 1,
        max: 9999,
        restore: 10
    };

    return {

        /**
         * Not yet implemented, used for local storage and history.
         */
        Model: Backbone.Model.extend({}),

        /**
         * Creates base view for widget
         */
        View: Backbone.View.extend({

            id: null,
            dialog: null,
            visible: true,
            destroyed: false,
            size: {},
            position: {},
            registeredEvents: null,
            executedAction: 0,
            lastExecutedAction: 0,
            title: null,
            previousMaxTransparency: false,
            previousMaxSize: {},
            maximize: false,
            collapsed: false,
            widgetType: null,
            stateless: false,
            showTitleBar: true,
            transparentBackground: false,
            dirtyView: false,
            updateHistoryPosition: true,
            helpInfo: '### Inline help not yet available for this widget! \n\n' +
                'Try the <a href="http://docs.geppetto.org/en/latest/usingwidgets.html"' +
                'target="_blank">online documentation</a> instead.',

            defaultSize: function () { return { height: 300, width: 350 } },
            defaultPosition: function () { return { left: "50%", top: "50%" } },
            /**
             * Initializes the widget
             *
             * @param {String} id - id of widget
             * @param {String} name - name of widget
             * @param {String} visibility - visibility of widget window
             */
            initialize: function (options) {
                this.id = options.id;
                this.name = options.name;
                this.visible = options.visible;
                this.size = this.defaultSize();
                this.position = this.defaultPosition();
                this.contextMenu = new GEPPETTO.ContextMenuView();
                this.historyMenu = new GEPPETTO.ContextMenuView();
                this.widgetType = options.widgetType;
                this.stateless = (options.stateless != undefined) ? options.stateless : false;
                this.registeredEvents = [];
                this.dirtyView = false;

                var self = this;
                $(self.historyMenu.el).on('click', function (event) {
                    var itemId = $(event.target).attr('id');
                    var registeredItem = self.historyMenu.getClickedItem(itemId);
                    if (registeredItem != null || registeredItem != undefined) {
                        var label = registeredItem["label"];
                        self.title = label;
                        $("#" + self.id).parent().find(".ui-dialog-title").html(self.title);
                    }
                });
                window.addEventListener('resize', function (event) {
                    if (self.maximize) {
                        self.maximize = false;
                        self.setSize(window.innerHeight, window.innerWidth);
                        self.$el.trigger('resizeEnd', ["maximize"]);
                        self.maximize = true;
                    }
                });
                
                //this.setSize(this.defaultSize.height, this.defaultSize.width);
            },

            /**
             * Destroy the widget, remove it from DOM
             *
             * @command destroy()
             * @returns {String} - Action Message
             */
            destroy: function () {
                this.$el.remove();
                this.destroyed = true;
                return this.name + " destroyed";
            },

            /**
             * Hides the widget
             *
             * @command hide()
             * @returns {String} - Action Message
             */
            hide: function () {
                this.$el.dialog('close').dialogExtend();

                this.visible = false;

                return "Hiding " + this.name + " widget";
            },

            /**
             *  Opens widget dialog
             *
             * @command show()
             * @returns {Object} - Action Message
             */
            show: function () {
                this.$el.dialog('open').dialogExtend();
                this.visible = true;

                //Unfocused close button
                $(".ui-dialog-titlebar-close").blur();

                return this;
            },

            /**
             * Returns widget type as defined in GEPPETTO.Widgets
             *
             * @returns {int}
             */
            getComponentType: function () {
                return this.widgetType;
            },

            /**
             * Gets the name of the widget
             *
             * @command getName()
             * @returns {String} - Name of widget
             */
            getName: function () {
                return this.name;
            },

            /**
             * Sets the name of the widget
             * @command setName(name)
             * @param {String} name - Name of widget
             */
            setName: function (name) {
                this.name = name;

                // set name to widget window
                this.$el.dialog("option", "title", this.name).dialogExtend();

                // set flag to indicate something changed
                this.dirtyView = true;

                return this;
            },

            /**
             * @command setPosition(left,top)
             * @param {Integer} left -Left position of the widget
             * @param {Integer} top - Top position of the widget
             */
            setPosition: function (left, top) {
                if (left != null && left != undefined) {
                    this.position.left = left;
                }
                if (top != null && top != undefined) {
                    this.position.top = top;
                }

                this.$el.dialog(
                    'option', 'position', {
                        my: "left+" + this.position.left + " top+" + this.position.top,
                        at: "left top",
                        of: $(window)
                    }).dialogExtend();

                // set flag to indicate something changed
                this.dirtyView = true;

                return this;
            },

            /**
             * Sets the size of the widget
             * @command setSize(h,w)
             * @param {Integer} h - Height of the widget
             * @param {Integer} w - Width of the widget
             */
            setSize: function (h, w) {
                if (h != null && h != undefined && h != -1) {
                    this.size.height = h;
                }
                if (w != null && w != undefined && w != -1) {
                    this.size.width = w;
                }
                this.$el.dialog({ height: this.size.height, width: this.size.width }).dialogExtend();

                this.$el.trigger('resizeEnd');


                // set flag to indicate something changed
                this.dirtyView = true;

                return this;
            },

            /**
             * @command setMinHeight(h)
             * @param {Integer} h - Minimum Height of the widget
             */
            setMinHeight: function (h) {
                this.$el.dialog('option', 'minHeight', h).dialogExtend();
                return this;
            },

            /**
             * @command setMinWidth(w)
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinWidth: function (w) {
                this.$el.dialog('option', 'minWidth', w).dialogExtend();
                return this;
            },

            /**
             * @command setMinSize(h,w)
             * @param {Integer} h - Minimum Height of the widget
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinSize: function (h, w) {
                this.setMinHeight(h);
                this.setMinWidth(w);
                return this;
            },

            /**
             * @command setResizable(true|false)
             * @param {Boolean} true|false - enables / disables resizability
             */
            setResizable: function (resize) {
                this.$el.dialog('option', 'resizable', resize).dialogExtend();
                return this;
            },

            /**
             * @command setAutoWidth()
             */
            setAutoWidth: function () {
                this.$el.dialog('option', 'width', 'auto').dialogExtend();
                return this;
            },

            /**
             * @command setAutoHeigth()
             */
            setAutoHeight: function () {
                this.$el.dialog('option', 'height', 'auto').dialogExtend();
                return this;
            },


            /**
             * Returns the position of the widget
             * @command getPosition()
             * @returns {Object} - Position of the widget
             */
            getPosition: function () {
                return this.position;
            },

            /**
             * Returns the size of the widget
             * @command getSize()
             * @returns {Object} - Size of the widget
             */
            getSize: function () {
                return this.size;
            },

            /**
             * Gets the ID of the widget
             *
             * @command getId()
             * @returns {String} - ID of widget
             */
            getId: function () {
                return this.id;
            },

            /**
             * Did something change in the state of the widget?
             *
             * @command isDirty()
             * @returns {boolean} - ID of widget
             */
            isDirty: function () {
                return this.dirtyView;
            },

            /**
             * Explicitly sets status of view
             * NOTE: we need to be able to control this from outside the component
             *
             * @command setDirty()
             * @param {boolean} dirty
             */
            setDirty: function (dirty) {
                this.dirtyView = dirty;
            },

            /**
             * Returns whether widget is visible or not
             *
             * @command isVisible()
             * @returns {Boolean} - Widget visibility state
             */
            isVisible: function () {
                return this.visible;
            },

            /**
             * Search obj for the value of node within using path.
             * E.g. If obj = {"tree":{"v":1}} and path is "tree.v", it will
             * search within the obj to find the value of "tree.v", returning object
             * containing {value : val, unit : unit, scale : scale}.
             */
            getState: function (tree, state) {
                var paths = state.split('.')
                    , current = tree
                    , i;

                for (i = 0; i < paths.length; ++i) {
                    //get index from node if it's array
                    var index = paths[i].match(/[^[\]]+(?=])/g);

                    if (index == null) {
                        if (current[paths[i]] == undefined) {
                            return undefined;
                        } else {
                            current = current[paths[i]];
                        }
                    }
                    else {
                        var iNumber = index[0].replace(/[\[\]']+/g, "");

                        //take index and brackets out of the equation for now
                        var node = paths[i].replace(/ *\[[^]]*\] */g, "");

                        if (current[node][parseInt(iNumber)] == undefined) {
                            return undefined;
                        } else {
                            current = current[node][parseInt(iNumber)];
                        }
                    }
                }
                return current;
            },

            getItems: function (history, name) {
                var data = [];
                for (var i = 0; i < history.length; i++) {
                    var action = this.getId() + "[" + this.getId() + "." + name + "[" + i + "].method].apply(" + this.getId() + ", " + this.getId() + "." + name + "[" + i + "].arguments)";
                    data.push({
                        "label": history[i].label,
                        "action": [action],
                        "icon": null,
                        "position": i
                    })
                }
                return data;
            },

            showHistoryMenu: function (event) {
                var that = this;
                if (this.controller.history.length > 0) {
                    that.updateHistoryPosition = true;
                    this.historyMenu.show({
                        top: event.pageY,
                        left: event.pageX + 1,
                        groups: that.getItems(that.controller.history, "controller.history"),
                        data: that
                    });
                }

                if (event != null) {
                    event.preventDefault();
                }
                return false;
            },

            showContextMenu: function (event, data) {
                var handlers = GEPPETTO.MenuManager.getCommandsProvidersFor(data.getMetaType());

                if (handlers.length > 0) {
                    var groups = [];
                    for (var handlerIndex = 0; handlerIndex < handlers.length; handlerIndex++) {
                        groups = groups.concat(handlers[handlerIndex](data));
                    }

                    this.contextMenu.show({
                        top: event.pageY,
                        left: event.pageX + 1,
                        groups: groups,
                        //registeredItems: registeredItems,
                        data: data
                    });
                }

                if (event != null) {
                    event.preventDefault();
                }

                return false;
            },

            /**
             * hides / shows the title bar
             */
            showTitleBar: function (show) {
                this.hasTitleBar = show;

                if (show) {
                    this.$el.parent().find(".ui-dialog-titlebar").show();
                } else {
                    this.$el.parent().find(".ui-dialog-titlebar").hide();
                }

                // set flag to indicate something changed
                this.dirtyView = true;

                return this;
            },

            updateNavigationHistoryBar: function () {
                var disabled = "arrow-disabled";
                if (this.getItems(this.controller.staticHistoryMenu, "controller.staticHistoryMenu").length <= 1) {
                    if (!$("#" + this.id + "-left-nav").hasClass(disabled)) {
                        $("#" + this.id + "-left-nav").addClass(disabled);
                        $("#" + this.id + "-right-nav").addClass(disabled);
                    }
                } else {
                    if ($("#" + this.id + "-left-nav").hasClass(disabled)) {
                        $("#" + this.id + "-left-nav").removeClass(disabled);
                        $("#" + this.id + "-right-nav").removeClass(disabled);
                    }
                }
            },

            showHistoryNavigationBar: function (show) {
                this.hasHistoryNavigationBar = show;
                var leftNav = $("#" + this.id + "-left-nav");
                var rightNav = $("#" + this.id + "-right-nav");

                if (show) {
                    if ((leftNav.length == 0) && (rightNav.length == 0)) {

                        var disabled = "";
                        if (this.getItems(this.controller.staticHistoryMenu, "controller.staticHistoryMenu").length <= 1) {
                            disabled = "arrow-disabled ";
                        }

                        var that = this;
                        var button = $("<div id='" + this.id + "-left-nav' class='" + disabled + "fa fa-arrow-left'></div>" +
                            "<div id='" + this.id + "-right-nav' class='" + disabled + "fa fa-arrow-right'></div>").click(function (event) {
                                var historyItems = that.getItems(that.controller.staticHistoryMenu, "controller.staticHistoryMenu");
                                var item;
                                that.lastExecutedAction = $("#" + that.id).parent().find(".ui-dialog-title").html();
                                if (event.target.id == (that.id + "-right-nav")) {
                                    that.executedAction = that.executedAction + 1;
                                    if (that.executedAction >= historyItems.length) {
                                        that.executedAction = 0;
                                    }

                                    var match = that.executedAction;
                                    for (var i = 0; i < historyItems.length; i++) {
                                        var currentItem = historyItems[i];
                                        if (that.lastExecutedAction == currentItem.label) {
                                            match = i;
                                        }
                                    }

                                    if (that.lastExecutedAction == historyItems[that.executedAction].label) {
                                        that.executedAction = match + 1;
                                    }

                                    if (that.executedAction <= match) {
                                        that.executedAction = match + 1;
                                        if (that.executedAction >= historyItems.length) {
                                            that.executedAction = 0;
                                        }
                                    }
                                }
                                if (event.target.id == (that.id + "-left-nav")) {
                                    that.executedAction = that.executedAction - 1;
                                    if (that.executedAction <= -1) {
                                        that.executedAction = historyItems.length - 1;
                                    }

                                    var match = that.executedAction;
                                    for (var i = 0; i < historyItems.length; i++) {
                                        var currentItem = historyItems[i];
                                        if (that.lastExecutedAction == currentItem.label) {
                                            match = i;
                                        }
                                    }

                                    if ((that.lastExecutedAction == historyItems[that.executedAction].label)) {
                                        that.executedAction = match - 1;
                                    }

                                    if (that.executedAction <= -1) {
                                        that.executedAction = historyItems.length - 1;
                                    }

                                    if (that.executedAction > match) {
                                        that.executedAction = match - 1;
                                        if (that.executedAction <= -1) {
                                            that.executedAction = historyItems.length - 1;
                                        }
                                    }
                                }
                                that.updateHistoryPosition = false;
                                item = historyItems[that.executedAction].action[0];
                                GEPPETTO.CommandController.execute(item, true);
                                $("#" + that.id).parent().find(".ui-dialog-title").html(historyItems[that.executedAction].label);
                                event.stopPropagation();
                            });

                        button.insertBefore(this.dialogParent.find("span.ui-dialog-title"));
                        $(button).addClass("widget-title-bar-button");
                    }
                } else {
                    if (leftNav.is(":visible") && rightNav.is(":visible")) {
                        leftNav.remove();
                        rightNav.remove();
                        this.executedAction = 0;
                    }
                }
            },

            /**
             * hides / shows the exit button
             */
            showCloseButton: function (show) {
                if (show) {
                    this.$el.parent().find(".ui-dialog-titlebar-close").show();
                } else {
                    this.$el.parent().find(".ui-dialog-titlebar-close").hide();
                }
            },

            addButtonToTitleBar: function (button) {
                this.dialogParent.find("div.ui-dialog-titlebar").prepend(button);
                $(button).addClass("widget-title-bar-button");
            },



            /**
             * Makes the widget draggable or not
             *
             * @param draggable
             */
            setDraggable: function (draggable) {
                if (draggable) {
                    this.$el.parent().draggable({ disabled: false });
                    // NOTE: this will wipe any class applied to the widget...
                    this.setClass('');
                } else {
                    this.$el.parent().draggable({ disabled: true });
                    this.setClass('noStyleDisableDrag');
                }
            },

            /**
             * Set background as transparent
             *
             * @param isTransparent
             */
            setTransparentBackground: function (isTransparent) {
                this.transparentBackground = isTransparent;

                if (isTransparent) {
                    this.$el.parent().addClass('transparent-back');
                    this.previousMaxTransparency = true;
                } else {
                    this.$el.parent().removeClass('transparent-back');
                }
                return this;
            },

            /**
             * Inject CSS for custom behaviour
             */
            setClass: function (className) {
                this.$el.dialog({ dialogClass: className }).dialogExtend();
            },

            /**
             * Perform a jquery ui effect to the widget
             */
            perfomEffect: function (effect, options, speed) {
                this.$el.parent().effect(effect, options, speed);
            },

            /**
             * Perform a shake effect to the widget
             */
            shake: function (options, speed) {
                if (options === undefined) {
                    options = { distance: 5, times: 3 }
                }
                if (speed === undefined) {
                    speed = 500
                }

                this.$el.parent().effect('shake', options, speed)
            },

            /**
             * Renders the widget dialog window
             */
            render: function () {

                var that = this;


                //create the dialog window for the widget
                this.dialog = $("<div id=" + this.id + " class='dialog' title='" + this.name + " Widget'></div>").dialog(
                    {
                        resizable: true,
                        draggable: true,
                        top: 10,
                        height: 300,
                        width: 350,
                        closeOnEscape: false,
                        close: function (event, ui) {
                            if (event.originalEvent &&
                                $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length) {
                                that.destroy();
                            }
                        }
                    }).dialogExtend({
                        "closable": true,
                        "maximizable": true,
                        "minimizable": true,
                        "collapsable": true,
                        "restore": true,
                        "minimizeLocation": "right",
                        "icons": {
                            "maximize": "fa fa-expand",
                            "minimize": "fa fa-window-minimize",
                            "collapse": "fa  fa-chevron-circle-up",
                            "restore": "fa fa-compress",
                        },
                        "load": function (evt, dlg) {
                            var icons = $("#" + that.id).parent().find(".ui-icon");
                            for (var i = 0; i < icons.length; i++) {
                                //remove text from span added by vendor library
                                $(icons[i]).text("");
                            }
                        },
                        "beforeMinimize": function (evt, dlg) {
                            var label = that.name;
                            if (label != undefined) {
                                label = label.substring(0, 6);
                            }
                            that.$el.dialog({ title: label });
                        },
                        "beforeMaximize": function (evt, dlg) {
                            var divheight = that.size.height;
                            var divwidth = that.size.width;
                            that.previousMaxSize = { width: divwidth, height: divheight };
                        },
                        "minimize": function (evt, dlg) {
                            that.$el.dialog({ title: that.name });
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-chevron-circle-down");
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-compress");
                            $(".ui-dialog-titlebar-restore span").addClass("fa-window-restore");
                            that.$el.parent().css("z-index", zIndex.min);
                        },
                        "maximize": function (evt, dlg) {
                            that.setTransparentBackground(false);
                            $(this).trigger('resizeEnd');
                            var divheight = $(window).height();
                            var divwidth = $(window).width();
                            that.$el.dialog({ height: divheight, width: divwidth });
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-chevron-circle-down");
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-window-restore");
                            $(".ui-dialog-titlebar-restore span").addClass("fa-compress");
                            that.maximize = true;
                            that.$el.parent().css("z-index", zIndex.max);
                            that.size = {
                                height: divheight,
                                width: divwidth
                            };
                        },
                        "restore": function (evt, dlg) {
                            if (that.maximize) {
                                that.setSize(that.previousMaxSize.height, that.previousMaxSize.width);
                                $(this).trigger('restored', [that.id]);
                            }
                            that.setTransparentBackground(that.previousMaxTransparency);
                            $(this).trigger('resizeEnd');
                            that.maximize = false;
                            that.collapsed = false;
                            that.$el.parent().css("z-index", zIndex.restore);
                        },
                        "collapse": function (evt, dlg) {
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-compress");
                            $(".ui-dialog-titlebar-restore span").removeClass("fa-window-restore");
                            $(".ui-dialog-titlebar-restore span").addClass("fa-chevron-circle-down");
                            that.collapsed = true;
                            that.$el.parent().css("z-index", zIndex.min);
                        }
                    });

                this.$el = $("#" + this.id);
                this.dialogParent = this.$el.parent();


                //add history
                this.showHistoryIcon(true);

                //remove the jQuery UI icon
                this.dialogParent.find("button.ui-dialog-titlebar-close").html("");
                this.dialogParent.find("button").append("<i class='fa fa-close'></i>");


                //Take focus away from close button
                this.dialogParent.find("button.ui-dialog-titlebar-close").blur();

                //add help button
                this.showHelpIcon(true);
            },

            /**
             * Register event with widget
             *
             * @command registerEvent(event)
             */
            registerEvent: function (event, callback) {
                this.registeredEvents.push({ id: event, callback: callback });
            },

            /**
             * Unregister event with widget
             *
             * @command unregisterEvent(event)
             */
            unregisterEvent: function (event) {
                this.registeredEvents = _.reject(this.registeredEvents, function (el) {
                    return el.id === event
                });
            },

            setHelpInfo: function (helpInfo) {
                this.helpInfo = helpInfo;
            },

            getHelp: function () {
                return this.helpInfo;
            },

            setController: function (controller) {
                this.controller = controller;
            },


            showHelpIcon: function (show) {
                var that = this;
                if (show && this.$el.parent().find(".history-icon").length == 0) {
                    this.addButtonToTitleBar($("<div class='fa fa-question help-icon' title='Widget Help'></div>").click(function () {
                        GEPPETTO.ComponentFactory.addComponent('MDMODAL', {
                            title: that.id.slice(0, -1) + ' help',
                            content: that.getHelp(),
                            show: true
                        }, document.getElementById("modal-region"));
                    }));
                }
                else {
                    this.$el.parent().find(".help-icon").remove();
                }
            },

            showHistoryIcon: function (show) {
                var that = this;
                if (show && this.$el.parent().find(".history-icon").length == 0) {
                    this.addButtonToTitleBar($("<div class='fa fa-history history-icon' title='Show Navigation History'></div>").click(function (event) {
                        that.showHistoryMenu(event);
                        event.stopPropagation();
                    }));
                }
                else {
                    this.$el.parent().find(".history-icon").remove();
                }
            },

            /**
             * Get view with attributes common to all widgets
             *
             * @returns {{size: {height: *, width: *}, position: {left: *, top: *}}}
             */
            getView: function () {
                // get default stuff such as id, position and size
                return {
                    widgetType: this.widgetType,
                    isWidget: this.isWidget(),
                    showTitleBar: this.hasTitleBar,
                    showHistoryNavigationBar: this.hasHistoryNavigationBar,
                    transparentBackground: this.transparentBackground,
                    name: this.name,
                    size: {
                        height: this.size.height,
                        width: this.size.width
                    },
                    position: {
                        left: this.position.left,
                        top: this.position.top
                    }
                }
            },

            /**
             * Set attributes common to all widgets - override for widget specific behaviour
             *
             * @param view
             */
            setView: function (view) {
                // set default stuff such as position and size
                if (view.size != undefined && view.size.height != 0 && view.size.width != 0) {
                    this.setSize(view.size.height, view.size.width);
                } else {
                    // trigger auto size if we have no size info
                    this.setAutoWidth();
                    this.setAutoHeight();
                }

                if (view.position != undefined) {
                    this.setPosition(view.position.left, view.position.top);
                }

                if (view.name != undefined) {
                    this.setName(view.name);
                }

                if (view.showTitleBar != undefined) {
                    this.showTitleBar(view.showTitleBar);
                }

                if (view.showHistoryNavigationBar != undefined) {
                    this.showHistoryNavigationBar(view.showHistoryNavigationBar);
                }

                if (view.transparentBackground != undefined) {
                    this.setTransparentBackground(view.transparentBackground);
                }

                // after setting view through setView, reset dirty flag
                this.dirtyView = false;
            },

            isStateLess() {
                return this.stateless;
            },

            isWidget() {
                return true;
            }
        })
    };

});
