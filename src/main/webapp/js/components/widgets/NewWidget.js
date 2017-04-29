/**
 *
 * High Level widget component
 * @module Widgets/Widget
 * @author Adrian Quintana (adrian@metacell.us)
 */
define(function (require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    require("./jquery.dialogextend.min");
    var React = require('react');

    return function addWidget(WrappedComponent) {

        /**
         * Creates base view for widget
         */
        return class Widget extends WrappedComponent {

            constructor(props) {
                super(props);
                this.state = $.extend(this.state, {
                    dialog: null,
                    visible: true,
                    destroyed: false,
                    size: {},
                    position: {},
                    registeredEvents: null,
                    executedAction: 0,
                    title: null,
                    previousMaxTransparency: false,
                    previousMaxSize: {},
                    maximize: false,
                    collapsed: false,

                    defaultSize: { height: 300, width: 350 },
                    defaultPosition: { left: "50%", top: "50%" }
                });
            }

            /**
             * Destroy the widget, remove it from DOM
             *
             * @command destroy()
             * @returns {String} - Action Message
             */
            destroy () {
                this.$el.remove();
                this.destroyed = true;
                return this.name + " destroyed";
            }

            /**
             *ff
             * Hides the widget
             *
             * @command hide()
             * @returns {String} - Action Message
             */
            hide() {
                this.$el.dialog('close').dialogExtend();

                this.visible = false;

                return "Hiding " + this.name + " widget";
            }

            /**
             *  Opens widget dialog
             *
             * @command show()
             * @returns {String} - Action Message
             */
            show() {
                this.$el.dialog('open').dialogExtend();
                this.visible = true;

                //Unfocused close button
                $(".ui-dialog-titlebar-close").blur();

                return this;
            }

            /**
             * Gets the name of the widget
             *
             * @command getName()
             * @returns {String} - Name of widget
             */
            getName() {
                return this.name;
            }

            /**
             * Sets the name of the widget
             * @command setName(name)
             * @param {String} name - Name of widget
             */
            setName(name) {
                this.name = name;

                // set name to widget window
                this.$el.dialog("option", "title", this.name).dialogExtend();

                return this;
            }

            /**
             * @command setPosition(left,top)
             * @param {Integer} left -Left position of the widget
             * @param {Integer} top - Top position of the widget
             */
            setPosition(left, top) {
                this.position.left = left;
                this.position.top = top;

                this.$el.dialog(
                    'option', 'position', {
                        my: "left+" + this.position.left + " top+" + this.position.top,
                        at: "left top",
                        of: $(window)
                    }).dialogExtend();
                return this;
            }

            /**
             * Sets the size of the widget
             * @command setSize(h,w)
             * @param {Integer} h - Height of the widget
             * @param {Integer} w - Width of the widget
             */
            setSize(h, w) {
                this.size.height = h;
                this.size.width = w;
                this.$el.dialog({ height: this.size.height, width: this.size.width }).dialogExtend();
                this.$el.trigger('resizeEnd');
                return this;
            }

            /**
             * @command setMinHeight(h)
             * @param {Integer} h - Minimum Height of the widget
             */
            setMinHeight(h) {
                this.$el.dialog('option', 'minHeight', h).dialogExtend();
                return this;
            }

            /**
             * @command setMinWidth(w)
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinWidth(w) {
                this.$el.dialog('option', 'minWidth', w).dialogExtend();
                return this;
            }

            /**
             * @command setMinSize(h,w)
             * @param {Integer} h - Minimum Height of the widget
             * @param {Integer} w - Minimum Width of the widget
             */
            setMinSize(h, w) {
                this.setMinHeight(h);
                this.setMinWidth(w);
                return this;
            }

            /**
             * @command setResizable(true|false)
             * @param {Boolean} true|false - enables / disables resizability
             */
            setResizable(resize) {
                this.$el.dialog('option', 'resizable', resize).dialogExtend();
                return this;
            }

            /**
             * @command setAutoWidth()
             */
            setAutoWidth() {
                this.$el.dialog('option', 'width', 'auto').dialogExtend();
                return this;
            }

            /**
             * @command setAutoHeigth()
             */
            setAutoHeight() {
                this.$el.dialog('option', 'height', 'auto').dialogExtend();
                return this;
            }


            /**
             * Returns the position of the widget
             * @command getPosition()
             * @returns {Object} - Position of the widget
             */
            getPosition() {
                return this.position;
            }

            /**
             * Returns the size of the widget
             * @command getSize()
             * @returns {Object} - Size of the widget
             */
            getSize() {
                return this.size;
            }

            /**
             * Gets the ID of the widget
             *
             * @command getId()
             * @returns {String} - ID of widget
             */
            getId() {
                return this.props.id;
            }

            /**
             * Returns whether widget is visible or not
             *
             * @command isVisible()
             * @returns {Boolean} - Widget visibility state
             */
            isVisible() {
                return this.visible;
            }

            /**
             * Search obj for the value of node within using path.
             * E.g. If obj = {"tree":{"v":1}} and path is "tree.v", it will
             * search within the obj to find the value of "tree.v", returning object
             * containing {value : val, unit : unit, scale : scale}.
             */
            getState(tree, state) {
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
            }

            getItems(history, name) {
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
            }

            showHistoryMenu(event) {
                var that = this;
                if (this.controller.history.length > 0) {

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
            }

            showContextMenu(event, data) {
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
            }

            /**
             * hides / shows the title bar
             */
            showTitleBar(show) {
                if (show) {
                    this.$el.parent().find(".ui-dialog-titlebar").show();
                } else {
                    this.$el.parent().find(".ui-dialog-titlebar").hide();
                }
                return this;
            }

            updateNavigationHistoryBar() {
                var disabled = "arrow-disabled";
                if (this.getItems(this.controller.history, "controller.history").length <= 1) {
                    if (!$("#" + this.props.id + "-left-nav").hasClass(disabled)) {
                        $("#" + this.props.id + "-left-nav").addClass(disabled);
                        $("#" + this.props.id + "-right-nav").addClass(disabled);
                    }
                } else {
                    if ($("#" + this.props.id + "-left-nav").hasClass(disabled)) {
                        $("#" + this.props.id + "-left-nav").removeClass(disabled);
                        $("#" + this.props.id + "-right-nav").removeClass(disabled);
                    }
                }
            }

            showHistoryNavigationBar(show) {
                var leftNav = $("#" + this.props.id + "-left-nav");
                var rightNav = $("#" + this.props.id + "-right-nav");

                if (show) {
                    if ((leftNav.length == 0) && (rightNav.length == 0)) {

                        var disabled = "";
                        if (this.getItems(this.controller.history, "controller.history").length <= 1) {
                            disabled = "arrow-disabled ";
                        }

                        var that = this;
                        var button = $("<div id='" + this.props.id + "-left-nav' class='" + disabled + "fa fa-arrow-left'></div>" +
                            "<div id='" + this.props.id + "-right-nav' class='" + disabled + "fa fa-arrow-right'></div>").click(function (event) {
                                var historyItems = that.getItems(that.controller.history, "controller.history");
                                var item;
                                if (event.target.id == (that.props.id + "-left-nav") || (that.props.id + "-right-nav")) {
                                    that.executedAction = historyItems.length - 1;
                                }
                                item = historyItems[that.executedAction].action[0];
                                GEPPETTO.Console.executeImplicitCommand(item);
                                $("#" + that.props.id).parent().find(".ui-dialog-title").html(historyItems[that.executedAction].label);
                                event.stopPropagation();
                            });

                        var dialogParent = this.$el.parent();
                        button.insertBefore(dialogParent.find("span.ui-dialog-title"));
                        $(button).addClass("widget-title-bar-button");
                    }
                } else {
                    if (leftNav.is(":visible") && rightNav.is(":visible")) {
                        leftNav.remove();
                        rightNav.remove();
                        this.executedAction = 0;
                    }
                }
            }

            /**
             * hides / shows the exit button
             */
            showCloseButton(show) {
                if (show) {
                    this.$el.parent().find(".ui-dialog-titlebar-close").show();
                } else {
                    this.$el.parent().find(".ui-dialog-titlebar-close").hide();
                }
            }

            addButtonToTitleBar(button) {
                var dialogParent = this.$el.parent();
                dialogParent.find("div.ui-dialog-titlebar").prepend(button);
                $(button).addClass("widget-title-bar-button");
            }

            addHelpButton() {
                var that = this;
                this.addButtonToTitleBar($("<div class='fa fa-question' title='Widget Help'></div>").click(function () {
                    GEPPETTO.ComponentFactory.addComponent('MDMODAL', {
                        title: that.props.id.slice(0, -1) + ' help',
                        content: that.getHelp(),
                        show: true
                    }, document.getElementById("modal-region"));
                }));
            }

            /**
             * Makes the widget draggable or not
             *
             * @param draggable
             */
            setDraggable(draggable) {
                if (draggable) {
                    this.$el.parent().draggable({ disabled: false });
                    // NOTE: this will wipe any class applied to the widget...
                    this.setClass('');
                } else {
                    this.$el.parent().draggable({ disabled: true });
                    this.setClass('noStyleDisableDrag');
                }
            }

            /**
             * Set background as transparent
             *
             * @param isTransparent
             */
            setTrasparentBackground(isTransparent) {
                if (isTransparent) {
                    this.$el.parent().addClass('transparent-back');
                    this.previousMaxTransparency = true;
                } else {
                    this.$el.parent().removeClass('transparent-back');
                }
                return this;
            }

            /**
             * Inject CSS for custom behaviour
             */
            setClass(className) {
                this.$el.dialog({ dialogClass: className }).dialogExtend();
            }

            /**
             * Perform a jquery ui effect to the widget
             */
            perfomEffect(effect, options, speed) {
                this.$el.parent().effect(effect, options, speed)
            }

            /**
             * Perform a shake effect to the widget
             */
            shake(options, speed) {
                if (options === undefined) {
                    options = { distance: 5, times: 3 }
                }
                if (speed === undefined) {
                    speed = 500
                }

                this.$el.parent().effect('shake', options, speed)
            }

            shouldComponentUpdate() {
                return false;
            }

            componentDidMount() {
                try {
                    super.componentDidMount();
                }
                catch(err) {
                    console.log('Component does not implement component did mount method')
                }

                var that = this;

                //create the dialog window for the widget
                this.dialog = $("#" + this.props.id).dialog(
                    {
                        //appendTo: "#widgetContainer",
                        //autoOpen: false,
                        resizable: true,
                        draggable: true,
                        top: 10,
                        height: 300,
                        width: 350,
                        close(event, ui) {
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
                            "maximize": "fa fa-window-maximize",
                            "minimize": "fa fa-window-minimize",
                            "collapse": "fa  fa-chevron-circle-up",
                            "restore": "fa fa-window-restore",
                        },
                        "load" : function(evt, dlg) {
                            var icons = $("#" + that.props.id).parent().find(".ui-icon");
                            for (var i = 0; i < icons.length; i++) {
                                //remove text from span added by vendor library
                                $(icons[i]).text("");
                            }
                        },
                        "beforeMinimize" : function(evt, dlg) {
                            var label = that.name;
                            label = label.substring(0, 6);
                            that.$el.dialog({ title: label });
                        },
                        "beforeMaximize" : function(evt, dlg) {
                            var divheight = that.size.height;
                            var divwidth = that.size.width;
                            that.previousMaxSize = { width: divwidth, height: divheight };
                        },
                        "minimize" : function(evt, dlg) {
                            that.$el.dialog({ title: that.name });
                        },
                        "maximize" : function(evt, dlg) {
                            that.setTrasparentBackground(false);
                            var divheight = $(window).height();
                            var divwidth = $(window).width();
                            that.$el.dialog({ height: divheight, width: divwidth });
                            $(this).trigger('resizeEnd');
                            that.maximize = true;
                        },
                        "restore" : function(evt, dlg) {
                            if (that.maximize) {
                                that.setSize(that.previousMaxSize.height, that.previousMaxSize.width);
                                $(this).trigger('restored', [that.props.id]);
                            }
                            that.setTrasparentBackground(that.previousMaxTransparency);
                            $(this).trigger('resizeEnd');
                            that.maximize = false;
                            that.collapsed = false;
                        },
                        "collapse" : function(evt, dlg) {
                            that.collapsed = true;
                        }
                    });

                //this.dialog.parent('.ui-dialog').prependTo($('#widgetContainer').find('div'));
                //this.dialog.dialog('open')

                this.$el = $("#" + this.props.id);
                var dialogParent = this.$el.parent();


                //add history
                this.showHistoryIcon(true);

                //remove the jQuery UI icon
                dialogParent.find("button.ui-dialog-titlebar-close").html("");
                dialogParent.find(".ui-dialog-titlebar").find("button").append("<i class='fa fa-close'></i>");


                //Take focus away from close button
                dialogParent.find("button.ui-dialog-titlebar-close").blur();

                //add help button
                this.addHelpButton();

                // initialize content
                this.size = this.state.defaultSize;
                this.position = this.state.defaultPosition;
                this.contextMenu = new GEPPETTO.ContextMenuView();
                this.historyMenu = new GEPPETTO.ContextMenuView();
                this.registeredEvents = [];
                $(this.historyMenu.el).on('click', function (event) {
                    var itemId = $(event.target).attr('id');
                    var registeredItem = that.historyMenu.getClickedItem(itemId);
                    if (registeredItem != null || registeredItem != undefined) {
                        var label = registeredItem["label"];
                        that.title = label;
                        $("#" + that.props.id).parent().find(".ui-dialog-title").html(that.title);
                    }
                });

                window.addEventListener('resize', function (event) {
                    if (that.maximize) {
                        that.maximize = false;
                        that.setSize(window.innerHeight, window.innerWidth);
                        that.$el.trigger('resizeEnd', ["maximize"]);
                        that.maximize = true;
                    }
                });
            }

            /**
             * Register event with widget
             *
             * @command registerEvent(event)
             */
            registerEvent(event, callback) {
                this.registeredEvents.push({ id: event, callback: callback });
            }

            /**
             * Unregister event with widget
             *
             * @command unregisterEvent(event)
             */
            unregisterEvent(event) {
                this.registeredEvents = _.reject(this.registeredEvents, function (el) {
                    return el.id === event
                });
            }

            getHelp() {
                return '### Inline help not yet available for this widget! \n\n' +
                    'Try the <a href="http://docs.geppetto.org/en/latest/usingwidgets.html" target="_blank">online documentation</a> instead.';
            }

            setController(controller) {
                this.controller = controller;
            }

            showHistoryIcon(show) {
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
            }

            /**
             * Renders the widget dialog window
             */
            render() {
                /*return (
                    <div key={this.props.id} id={this.props.id} className='dialog' title={this.props.title}>
                        <WrappedComponent 
                            setName= {this.setName}
                            {...this.props}
                            {...this.state}
                            ref={(c) => this._component = c}/>
                    </div>
                )*/
                return <div key={this.props.id} id={this.props.id} className='dialog' title={this.props.title}> {super.render()} </div>
            }
        };
    }
})
