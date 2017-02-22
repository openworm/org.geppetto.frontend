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
//        { path: '/api/*', target: dhisConfig.baseUrl, bypass: log },
//        { path: '/dhis-web-commons/*', target: dhisConfig.baseUrl, bypass: log },
//        { path: '/icons/*', target: dhisConfig.baseUrl, bypass: log },
//        { path: '/css/*', target: 'http://localhost:8081/build', bypass: log },
//        { path: '/jquery.min.js', target: 'http://localhost:8081/node_modules/jquery/dist', bypass: log },
//        { path: '/polyfill.min.js', target: 'http://localhost:8081/node_modules/babel-polyfill/dist', bypass: log },
//		{ path: '/geppetto', target: 'http://localhost:8081', pathRewrite: {'^/geppetto' : ''}},
		{ path: '/geppetto', target: 'http://localhost:8080/org.geppetto.frontend'},
//		{ path: '/GeppettoServlet', target: 'ws://localhost:8080', ws: true},
		{ path: '/org.geppetto.frontend', target: 'ws://localhost:8080', ws: true},
    ],
};

webpackBaseConfig.devtool = 'source-map';

module.exports = webpackBaseConfig;