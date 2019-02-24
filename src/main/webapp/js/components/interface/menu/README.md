The Menu component has as only dependencies React and Material-UI<3.7.

In order to work, the Menu component needs to be given in input 2 props:

* A menu handler, this is a function that contains a switch-case and evaluate what the string
  contained in the action object is and then execute this action with the value provided.
  Later will give you an example of the menu handler with one of the objects contained in list.

* configuration, below an example and then an exaplantion of how this works.

```
var menuConfiguration = {
	global: {
		subMenuOpenOnHover: true,
		menuOpenOnClick: true,
		menuPadding: 2,
		fontFamily: "Khan",
		menuFontSize: "14",
		subMenuFontSize: "12"
	},
	buttons: [
		{
			label: "Window",
			position: "bottom-start",
			list: [
				{
					label: "Info",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["termInfoVisible"]
					}
				},
				{
					label: "3D Viewer",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["canvasVisible"]
					}
				},
				{
					label: "Slice Viewer",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["stackViewerVisible"]
					}
				},
				{
					label: "Search",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["spotlightVisible"]
					}
				},
				{
					label: "Query",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["queryBuilderVisible"]
					}
				},
				{
					label: "Layers",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["controlPanelVisible"]
					}
				},
				{
					label: "Wireframe",
					action: {
						handlerAction: "UIElementHandler",
						parameters: ["wireframeVisible"]
					}
				}
			]
		},
		{
			label: "History",
			position: "bottom-start",
			dynamicListInjector: {
						handlerAction: "historyMenuInjector",
						parameters: ["undefined"]
					}
		}
	]
};
```

The property global at the moment is not implemented, it will be done in a second step and 
it will allow the user to set his own css/style throught these global parameters.

The property button defines the list of buttons the menu will have at the first level.
Each object defined inside the buttons list has the properties below:

** label: defines the name displayed on the button itself.
** position: defines where the window with the full menu expanded for that button has to appear.
            this might be one of the following choices: 'bottom-end', 'bottom-start', 'bottom',
            'left-end', 'left-start', 'left', 'right-end', 'right-start', 'right', 'top-end', 
            'top-start', 'top'.
** list: defines the list of objects that we need to use to populate the 1st level menu, a brief
        explanation of how to fill these elements will be given later.
** dynamicListInjector: if the property 'list' is not provided we can use the property
                        dynamicListInjector and connect this to the menuHandler to feed
						this button with a dynamic list created by the menu handler.
						Down here an example used in Virtual Fly Brain to define a dynamic
						list.
```
            case 'historyMenuInjector': { }
                var historyList = [];
                for (var i = 0; window.historyWidgetCapability.vfbterminfowidget.length > i; i++) {
                    historyList.push(
                        {
                            label: window.historyWidgetCapability.vfbterminfowidget[i].label,
                            icon: "",
                            action: {
                                handlerAction: "triggerSetTermInfo",
                                value: window.historyWidgetCapability.vfbterminfowidget[i].arguments
                            }
                        },
                    );
                }
                return historyList;
```
Here I am creating an array of objects that will respect the same structure we currently use for
the property list described earlier.

Coming back to the list property described earlier, this is an array of objects that define all
the voices in each single menu, each object is composed by:

*** label: just a label to display.

*** action: another object that contains:
**** handlerAction: a string that will be used by the handler function to decide which action has
                    to be executed for this menu item.
                    E.g.:

One of the object contained in the first list.
```
{
	label: "Layers",
	action: {
		handlerAction: "UIElementHandler",
        parameters: ["controlPanelVisible"]
    }
}
```

The whole menuHandler we are currently using in VFB.
```
menuHandler(click) {
        switch (click.handlerAction) {
            case 'UIElementHandler':
                this.buttonBarHandler(click.value);
                break;
            case 'historyMenuInjector': { }
                var historyList = [];
                for (var i = 0; window.historyWidgetCapability.vfbterminfowidget.length > i; i++) {
                    historyList.push(
                        {
                            label: window.historyWidgetCapability.vfbterminfowidget[i].label,
                            icon: "",
                            action: {
                                handlerAction: "triggerSetTermInfo",
                                value: window.historyWidgetCapability.vfbterminfowidget[i].arguments
                            }
                        },
                    );
                }
                return historyList;
            case 'triggerSetTermInfo':
                this.termInfoReference.setTermInfo(click.value[0], click.value[0].getName());
                break;
            default:
                console.log("Menu action not mapped, it is " + click);
        }
        console.log("I clicked in the new menu " + click);
    }
```

In this specific case we will execute the case 'UIElementHandler' and the code contained in it.

**** value: just an array of values that can be provided to the menuHandler and then each case
            decides how to use them.

*** list: each object of the list can contain another list and create a submenu, has many level
          as we like.

*** dynamicListInjector: each object can contain a dynamicListInjector and create a dynamic
                         submenu, same principle explained earlier.