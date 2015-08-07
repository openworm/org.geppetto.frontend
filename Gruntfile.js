module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            development: {
                options: {
                    compress: false,
                    yuicompress: false,
                    optimization: 2
                },
                files: {
                    // target.css file: source.less file
                    'src/main/webapp/css/main.css': 'src/main/webapp/less/main.less'
                }
            }
        },
        processhtml: {
            options: {
                data: {
                    contextPath: grunt.option('contextPath'),
                    useSsl: grunt.option('useSsl')
                }
            },
            dist: {
                files: {
                    'src/main/webapp/templates/dist/geppetto.vm': ['src/main/webapp/templates/geppetto.vm'],
                    'src/main/webapp/templates/dist/geppettotests.vm': ['src/main/webapp/templates/geppettotests.vm'],
                    'src/main/webapp/templates/dist/dashboard.vm': ['src/main/webapp/templates/dashboard.vm'],
                    'src/main/webapp/WEB-INF/web.xml': ['src/main/webapp/WEB-INF/web.xml']
                }
            },
            dev: {
                files: {
                    'src/main/webapp/templates/dist/geppetto.vm': ['src/main/webapp/templates/geppetto.vm'],
                    'src/main/webapp/templates/dist/dashboard.vm': ['src/main/webapp/templates/dashboard.vm'],
                    'src/main/webapp/templates/dist/geppettotests.vm': ['src/main/webapp/templates/geppettotests.vm']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-processhtml');

    // Default task(s).
    grunt.registerTask('default', ['less', 'processhtml:dev']);
    grunt.registerTask('dist', ['less', 'processhtml:dist']);

};