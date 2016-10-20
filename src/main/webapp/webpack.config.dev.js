var webpack = require('webpack');
var webpackBaseConfig = require('./webpack.config.js');

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
		{ path: '/geppetto', target: 'http://localhost:8081', pathRewrite: {'^/geppetto' : ''}},
		{ path: '/org.geppetto.frontend', target: 'http://localhost:8080'},
		{ path: '/org.geppetto.frontend', target: 'ws://localhost:8080', ws: true},
    ],
};

module.exports = webpackBaseConfig;