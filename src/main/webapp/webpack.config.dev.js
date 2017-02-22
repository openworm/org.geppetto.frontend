var webpack = require('webpack');
var webpackBaseConfig = require('./webpack.config.js');

function log(req, res, opt) {
    console.log(req);
    console.log(res);
    console.log(opt);
}

webpackBaseConfig.devServer = {
    progress: true,
    colors: true,
    port: 8081,
    inline: true,
    
    proxy: [
//		{ path: '/geppetto', target: 'http://localhost:8081', pathRewrite: {'^/geppetto' : ''}},
		//{ path: '/geppetto', target: 'http://localhost:8080/org.geppetto.frontend', bypass: log },
		{ path: '/geppetto', target: 'http://localhost:8080/org.geppetto.frontend'},
//		{ path: '/GeppettoServlet', target: 'ws://localhost:8080', ws: true},
		{ path: '/org.geppetto.frontend', target: 'ws://localhost:8080', ws: true},
    ],
};

webpackBaseConfig.devtool = 'source-map';

module.exports = webpackBaseConfig;