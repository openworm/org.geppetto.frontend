
/**
 * Popup Widget
 *
 * @module Widgets/Popup
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

	var Widget = require('../Widget');
	var $ = require('jquery');
	var Type = require('../../../geppettoModel/model/Type');
	var React = require('react');
	var ReactDOM = require('react-dom');
	var ButtonBarComponent = require('./ButtonBarComponent');

	var anchorme = require('anchorme');
	var slick = require('slick-carousel');

	require("./Popup.less");
	require("./vendor/slick.less");
	require("./vendor/slick-theme.less");

	/**
	 * Private function to hookup custom event handlers
	 *
	 * NOTE: declared here so that it's private.
	 */
	var hookupCustomHandlers = function (handlers, popupDOM, popup) {
		for (var i = 0; i < handlers.length; i++) {
			// if not hooked already, then go ahead and hook it
			if (handlers[i].hooked === false) {
				// set hooked to avoid double triggers
				handlers[i].hooked = true;

				// Find and iterate <a> element with an instancepath attribute
				popupDOM.find("a[instancepath]").each(function () {
					var fun = handlers[i].funct;
					var ev = handlers[i].event;
					var metaType = handlers[i].meta;
					var path = $(this).attr("instancepath").replace(/\$/g, "");
					var node;

					try {
						node = eval(path);
					} catch (ex) {
						// if instance path doesn't exist set path to undefined
						node = undefined;
					}

					// hookup IF domain type is undefined OR it's defined and it matches the node type
					if (metaType === undefined || (metaType !== undefined && node !== undefined && node.getMetaType() === metaType)) {
						// hookup custom handler
						$(this).on(ev, function () {
							// invoke custom handler with instancepath as arg
							fun(node, path, popup);

							// stop default event handler of the anchor from doing anything
							return false;
						});
					}
				});
			}
		}
	};

	return Widget.View.extend({

		data: null,
		buttonBarConfig: null,
		buttonBarControls: null,
		buttonBar: null,

		/**
		 * Initialize the popup widget
		 */
		initialize: function (options) {
			Widget.View.prototype.initialize.call(this, options);
			this.render();
			this.setSize(100, 300);
			this.customHandlers = [];
			//set class pop up
			var selector = $("#" + this.id);
			selector.addClass("popup");
		},

		/**
		 * Sets the message that is displayed inside the widget
		 *
		 * @command setMessage(msg)
		 * @param {String} msg - The message that is displayed inside the widget
		 */
		setRawMessage: function (msg) {
			$("#" + this.id).html(msg);
			GEPPETTO.CommandController.log("Set new Message for " + this.id, true);

			if (this.customHandlers.length > 0) {
				// msg has changed, set hooked attribute on handlers to false
				for (var i = 0; i < this.customHandlers.length; i++) {
					this.customHandlers[i].hooked = false;
				}

				// trigger routine that hooks up handlers
				hookupCustomHandlers(this.customHandlers, $("#" + this.id), this);
				GEPPETTO.CommandController.log("Hooked up custom handlers for " + this.id, true);
			}

			return this;
		},

		/**
		 * Sets the message that is displayed inside the widget
		 *
		 * @command setMessage(msg)
		 * @param {String} msg - The message that is displayed inside the widget
		 */
		setMessage: function (msg) {
			this.data = msg;
			this.setRawMessage(msg);
			// track change in state of the widget
			this.dirtyView = true;

			return this;
		},

		/**
		 * Sets the message that is displayed inside the widget through an instance of type Text
		 *
		 * @command setText(textInstance)
		 * @param {Object} textInstance - An instance of type Text
		 */
		setText: function (textNode) {
			return this.setMessage(this.getVariable(textNode).getInitialValues()[0].value.text);
		},

		/**
		 * Sets the message that is displayed inside the widget through an instance of type HTML
		 *
		 * @command setHTML(htmlInstance)
		 * @param {Object} htmlInstance - An instance of type HTML
		 */
		setHTML: function (htmlNode) {
			if ($.isArray(htmlNode)) {
				var html = "";
				for (var i in htmlNode) {
					var values = this.getVariable(htmlNode[i]).getInitialValues();
					html += values[0].value.html;
				}
				this.setMessage(html);
			} else {
				this.setMessage(this.getVariable(htmlNode).getInitialValues()[0].value.html);
			}
		},


		/**
		 * Sets the message that is displayed inside the widget through an instance of any type.
		 *
		 * @command setData(anyInstance)
		 * @param {Object} anyInstance - An instance of any type
		 */

		setData: function (anyInstance, filter) {
			this.controller.addToHistory(anyInstance.getName(), "setData", [anyInstance, filter], this.getId());

			this.data = [anyInstance, filter];

			this.setRawMessage(this.getHTML(anyInstance, "", filter));
			var changeIcon = function (chevron) {
				if (chevron.hasClass('fa-chevron-circle-down')) {
					chevron.removeClass("fa-chevron-circle-down").addClass("fa-chevron-circle-up");
				}
				else {
					chevron.removeClass("fa-chevron-circle-up").addClass("fa-chevron-circle-down");
				}
			};
			$("#" + this.getId() + ' .popup-title').click(function (e) {
				changeIcon($($(e.target).attr("data-target") + "_chevron"));
			});
			$("#" + this.getId() + " .popup-chevron").click(function (e) {
				changeIcon($(e.target));
			});
			$("#" + this.getId() + " .slickdiv").slick();

			if (this.buttonBarConfig != null && this.buttonBarConfig != undefined) {
				this.renderButtonBar();
			}

			if (this.collapsed) {
				this.$el.dialogExtend("collapse");
			}

			// track change in state of the widget
			this.dirtyView = true;

			return this;
		},

		/**
		 *
		 * @param anyInstance
		 * @returns {string}
		 */
		getHTML: function (anyInstance, id, filter) {
			var anchorOptions = {
				"attributes": {
					"target": "_blank",
					"class": "popup_link"
				},
				"html": true,
				ips: false,
				emails: true,
				urls: true,
				TLDs: 20,
				truncate: 0,
				defaultProtocol: "http://"
			};
			var type = anyInstance;
			if (!(type instanceof Type)) {
				type = anyInstance.getType();
			}
			var html = "";

			//let's check the filter
			if (filter != undefined && type.getMetaType() != GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
				if ($.inArray(type.getMetaType(), filter) == -1) {
					//this type is not in the filter!
					return html;
				}
			}

			if (type.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
				for (var i = 0; i < type.getVariables().length; i++) {
					var v = type.getVariables()[i];

					if (filter != undefined) {
						if ($.inArray(v.getType().getMetaType(), filter) == -1) {
							//this type is not in the filter!
							continue;
						}
					}

					var id = this.getId() + "_" + type.getId() + "_el_" + i;
					if (filter == undefined) {
						//Titles are only displayed if there's no filter..maybe random, make it a separate parameter
						html += "<div class='popup-title' data-toggle='collapse' data-target='#" + id + "'>" + v.getName() + "</div><div id='" + id + "_chevron" + "' data-toggle='collapse' data-target='#" + id + "' class='popup-chevron fa fa-chevron-circle-down '></div>"
					}
					html += this.getHTML(v, id, filter);
				}
			}
			else if (type.getMetaType() == GEPPETTO.Resources.HTML_TYPE) {
				var value = this.getVariable(anyInstance).getInitialValues()[0].value;
				html += "<div id='" + id + "' class='collapse in popup-html'>" + value.html + "</div>";
			}
			else if (type.getMetaType() == GEPPETTO.Resources.TEXT_TYPE) {
				var value = this.getVariable(anyInstance).getInitialValues()[0].value;
				html += "<div id='" + id + "' class='collapse in popup-text'>" + anchorme(value.text, anchorOptions) + "</div>";
			}
			else if (type.getMetaType() == GEPPETTO.Resources.IMAGE_TYPE) {
				if (this.getVariable(anyInstance).getInitialValues()[0] != undefined) {
					var value = this.getVariable(anyInstance).getInitialValues()[0].value;
					if (value.eClass == GEPPETTO.Resources.ARRAY_VALUE) {
						//if it's an array we use slick to create a carousel
						var elements = "";
						for (var j = 0; j < value.elements.length; j++) {
							var image = value.elements[j].initialValue;
							elements += "<div class='popup-slick-image'>" + image.name + "<a href='' instancepath='" + image.reference + "'><img  class='popup-image' src='" + image.data + "'/></a></div>";
						}
						html += "<div id='" + id + "' class='slickdiv popup-slick collapse in' data-slick='{\"fade\": true,\"centerMode\": true, \"slidesToShow\": 1, \"slidesToScroll\": 1}' >" + elements + "</div>";
					}
					else if (value.eClass == GEPPETTO.Resources.IMAGE) {
						//otherwise we just show an image
						var image = value;
						html += "<div id='" + id + "' class='popup-image collapse in'><a href='' instancepath='" + image.reference + "'><img  class='popup-image' src='" + image.data + "'/></a></div>";
					}
				}
			}
			return html;
		},

		/**
		 * Returns the variable for a node or variable node
		 *
		 * @command getVariable(node)
		 * @param {Object} variable - A variable
		 */
		getVariable: function (node) {
			if (node.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
				return node.getVariable();
			}
			else {
				return node;
			}
		},

		/**
		 * Sets a custom handler for a given event for nodes that point to nodes via instancePath attribute on HTML anchors.
		 *
		 * @command addCustomNodeHandler(funct, eventType)
		 * @param {function} funct - Handler function
		 * @param {String} eventType - event that triggers the custom handler
		 */
		addCustomNodeHandler: function (funct, eventType, metaType) {
			var addHandler = true;
			for (var i = 0; i < this.customHandlers.length; i++) {
				if (eventType == this.customHandlers[i].event) {
					addHandler = false;
				}
			}
			if (addHandler) {
				this.customHandlers.push({ funct: funct, event: eventType, meta: metaType, hooked: false });

				// trigger routine that hooks up handlers
				hookupCustomHandlers(this.customHandlers, $("#" + this.id), this);

				// track change in state of the widget
				this.dirtyView = true;
			}
			return this;
		},

		renderButtonBar: function () {
			var that = this;
			var buttonBarContainer = 'button-bar-container-' + this.id;
			var barDiv = 'bar-div-' + this.id;
			if (this.buttonBar != null) {
				ReactDOM.unmountComponentAtNode(document.getElementById(barDiv));
				$("#" + buttonBarContainer).remove();
			}

			this.$el.parent().append("<div id='" + buttonBarContainer + "' class='button-bar-container'><div id='" + barDiv + "' class='button-bar-div'></div></div>");

			var instance = null;
			var instancePath = '';

			if (this.buttonBarConfig.filter != null && this.buttonBarConfig.filter != undefined) {
				if (this.data != null && this.data != undefined) {
					instance = this.buttonBarConfig.filter(this.data);
					instancePath = instance.getPath();
				}
			}
			var originalZIndex = $("#" + this.id).parent().css("z-index");
			this.buttonBar = ReactDOM.render(
				React.createElement(ButtonBarComponent, {
					buttonBarConfig: this.buttonBarConfig, showControls: this.buttonBarControls,
					instancePath: instancePath, instance: instance, geppetto: GEPPETTO, resize: function () { that.setSize(that.size.height, that.size.width); }
				}),
				document.getElementById(barDiv)
			);

			$("#" + this.id).parent().css('z-index', originalZIndex);
		},

		setButtonBarControls: function (controls) {
			this.buttonBarControls = controls;
			// track change in state of the widget
			this.dirtyView = true;
		},

		setButtonBarConfiguration: function (configuration) {
			this.buttonBarConfig = configuration;
			if (this.data != null || this.data != undefined) {
				this.renderButtonBar();
			}

			// if the user clicks outside this popup hide color pickers if visible
			var popupSelector = $("#" + this.id);
			$(document).click(function (e) {
				if (!popupSelector.is(e.target) // if the target of the click isn't the container...
					&& popupSelector.has(e.target).length === 0 // ... nor a descendant of the container
					&& !$(e.target).parents('.colorpicker').length > 0 // ... and it's not a child of a color picker
				) {
					// hide color picker (it's place in the body so we can't restrict the search) if any
					$('.colorpicker-visible').addClass('colorpicker-hidden').removeClass('colorpicker-visible');
				}
			});

			// track change in state of the widget
			this.dirtyView = true;
		},

		destroy: function () {
			var bar = document.getElementById('bar-div-' + this.id);
			if (bar != null || bar != undefined) {
				ReactDOM.unmountComponentAtNode(bar);
			}
			Widget.View.prototype.destroy.call(this);
		},

		getView: function () {
			var baseView = Widget.View.prototype.getView.call(this);

			// add data-type and data field + any other custom fields in the component-specific attribute
			baseView.dataType = (typeof this.data == "string") ? "string" : "object";

			if ($.isArray(this.data))
				baseView.data = [this.data[0].getPath(), this.data[1]]
			else
				baseView.data = this.data;

			baseView.componentSpecific = {
				customHandlers: this.customHandlers.map(function (item) {
					return {
						funct: item.funct.toString(),
						event: item.event,
						metType: item.metType
					}
				}),
				buttonBarControls: this.buttonBarControls,
				buttonBarConfig: this.buttonBarConfig
			};

			return baseView;
		},

		setView: function (view) {
			// set data
			if (view.data != undefined) {
				if (view.dataType == 'string') {
					this.setMessage(view.data);
				} else if (view.dataType == 'stringCommand') {
					this.setMessage(eval(view.data));
				}
				else if ($.isArray(view.data)) {
					this.setData(eval(view.data[0]), view.data[1]);
				} else {
					// it's an object
					this.setData(view.data);
				}
			}

			// set base properties after setting data so navigation history is correct
			Widget.View.prototype.setView.call(this, view);

			// set component specific stuff, only custom handlers for popup widget
			if (view.componentSpecific != undefined) {
				if (view.componentSpecific.customHandlers != undefined) {
					for (var i = 0; i < view.componentSpecific.customHandlers.length; i++) {
						this.addCustomNodeHandler(
							eval("(" + view.componentSpecific.customHandlers[i].funct + ")"),
							view.componentSpecific.customHandlers[i].event,
							view.componentSpecific.customHandlers[i].metaType
						);
					}
				}

				if (view.componentSpecific.buttonBarControls != undefined && view.componentSpecific.buttonBarConfig != undefined) {
					this.setButtonBarControls(view.componentSpecific.buttonBarControls);
					this.setButtonBarConfiguration(view.componentSpecific.buttonBarConfig);
				}
			}

			// after setting view through setView, reset dirty flag
			this.dirtyView = false;
		}
	});
});
