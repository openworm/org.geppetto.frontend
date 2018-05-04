
define(function (require) {

	return function (GEPPETTO) {

		var React = require('react');
		var ReactDOM = require('react-dom');
		var spinner = require('./interface/loadingSpinner/LoadingSpinner.js');

		var WidgetCapability = require('./widgets/WidgetCapability.js');

		GEPPETTO.ComponentFactory = {

			//All the components potentially instantiable go here
			components: {
				'FORM': 'interface/form/Form',
				'PANEL': 'controls/panel/Panel',
				'LOGO': 'interface/logo/Logo',
				'LOADINGSPINNER': 'interface/loadingSpinner/LoadingSpinner',
				'SAVECONTROL': 'interface/save/SaveControl',
				'TOGGLEBUTTON': 'controls/toggleButton/ToggleButton',
				'CONTROLPANEL': 'interface/controlPanel/controlpanel',
				'SPOTLIGHT': 'interface/spotlight/spotlight',
				'MENUBUTTON': 'controls/menuButton/MenuButton',
				'FOREGROUND': 'interface/foregroundControls/ForegroundControls',
				'EXPERIMENTSTABLE': 'interface/experimentsTable/ExperimentsTable',
				'HOME': 'interface/home/HomeControl',
				'SIMULATIONCONTROLS': 'interface/simulationControls/ExperimentControls',
				'CAMERACONTROLS': 'interface/cameraControls/CameraControls',
				'SHARE': 'interface/share/Share',
				'INFOMODAL': 'controls/modals/InfoModal',
				'MDMODAL': 'controls/modals/MarkDownModal',
				'QUERY': 'interface/query/query',
				'TUTORIAL': 'interface/tutorial/Tutorial',
				'PYTHONCONSOLE': 'interface/pythonConsole/PythonConsole',
				'CHECKBOX': 'controls/Checkbox',
				'TEXTFIELD': 'controls/TextField',
				'RAISEDBUTTON': 'controls/RaisedButton',
				'BUTTON': 'controls/button/Button',
				'DICOMVIEWER': 'interface/dicomViewer/DicomViewer',
				'GOOGLEVIEWER': 'interface/googleViewer/GoogleViewer',
				'BIGIMAGEVIEWER': 'interface/bigImageViewer/BigImageViewer',
				'CAROUSEL': 'interface/carousel/Carousel',
				'CANVAS': 'interface/3dCanvas/Canvas',
				'MOVIEPLAYER': 'interface/moviePlayer/MoviePlayer',
				'TREE': 'interface/tree/Tree',
				'CONSOLE': 'interface/console/Console',
				'LINKBUTTON': 'interface/linkButton/LinkButton',
				'BUTTONBAR': 'interface/buttonBar/ButtonBar',
				'DRAWER': 'interface/drawer/TabbedDrawer'
				// 'PLOT': 'interface/plot/Plot',
				// 'POPUP': 'interface/popup/Popup'
			},

			// componentsShortcut : {
			// 	"1": "POPUP"
			// },

			loadSpinner: function () {
				//We require this synchronously to properly show spinner when loading projects
				this.renderComponent(React.createFactory(spinner)(), document.getElementById("load-spinner"));
			},

			componentsMap: {},

			getComponents: function () {
				return this.componentsMap;
			},


			addExistingComponent(componentType, component, override) {
				if (!(componentType in this.componentsMap)) {
					this.componentsMap[componentType] = []
				}
				if (override){
					var componentsMap = this.componentsMap[componentType];
		
					for (var c in componentsMap){
						if (component.id === componentsMap[c].id){
							componentsMap[c] = component;
							// var index =  c;
							return
						}
					}
					
				}
				this.componentsMap[componentType].push(component);
			},

			removeExistingComponent(componentType, component) {
				if (componentType in this.componentsMap) {
					var index = this.componentsMap[componentType].indexOf(component);
					if (index > -1) {
						this.componentsMap[componentType].splice(index, 1);
					}
				}
			},

			getComponentById(componentType, componentId){
				var componentsMap = this.componentsMap[componentType];
				for (var c in componentsMap){
					if (componentId === componentsMap[c].id){
						return componentsMap[c];
					}
				}
				return undefined;
			},


			camelize(str) {
				return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
					if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
					return index == 0 ? match.toUpperCase() : match.toLowerCase();
				});
			},

			/**
			 * Get an available id for an specific widget
			 *
			 * @module WidgetUtility
			 * @param {String} prefix
			 * @param {Array} widgetsList
			 * @returns {String} id - Available id for a widget
			 */
			getAvailableComponentId(componentType) {
				var index = 0;
				var id = "";
				var available;

				var components = [];
				if (componentType in this.componentsMap) {
					components = this.componentsMap[componentType];
				}

				do {
					index++;
					id = componentType + index;
					available = true;

					for (var componentsIndex in components) {
						if (components[componentsIndex].props.id.toUpperCase() == id.toUpperCase()) {
							available = false;
							break;
						}
					}
				}
				while (available == false);

				return this.camelize(id);
			},

			_addComponent: function (componentToAdd, componentType, properties, container, callback, isWidget) {
				// Prepare properties
				if (properties === undefined) {
					properties = {};
				}
				properties.componentType = componentType;
				if (!("id" in properties)) {
					properties["id"] = this.getAvailableComponentId(componentType);
				}
				if (!("isStateless" in properties)) {
					properties["isStateless"] = false;
				}

				if (container == null && isWidget) {
					//FIXME Redundant, see addWidget
					container = document.getElementById('widgetContainer');
				}
				properties["parentContainer"] = container;

				// Create component/widget
				var type = componentToAdd;
				if (isWidget) {
					type = WidgetCapability.createWidget(componentToAdd);
				}
				var component = React.createFactory(type)(properties);

				return component;

			},

			
			
			_createComponent: function (componentType, properties, container, callback, isWidget) {
				var that = this;

	            return new Promise(resolve => {
	            	require.ensure([],function(require){
	            		var cb = function (loadedModule) {
							var component = that._addComponent(loadedModule, componentType, properties, container, callback, isWidget);
							var renderedComponent = that._renderComponent(component, componentType, properties, container, callback, isWidget)
							resolve(renderedComponent);
	            		}
	            		switch(componentType){
		            		case 'FORM': require(['./interface/form/Form'], cb); break;
				            case 'PANEL': require(['./controls/panel/Panel'],cb); break; 
				            case 'LOGO': require(['./interface/logo/Logo'],cb); break;
				            case 'LOADINGSPINNER': require(['./interface/loadingSpinner/LoadingSpinner'],cb); break;
				            case 'SAVECONTROL': require(['./interface/save/SaveControl'],cb); break;
				            case 'TOGGLEBUTTON': require(['./controls/toggleButton/ToggleButton'],cb); break;
				            case 'CONTROLPANEL': require(['./interface/controlPanel/controlpanel'],cb); break;
				            case 'SPOTLIGHT': require(['./interface/spotlight/spotlight'],cb); break;
				            case 'MENUBUTTON': require(['./controls/menuButton/MenuButton'],cb); break;
							case 'FOREGROUND': require(['./interface/foregroundControls/ForegroundControls'],cb); break;
							case 'EXPERIMENTSTABLE': require(['./interface/experimentsTable/ExperimentsTable'],cb); break;
				            case 'HOME': require(['./interface/home/HomeControl'],cb); break;
				            case 'SIMULATIONCONTROLS': require(['./interface/simulationControls/ExperimentControls'],cb); break;
				            case 'CAMERACONTROLS': require(['./interface/cameraControls/CameraControls'],cb); break;
				            case 'SHARE': require(['./interface/share/Share'],cb); break;
				            case 'INFOMODAL': require(['./controls/modals/InfoModal'],cb); break;
				            case 'MDMODAL': require(['./controls/modals/MarkDownModal'],cb); break;
				            case 'QUERY': require(['./interface/query/query'],cb); break;
							case 'TUTORIAL': require(['./interface/tutorial/Tutorial'],cb); break;
							case 'PYTHONCONSOLE': require(['./interface/pythonConsole/PythonConsole'],cb); break;
				            case 'CHECKBOX': require(['./controls/Checkbox'],cb); break;
				            case 'TEXTFIELD': require(['./controls/TextField'],cb); break;
				            case 'RAISEDBUTTON': require(['./controls/RaisedButton'],cb); break;
				            case 'BUTTON': require(['./controls/button/Button'],cb); break;
				            case 'DICOMVIEWER': require(['./interface/dicomViewer/DicomViewer'],cb); break;
				            case 'GOOGLEVIEWER': require(['./interface/googleViewer/GoogleViewer'],cb); break;
				            case 'BIGIMAGEVIEWER': require(['./interface/bigImageViewer/BigImageViewer'],cb); break;
				            case 'CAROUSEL': require(['./interface/carousel/Carousel'],cb); break;
				            case 'CANVAS': require(['./interface/3dCanvas/Canvas'],cb); break;
				            case 'MOVIEPLAYER': require(['./interface/moviePlayer/MoviePlayer'],cb); break;
							case 'TREE': require(['./interface/tree/Tree'],cb); break;
							case 'CONSOLE': require(['./interface/console/Console'],cb); break;
				            case 'LINKBUTTON': require(['./interface/linkButton/LinkButton'],cb); break;
							case 'BUTTONBAR': require(['./interface/buttonBar/ButtonBar'], cb); break;
							case 'DRAWER': require(['./interface/drawer/TabbedDrawer'], cb); break;
	            		}
	            		
					});	
	            });
			},

			_renderComponent: function (component, componentType, properties, container, callback, isWidget) {
				var renderedComponent = window[properties.id] = this.renderComponent(component, container, callback);

				// Register widget/controller for events, etc
				if (isWidget) {
					var widgetController = GEPPETTO.NewWidgetFactory.getController(componentType);
					widgetController.registerWidget(renderedComponent)
				}
				else {
					GEPPETTO.CommandController.updateTags(componentType, renderedComponent);
					renderedComponent.container = container;
				}
				// Register in component map
				if (!(componentType in this.componentsMap)) {
					this.componentsMap[componentType] = []
				}
				this.componentsMap[componentType].push(renderedComponent);
				return renderedComponent;
			},

			addComponent: function (componentType, properties, container, callback) {
				this._createComponent(componentType, properties, container, callback, false);
			},

			addWidget: function (componentType, properties, callback) {
				if (componentType in this.components) {
					if (properties == undefined) {
						properties = {};
					}
					return new Promise(resolve => {
						component = this._createComponent(componentType, properties, document.getElementById('widgetContainer'), callback, true);
						resolve(component);
					});
					
				}
				else {
					var isStateless = false;
					if (properties !== undefined && "isStateless" in properties) {
						isStateless = properties["isStateless"];
					}
					return new Promise(resolve => {
						GEPPETTO.WidgetFactory.addWidget(componentType, isStateless, callback).then(widget => {
							// Register in component map
							if (!(componentType in this.componentsMap)) {
								this.componentsMap[componentType] = []
							}
							this.componentsMap[componentType].push(widget);
							resolve(widget);
						});
					});
				}
			},

			renderComponent: function (component, container, callback) {
				return ReactDOM.render(component, container, callback);
			}
		};
	};
});
