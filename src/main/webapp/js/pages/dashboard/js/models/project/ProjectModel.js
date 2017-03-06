define([
    'jquery',
    'underscore',
    'backbone',
    'libs/ginny/ginny'
], function($, _, Backbone){

    var ProjectModel = Backbone.Model.extend({
        id: "",
        url : 'geppettoproject',

        methodToURL: {
            'read': "",
            'create': "api/project",
            'update': "api/project",
            'delete': ""
        },

        initialize: function (options) {
            this.methodToURL['read'] = this.url + "/" + this.id;// + ".json";
            this.methodToURL['delete'] = this.url + "/" + this.id + ".json";
        },

        parse: function(data){
            if (data === undefined || data.experiments === undefined || data.experiments === null || data.experiments.length === 0){
                return data;
            }
			var url = window.location.href;
			if (url.indexOf('/dashboard') > 0) {
				url = url.substring(0, url.indexOf('/dashboard'));
			}
            data.experiments.forEach(function(item){
                if (item.simulationRuns !== undefined && item.simulationRuns !== null && item.simulationRuns.length > 0){
                    item.status = item.simulationRuns[item.simulationRuns.length - 1].status;
                }
                item.url = url + 'geppetto?load_project_from_id=' + data.id + '&experimentId=' + item.id;
                data.projectUrl = url + 'geppetto?load_project_from_id=' + data.id;
                data.deleteUrl = url + '/geppettoproject/delete/' + data.id;
                item.downloadResultsUrl = url +'/geppettoproject/' + data.id + '/experiments/' + item.id+'/downloadResults';
            });
            return data;
        },

        sync: function(method, model, options) {
            options = options || {};
            options.url = model.methodToURL[method.toLowerCase()];

            return Backbone.sync(method, model, options);
        }
    });

    return ProjectModel;
});
