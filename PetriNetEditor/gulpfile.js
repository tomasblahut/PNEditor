"use strict";

// gulp
var gulp = require('gulp');
// modules
var connect = require('gulp-connect'),
    open = require('gulp-open');
var gulpTasks = require('./gulp/tasks.js');
//config
var config = require('./gulp/config.js');

gulp.task('run', ['build', 'watch'], function () {
    connect.server({
        root: 'dist/',
        port: 8888,
        livereload: true
    });
    return gulp.src('')
        .pipe(open({
            uri: 'http://localhost:8888',
            app: 'chrome'
        }));
});

gulp.task('run-devel', ['devel', 'watch-devel'], function () {
    connect.server({
        root: 'dist/',
        port: 8888,
        livereload: true
    });
    return gulp.src('')
        .pipe(open({
            uri: 'http://localhost:8888',
            app: 'chrome'
        }));
});