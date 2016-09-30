define(function(require, exports, module) {
	
	var React = require('react');
	var ReactDOM = require('react-dom');

	require('./vendor/jupyter_widgets');
	
	var PanelComp = require('jsx!components/dev/panel/Panel');
	var CheckboxComp = require('jsx!components/dev/BasicComponents/Checkbox');
	var TextFieldComp = require('jsx!components/dev/BasicComponents/TextField');
	var RaisedButtonComp = require('jsx!components/dev/BasicComponents/RaisedButton');
	
	var $ = require('jquery');
	
	var PanelView = jupyter_widgets.WidgetView.extend({
	    initialize: function (options) {
	        this.options = options || {};
	        this.options.parent = options.parent;
	        this.componentItems = [];
	        
	        PanelView.__super__.initialize.apply(this, arguments);
	    },
	    
        add_item: function(model){
        	var that = this;

        	 var componentView = this.create_child_view(model)
             .then(function(view){
             	return view;
             });
        	 return componentView.then(function(view){
             	return view.getComponent();
               }).then(function(component) {
         		that.componentItems.push(component);
         		return componentView;
         	});
            
        },
        
        forceRender: function () {
        	
	           	 this.componentItems = [];
	           	 
	           	 var that = this;
	           	 Promise.all(this.itemsList.views).then(function(views) {
	
	           		 Promise.all(views.map(function(currentView){
	           			 return currentView.getComponent().then(function(component) {
	            	         		that.componentItems.push(component);
	            	         		return component;
	            	         });
	           			 })).then(function() {
	           				if (that.model.get("embedded") == false){   	 
	           					that.model.get("component").setChildren(that.componentItems);
	           	        	}
	           	        	else{
	           	        		that.options.parent.forceRender();
	           	        	}
	           				 
	           			 });
	           	 });
	        
	        
        },
        
        getComponent: function () {
	        var that = this;
	        return Promise.all(this.itemsList.views).then(function(views) {
	        	return React.createFactory(PanelComp)({id: that.model.get('widget_id'), name: that.model.get('widget_name'), items: that.componentItems, parentStyle: that.model.get('parentStyle')});
    	        //return GEPPETTO.ComponentFactory.getComponent('PANEL', {id: that.model.get('widget_id'), name: that.model.get('widget_name'), items: that.componentItems, parentStyle: that.model.get('parentStyle')});
            });
            
	    },
	    
	    // Render the view.
	    render: function() {
	    	//Serialize single instance
	    	//var items_promise = this.set_Items(this.model.get("items"));
	    	
	    	this.componentItems = [];
	    	
	    	this.itemsList = new jupyter_widgets.ViewList(this.add_item, null, this);
            this.itemsList.update(this.model.get("items"));
            

            var that = this;
            if (this.model.get("embedded") == false){
            	this.getComponent().then(function(component) {
            		that.model.set("component", GEPPETTO.ComponentFactory.renderComponent(component));
            		that.$el = $("#RunControl");
            	});
            }
	    }
	});
	
	var PanelModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
            _model_name: "PanelModel",
            _view_name: "PanelView",
            _model_module: "panel",
            _view_module: "panel",

            items: [],
            component: null
            
        }),
        
        initialize: function() {
        	PanelModel.__super__.initialize.apply(this);
        },
	}, {
        serializers: _.extend({
            items: { deserialize: jupyter_widgets.unpack_models },
        }, jupyter_widgets.WidgetModel.serializers)
    });
	
	var ComponentModel = jupyter_widgets.WidgetModel.extend({
		defaults: _.extend({}, jupyter_widgets.WidgetModel.prototype.defaults, {
	        _model_name: 'ComponentModel',
	        _view_name: 'ComponentView',
	        _model_module: "component",
            _view_module: "component",
            
            sync_value: undefined,
            component: null
	    }),
	    
	    initialize: function() {
	    	ComponentModel.__super__.initialize.apply(this);
        }
	});
	
	var ComponentView = jupyter_widgets.WidgetView.extend({
	    initialize: function (options) {
	        this.options = options || {};
	    	this.options.parent = options.parent;
	        ComponentView.__super__.initialize.apply(this, arguments);
	    },

	    handleClick: function (view) {
	    	var data = {info : 'data sent'}; 
	    	view.send({event: 'click', data: data});
	    },
	    
	    handleChange: function (view, value) {
	    	//TODO: Extract to an specific class (for checkbox component we need to save the value on change)
	    	if (view.model.get('component_name') == 'CHECKBOX'){
	    		view.model.set('sync_value', value);
		    	view.touch();
	    	}
	    	view.send({event: 'change', data: parseFloat(value)});
	    },
	    
	    handleBlur: function (view, value) {
	    	view.model.set('sync_value', value);
	    	view.touch();
	    	view.send({event: 'blur', data: parseFloat(value)});
	    },
	    
	    getComponent: function () {
	    	var componentName = this.model.get('component_name');
	    	var componentItem;
	    	if (componentName == 'RAISEDBUTTON'){
				componentItem = RaisedButtonComp;
			}
			else if (componentName == 'TEXTFIELD'){
				componentItem = TextFieldComp;
			}
			else if (componentName == 'CHECKBOX'){
				componentItem = CheckboxComp;
			}
	    	return Promise.resolve(React.createFactory(componentItem)({id:this.model.get('widget_id'), label:this.model.get('widget_name'), parentStyle:this.model.get('parentStyle'), sync_value: this.model.get('sync_value'), handleClick: this.handleClick.bind(null, this), handleChange: this.handleChange.bind(null, this), handleBlur: this.handleBlur.bind(null, this)}));
	    	//return Promise.resolve(GEPPETTO.ComponentFactory.getComponent(this.model.get('component_name'),{id:this.model.get('widget_id'), label:this.model.get('widget_name'), parentStyle:this.model.get('parentStyle'), sync_value: this.model.get('sync_value'), handleClick: this.handleClick.bind(null, this), handleChange: this.handleChange.bind(null, this), handleBlur: this.handleBlur.bind(null, this)}));
	    },

	    // Render the view.
	    render: function() {
	       var that = this;
	       this.model.on("change:sync_value", function(model, value, options) {
               that.options.parent.forceRender();
           }, that);
	    }
	});
	
	module.exports= {
		PanelView: PanelView,
		PanelModel: PanelModel,
		ComponentView: ComponentView,
		ComponentModel: ComponentModel
    };
});