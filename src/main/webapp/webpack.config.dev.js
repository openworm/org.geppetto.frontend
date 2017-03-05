var webpack = require('webpack');
var webpackBaseConfig = require('./webpack.config.js');

webpackBaseConfig.devServer = {
    progress: true,
    colors: true,
    port: 8081,
    inline: true,

    proxy: [
		{ path: '/geppetto', target: 'http://localhost:8080/org.geppetto.frontend'},
		{ path: '/org.geppetto.frontend', target: 'ws://localhost:8080', ws: true},
    ],
};

webpackBaseConfig.devtool = 'source-map';

module.exports = webpackBaseConfig;