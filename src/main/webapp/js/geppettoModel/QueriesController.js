
/**
 * Controller responsible to execute queries
 *
 * @author Matteo Cantarelli
 */
define(function (require) {
    return function (GEPPETTO) {

        /**
         * @class GEPPETTO.QueriesController
         */
        GEPPETTO.QueriesController =
        {

            /**
             *
             * * Run a set of queries on this datasource
             *
             * @param queries
             * @param callback
             */
            runQuery: function (queries, callback) {
                var compoundQuery=[];
                for (var i=0;i<queries.length;i++) {
                    compoundQuery.push({
                    	targetVariablePath: queries[i].target.getPath().replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT+".", ''), 
                    	queryPath: queries[i].query.getPath().replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT+".", '')});
                }

                var parameters = {};
                parameters["projectId"] = Project.getId();
                parameters["runnableQueries"] = compoundQuery;

                var c=callback;
                GEPPETTO.MessageSocket.send("run_query", parameters, function(data){
                	var queryResults=JSON.parse(data)["return_query_results"];
                	if(c!=undefined){
                		c(queryResults);
                	}
                });
            },


            /**
             * Get the count for a set of queries on this datasource
             *
             * @param queries
             * @param callback
             */
            getQueriesCount: function (queries, callback) {
            	if(queries.length>0){
	                var compoundQuery=[];
	                for (var i=0;i<queries.length;i++) {
	                    compoundQuery.push({
	                    	targetVariablePath: queries[i].target.getPath().replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT+".", ''), 
	                    	queryPath: queries[i].query.getPath().replace(GEPPETTO.Resources.MODEL_PREFIX_CLIENT+".", '')});
	                }
	
	                var parameters = {};
	                parameters["projectId"] = Project.getId();
	                parameters["runnableQueries"] = compoundQuery;
	
	                var c=callback;
	                GEPPETTO.MessageSocket.send("run_query_count", parameters, function(data){
	                	var count=JSON.parse(data)["return_query_count"];
	                	if(c!=undefined){
	                		c(count);
	                	}
	                });
            	}
            	else{
            		callback(0);
            	}
            }
        }
    }

});
