define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/layout/emptyTemplate.html' ,
    'models/session/SessionModel',
    'bootstrap',
    //dirty hack for handlebars loading wait
    'handlebars'
], function ($, _, Backbone, emptyTemplate, SessionModel) {

    var NavigationHeader = Backbone.View.extend({

        template: Handlebars.compile(emptyTemplate),
        toggleState : false,

        initialize: function () {
            _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
        },

        authorized: function () {
            return SessionModel.getInstance().isAuthorized();
        },

        render: function () {
            //compile handlebars template
            //TODO: make menu items backed by some collection and models
            this.$el.html(this.template());
            return this;
        }

    });
    return NavigationHeader;

})
;