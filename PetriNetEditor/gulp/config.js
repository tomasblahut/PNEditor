'use strict';

var buildTypes = require('./buildTypes');

var CONFIG = {
    buildType: buildTypes.PRODUCTION,
    src: {
        js: ['src/app/**/*.js', '!src/app/**/*.spec.js', '!src/app/**/*_test.js'],
        html: ['src/app/**/*.html'],
        sass: ['src/assets/**/*.scss', 'src/assets/**/*.css'],
        bowerFolder: 'src/bower_components',
        folder: './src/app'
    },
    dest: {
        folder: './dist',
        js: 'js/libs.min.js',
        css: 'css/styles.min.css',
        vendorFolder: 'vendor/'
    },
    injectExclusions: {
        js: ['/workers/**/']
    },
    minificationExclusions: {
        js: ['/utils/**/*.js', '/businessObjects/pnBusiness/**/*.js', '/businessObjects/ssBusiness/**/*.js',
            '/workers/**/*.js', '/config.js']
    }
};

module.exports = CONFIG;