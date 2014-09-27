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
                    "src/main/webapp/css/main.css": "src/main/webapp/less/main.less"
                }
            }
        },
        processhtml: {
            dist: {
                files: {
                    'src/main/webapp/index.html': ['src/main/webapp/index.html']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-processhtml');

    // Default task(s).
    grunt.registerTask('default', ['less', 'processhtml:dist']);

};