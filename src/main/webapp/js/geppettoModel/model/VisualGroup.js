/**
 * Client class use to represent a VisualGroup Node, used for visualization tree
 * properties.
 *
 * @module nodes/VisualGroup
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {

    var ObjectWrapper = require('./ObjectWrapper');
    var VisualGroupElement = require('./VisualGroupElement');


    function VisualGroup(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.visualGroupElements = (options.visualGroupElements != undefined) ? options.visualGroupElements : [];
        this.tags = (options.tags != undefined) ? options.tags : [];
    };

    VisualGroup.prototype = Object.create(ObjectWrapper.prototype);
    VisualGroup.prototype.constructor = VisualGroup;


    /**
     * Get low spectrum color
     *
     * @command VisualGroup.getLowSpectrumColor()
     * @returns {String} Low Spectrum Color
     */
    VisualGroup.prototype.getLowSpectrumColor = function () {
        return this.wrappedObj.lowSpectrumColor;
    };

    /**
     * Get high spectrum color of visual group
     *
     * @command VisualGroup.getHighSpectrumColor()
     * @returns {String} High Spectrum color of visual gorup
     */
    VisualGroup.prototype.getHighSpectrumColor = function () {
        return this.wrappedObj.highSpectrumColor;
    };

    /**
     * Get this visual group children
     *
     * @command VisualGroup.getTags()
     * @returns {List<String>} All tags for this visual group
     */
    VisualGroup.prototype.getTags = function () {
        return this.tags;
    };

    /**
     * Get this visual group children
     *
     * @command VisualGroup.getVisualGroupElements()
     * @returns {List<Object>} All children e.g. Visual Group Element Nodes
     */
    VisualGroup.prototype.getVisualGroupElements = function () {
        return this.visualGroupElements;
    };

    VisualGroup.prototype.getChildren = function () {
        return this.visualGroupElements;
    };


    VisualGroup.prototype.show = function (mode, instances) {
        var message;
        var elements = this.getVisualGroupElements();

        if (instances == undefined) {
            var instances = GEPPETTO.ModelFactory.getAllInstancesOf(this.getParent());
        }

        if (mode) {
            message = GEPPETTO.Resources.SHOWING_VISUAL_GROUPS + this.id;
        }
        else {
            message = GEPPETTO.Resources.HIDING_VISUAL_GROUPS + this.id;
        }

        if (elements.length > 0) {
            this.showAllVisualGroupElements(elements, mode, instances);
        } else {
            message = GEPPETTO.Resources.NO_VISUAL_GROUP_ELEMENTS;
        }

        return message;
    };

    VisualGroup.prototype.showAllVisualGroupElements = function (elements, mode, instances) {
        var groups = {};
        var allElements = [];

        var total = 0;


        for (var i=0; i<elements.length; i++) {
            if (elements[i].getValue() != null) {
                total = total + parseFloat(elements[i].getValue());
                allElements.push(elements[i].getValue());
            }
        }

        this.minDensity = Math.min.apply(null, allElements);
        this.maxDensity = Math.max.apply(null, allElements);

        //highlight all reference nodes
        for (var j=0; j<elements.length; j++) {
            groups[elements[j].getId()] = {};
            var color = elements[j].getColor();
            if (elements[j].getValue() != null) {
                var intensity = 1;
                if (this.maxDensity != this.minDensity) {
                    intensity = (elements[j].getValue() - this.minDensity) / (this.maxDensity - this.minDensity);
                }

                color = GEPPETTO.Utility.rgbToHex(255, Math.floor(255 - (255 * intensity)), 0);
            }
            groups[elements[j].getId()].color = color;
        }

        GEPPETTO.SceneController.showVisualGroups(groups, mode, instances);
    };

    VisualGroup.prototype.getMinDensity = function () {

        var allElements = [];

        var elements = this.getVisualGroupElements();

        //calculate mean;
        for (var i=0; i<elements.length; i++) {
            if (elements[i].getValue() != null) {
                allElements.push(elements[i].getValue());
            }
        }

        return (allElements.length == 0) ? null : Math.min.apply(null, allElements);
    };

    VisualGroup.prototype.getMaxDensity = function () {
        var allElements = [];

        var elements = this.getVisualGroupElements();

        //calculate mean;
        for (var i=0; i<elements.length; i++) {
            if (elements[i].getValue() != null) {
                allElements.push(elements[i].getValue());
            }
        }

        return (allElements.length == 0) ? null : Math.max.apply(null, allElements);
    };

    /**
     * Print out formatted node
     */
    VisualGroup.prototype.print = function () {
        return "Name : " + this.getName() + "\n" + "    Id: " + this.getId() + "\n"
            + "    Type : " + this.getType() + "\n"
            + "    HighSpectrumColor : " + this.getHighSpectrumColor() + "\n"
            + "    LowSpectrumColor : " + this.getLowSpectrumColor() + "\n";
    };

    return VisualGroup;

});
