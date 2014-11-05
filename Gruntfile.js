module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
        dist: {
            src: [
                'scripts/require.js',
                'scripts/jquery.js',
                'scripts/jquery.splendid.textchange.js',
                'scripts/model.js',
                'scripts/view.js',
                'scripts/presenter.js',
                'scripts/main.js'
            ],
            dest: 'scripts/debt-calculator-sample.js',
        }
    },

    uglify: {
        build: {
            src: 'scripts/debt-calculator-sample.js',
            dest: 'scripts/debt-calculator-sample.min.js'
        }
    },

    watch: {
      options: {
        livereload: true,
      },
      css: {
        files: ['styles/*.css'],
      },

      scripts: {
        files: ['scripts/*.js'],
        tasks: ['concat', 'uglify'],
        options: {
            spawn: false,
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['watch']);
};
