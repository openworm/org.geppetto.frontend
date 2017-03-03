define([
    'jquery',
    'underscore',
    'backbone',
    'models/users/UserSidDetailsModel',
    'text!templates/user/userDetailsTemplate.html' ,
    //dirty hack for handlebars loading wait
    'handlebars',
    'jqueryUI'
], function($, _, Backbone,UserSidDetailsModel,userDetailsTemplate){

    var UserProfileView = Backbone.View.extend({

        template : Handlebars.compile(userDetailsTemplate),

        initialize: function(options){
            this.model = new UserSidDetailsModel();
            _.bindAll(this, 'render', 'renderUser'); // fixes loss of context for 'this' within methods

        },

        render : function() {
            this.model.fetch({success : this.renderUser});
            return this;
        },

        renderUser : function() {
            this.$el.append(this.template(this.model.toJSON()));
            return this;
        }
    });

    return UserProfileView;
});