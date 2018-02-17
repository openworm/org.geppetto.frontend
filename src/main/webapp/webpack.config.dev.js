var webpackBaseConfig = require('./webpack.config.js');
var extended = webpackBaseConfig();
extended.devServer = {
	progress : true,
	port : 8081,
	inline : true,

	proxy : [ {
		path : '/',
		target : 'http://localhost:8080/'
	}, {
		path : '/geppetto',
		target : 'http://localhost:8080/org.geppetto.frontend'
	}, {
		path : '/org.geppetto.frontend',
		target : 'ws://localhost:8080',
		ws : true
	}, ],
};

extended.devtool = 'source-map';

module.exports = extended;
