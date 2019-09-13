module.exports = function(grunt) {

  grunt.initConfig({
    svgstore: {
      options: {
        cleanup: ['fill', 'style'],
        formatting : {
          indent_size : 2
        },
        prefix : 'icon-',
        svg : {
          // viewBox : '0 0 42 42',
          xmlns: 'http://www.w3.org/2000/svg'
        }
      },
      default: {
        files: {
          'src/assets/icons/def.svg': ['src/assets/icons/base/*.svg'],
        },
      },
    },
  });
  grunt.loadNpmTasks('grunt-svgstore');
};
