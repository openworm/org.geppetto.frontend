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
                    useSsl: grunt.option('useSsl'),
                    embedded: grunt.option('embedded'),
                    embedderURL: grunt.option('embedderURL')
                }
            },
            dist: {
                files: {
                    'src/main/webapp/templates/dist/geppetto.vm': ['src/main/webapp/templates/geppetto.vm'],
                    'src/main/webapp/templates/dist/dashboard.vm': ['src/main/webapp/templates/dashboard.vm'],
                    'src/main/webapp/WEB-INF/web.xml': ['src/main/webapp/WEB-INF/web.xml'],
                    'src/main/webapp/templates/dist/GeppettoCoreTests.vm': ['src/main/webapp/templates/GeppettoCoreTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoComponentsTests.vm': ['src/main/webapp/templates/GeppettoComponentsTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoFluidDynamicsTests.vm': ['src/main/webapp/templates/GeppettoFluidDynamicsTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoNeuronalCustomTests.vm': ['src/main/webapp/templates/GeppettoNeuronalCustomTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoNeuronalTests.vm': ['src/main/webapp/templates/GeppettoNeuronalTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoPersistenceTests.vm': ['src/main/webapp/templates/GeppettoPersistenceTests.vm']
                }
            },
            dev: {
                files: {
                    'src/main/webapp/templates/dist/geppetto.vm': ['src/main/webapp/templates/geppetto.vm'],
                    'src/main/webapp/templates/dist/dashboard.vm': ['src/main/webapp/templates/dashboard.vm'],
                    'src/main/webapp/templates/dist/GeppettoCoreTests.vm': ['src/main/webapp/templates/GeppettoCoreTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoFluidDynamicsTests.vm': ['src/main/webapp/templates/GeppettoFluidDynamicsTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoNeuronalCustomTests.vm': ['src/main/webapp/templates/GeppettoNeuronalCustomTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoNeuronalTests.vm': ['src/main/webapp/templates/GeppettoNeuronalTests.vm'],
                    'src/main/webapp/templates/dist/GeppettoPersistenceTests.vm': ['src/main/webapp/templates/GeppettoPersistenceTests.vm']
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