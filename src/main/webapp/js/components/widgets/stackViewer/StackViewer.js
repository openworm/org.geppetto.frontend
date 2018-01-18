/**
 *
 * @module Widgets/stackViewer
 * @author Robbie1977
 */
define(function (require) {

    var Widget = require('../Widget');
    var $ = require('jquery');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var StackViewerComponent = require('./StackViewerComponent');
    
    function arrayUnique(array) {
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }

    return Widget.View.extend({
        variable: null,
        options: null,
        defHeight: 400,
        defWidth: 600,
        data: { id: this.id, height: this.defHeight, width: this.defWidth, instances: [], selected: [] },
        config: {},
        canvasRef: null,
        voxelSize: {x:0.622088, y:0.622088, z:0.622088},

        /**
         * Initialises button bar
         *
         * @param {Object}
         *            options - Object with options for the widget
         */
        /**
         * Initialize the popup widget
         */
        initialize: function (options) {
            Widget.View.prototype.initialize.call(this, options);
            this.render();

            this.stackElement = $("#"+this.id);

            // add container for nested react component
            this.stackElement.append("<div id='stack-container" + this.id + "'></div>");

            this.setSize(this.defHeight, this.defWidth);

            var that = this;
			this.stackElement.bind('resizeEnd', function() {
				that.resize();
			});
			
			window.addEventListener('resize', function(event){
				that.stackElement.find(".fa-home").click();
            });
        },

        setSize: function (h, w) {
            Widget.View.prototype.setSize.call(this, h, w);
            this.data.height = h;
            this.data.width = w;

            this.addBorders();
            this.updateScene();
        },
        
        setVoxel: function (x, y, z) {
            this.voxelSize.x = x;
            this.voxelSize.y = y;
            this.voxelSize.z = z;
            if (this.config.subDomains && this.config.subDomains.length >0 && this.config.subDomains[0].length > 2){
            	this.config.subDomains[0][0] = this.voxelSize.x.toString();
            	this.config.subDomains[0][1] = this.voxelSize.y.toString();
            	this.config.subDomains[0][2] = this.voxelSize.z.toString();
            }
            this.updateScene();
        },
        
        resize : function(){
        	this.data.height = this.stackElement.parent().outerHeight();
        	this.data.width = this.stackElement.parent().outerWidth();
            this.updateScene();
            this.stackElement.find(".fa-home").click();
        },

        /**
         * Sets widget configuration
         *
         * @param config
         */
        setConfig: function(config){
            this.config = config;
            if (this.config.subDomains && this.config.subDomains.length >0 && this.config.subDomains[0].length > 2){
            	this.voxelSize.x = Number(this.config.subDomains[0][0]);
                this.voxelSize.y = Number(this.config.subDomains[0][1]);
                this.voxelSize.z = Number(this.config.subDomains[0][2]);
            }
            this.updateScene();
            // return this for chaining
            return this;
        },

        setCanvasRef: function(ref){
            this.canvasRef = ref;
            this.updateScene();
            return this;
        },

        /**
         * Sets the content of this widget
         * This is a sample method of the widget's API, in this case the user would use the widget by passing an instance to a setData method
         * Customise/remove/add more depending on what widget you are creating
         *
         * @command setData(anyInstance)
         * @param {Object} anyInstance - An instance of any type
         */
        setData: function (data) {
            // console.log('set Data');
            var sel = GEPPETTO.SceneController.getSelection();
            var setSize = false;
            if (data != undefined && data != null) {
                if (data !== this.data || sel !== this.data.selected) {
                    this.removeBorders();
                    if (data.height == undefined) {
                        // console.log('setting default height');
                        data.height = this.data.height;
                    }else{
                        setSize = true;
                    }

                    if (data.width == undefined) {
                        // console.log('setting default width');
                        data.width = this.data.width;
                    }else{
                        setSize = true;
                    }

                    if (data.id == undefined) {
                        data.id = this.id;
                    }

                    this.data = data;

                    this.data.selected = sel;

                    if (setSize) {
                        Widget.View.prototype.setSize.call(this, data.height, data.width);
                    }

                    this.addBorders();
                    this.updateScene();

                }
            } else {
                console.log('set data issue:');
                console.log(JSON.stringify(data));
            }

            return this;
        },

        addSlices: function(instances){
            var curr = this.data.instances.length;
        	if (instances.length == undefined) {
                if (instances.parent) {
                    console.log('Adding ' + instances.parent.getName() + ' to ' + this.data.instances.length);
                }else{
                    console.log('Adding ' + instances.toString() + ' to ' + this.data.instances.length);
                    window.test = instances;
                }
            }else{
                console.log('Adding ' + instances.length + ' instances to ' + this.data.instances.length);
            }
            this.data.instances = arrayUnique(this.data.instances.concat(instances));
            if (curr != this.data.instances.length){
            	console.log('Passing ' + this.data.instances.length + ' instances');
            	this.updateScene();
            }
        },

        removeSlice: function(path){
            console.log('Removing ' + path.split('.')[0] + ' from ' + this.data.instances.length);
            var i;
            for (i in this.data.instances){
                try{
	            	if (this.data.instances[i].parent.getId() == path.split('.')[0]){
	                    this.data.instances.splice(i,1);
	                }
                }catch (ignore){ // handling already deleted instance
                	this.data.instances.splice(i,1);
		}
	    }
            console.log('Passing ' + this.data.instances.length + ' instances');
            this.updateScene();
        },

        updateScene: function(){
        	var originalZIndex = $("#" + this.id).parent().css("z-index");
        	
            ReactDOM.render(
                React.createElement(StackViewerComponent, {
                    data: this.data,
                    config: this.config,
                    voxel: this.voxelSize,
                    canvasRef: this.canvasRef
                }),
                document.getElementById('stack-container' + this.id)
            );
            
            $("#" + this.id).parent().css('z-index', originalZIndex);
        },

        removeBorders: function(){
            this.data.width += 4;
            this.data.height += 22;
        },

        addBorders: function(){
            this.data.width -= 4;
            this.data.height -= 22;
        },
	    
	    getHelp: function(){
       	    return this.helpInfo;
        },

        destroy: function () {
            ReactDOM.unmountComponentAtNode(document.getElementById('stack-container' + this.id));
            Widget.View.prototype.destroy.call(this);
        },
    });
});
