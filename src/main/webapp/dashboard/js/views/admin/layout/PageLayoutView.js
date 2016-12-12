/**
 *
 * layout based on 3 sections header - content - footer
 *
 */
define([
    'jquery',
    'underscore',
    'backbone',
    '../views/admin/layout/NavigationHeader',
    '../views/admin/layout/EmptyContent',
    'text!templates/layout/simpleTemplate.html' ,
    //dirty hack for handlebars loading wait
    'handlebars'
], function($, _, Backbone,NavigationHeader,EmptyContent,simpleTemplate){

    var PageLayoutView = Backbone.View.extend({

        template : Handlebars.compile(simpleTemplate),
        //defaults to NavigationHeader view function
        headerContent : NavigationHeader,
        //defaults to EmptyContent view function
        mainContent :  EmptyContent,
        //defaults of header options
        headerOptions : {
            el : '#header'
        },
        mainContentOptions : {
            el : '#main'
        },

        initialize : function(options) {

            //instantiate appropriate views based on component functions
            if (options.mainContent != undefined && options.mainContent != null) {
                this.mainContent = options.mainContent;
            }

            if (options.headerContent != undefined && options.headerContent != null) {
                this.headerContent = options.headerContent;
            }
            //copy header options overriding defaults if they are present
            this.headerOptions = $.extend({},this.headerOptions,this.options.headerOptions);
            //copy main content options passed from view of upper level
            this.mainContentOptions = $.extend({},this.mainContentOptions,this.options.mainContentOptions);
        },

        remove : function (attributes) {
            if (!_.isEmpty(this.headerView)) {this.headerView.remove();}
            if (!_.isEmpty(this.mainView)) {this.mainView.remove();}
            Backbone.View.prototype.remove.call(this,attributes);
        },

        render: function(){
            //compile handlebars template with appropriate markup of components
            var html = this.template();
            //append appropriate content to root element right away after compilation
            this.$el.html(html);

            this.headerView = new this.headerContent(this.headerOptions);

            this.mainView = new this.mainContent(this.mainContentOptions);

            this.headerView.render();
            this.mainView.render();

            return this;
        }

    });

    return PageLayoutView;

});
