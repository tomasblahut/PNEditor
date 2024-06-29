"use strict";

var buildTypes = require('./buildTypes');
var
    angularFilesort = require('gulp-angular-filesort'),
    autoprefixer = require('gulp-autoprefixer'),
    bowerMain = require('bower-main'),
    concat = require('gulp-concat'),
    config = require('./config.js'),
    connect = require('gulp-connect'),
    del = require('del'),
    dot = require('dot'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    inject = require('gulp-inject'),
    jshint = require('gulp-jshint'),
    mergeStream = require('merge-stream'),
    minifyCss = require('gulp-minify-css'),
    ngAnnotate = require('gulp-ng-annotate'),
    removeUseStrict = require("gulp-remove-use-strict"),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    streamSeries = require('stream-series'),
    uglify = require('gulp-uglify');

var scriptTemplate = '<script type="text/javascript" src="{{=it.src}}" charset="UTF-8"></script>';
var cssTemplate = '<link href="{{=it.src}}" rel="stylesheet" type="text/css"/>';
var templateFn = dot.template(scriptTemplate);
var cssTemplateFn = dot.template(cssTemplate);

//--------------------------------------------------
// BOWER
//--------------------------------------------------
gulp.task('fonts', function () {
    return gulp.src(config.src.bowerFolder + '/fontawesome/fonts/*.*')
        .pipe(gulp.dest(config.dest.folder + '/' + config.dest.vendorFolder + 'fonts/'));
});

gulp.task('bower-js', function () {
    var jsFiles = bowerMain('js', 'min.js');
    var allJsFiles = jsFiles.minified.concat(jsFiles.minifiedNotFound);
    return gulp.src(allJsFiles)
        .pipe(concat('/js/vendor.min.js'))
        .pipe(gulp.dest(config.dest.folder + '/' + config.dest.vendorFolder));
});

gulp.task('bower-js-devel', function () {
    var jsFiles = bowerMain('js');
    var allJsFiles = jsFiles.normal;
    return gulp.src(allJsFiles)
        .pipe(gulp.dest(config.dest.folder + '/' + config.dest.vendorFolder + '/js'));
});

gulp.task('bower-css', function () {
    var cssFiles = bowerMain('css', 'min.css');
    var allCssFiles = cssFiles.minified.concat(cssFiles.minifiedNotFound);
    return gulp.src(allCssFiles)
        .pipe(concat('/css/vendor.min.css'))
        .pipe(gulp.dest(config.dest.folder + '/' + config.dest.vendorFolder));
});

gulp.task('bower-css-devel', function () {
    var cssFiles = bowerMain('css');
    var allCssFiles = cssFiles.normal;
    return gulp.src(allCssFiles)
        .pipe(gulp.dest(config.dest.folder + '/' + config.dest.vendorFolder + '/css'));
});

gulp.task('bower', ['fonts', 'bower-css', 'bower-js']);

gulp.task('bower-devel', ['fonts', 'bower-css-devel', 'bower-js-devel']);

//--------------------------------------------------
// CSS
//--------------------------------------------------
gulp.task('buildCss-devel', function () {
    return gulp.src(config.src.sass)
        .pipe(autoprefixer())
        .pipe(sass({outputStyle: 'compressed', errLogToConsole: true}))
        .pipe(gulp.dest(config.dest.folder))
        .pipe(connect.reload());
});

gulp.task('buildCss', function () {
    return gulp.src(config.src.sass)
        .pipe(autoprefixer())
        .pipe(sass({outputStyle: 'compressed', errLogToConsole: true}))
        .pipe(minifyCss())
        .pipe(concat(config.dest.css))
        .pipe(gulp.dest(config.dest.folder))
        .pipe(connect.reload());
});
//--------------------------------------------------
// JS
//--------------------------------------------------
gulp.task('buildJs-devel', function () {
    var task = gulp.src(config.src.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest(config.dest.folder))
        .pipe(connect.reload());

    return mergeStream(task);
});

gulp.task('buildJs', function () {
    var minifySrc = [].concat(config.src.js);
    var doNotMinifySrc = [];

    var excludeMinification = config.minificationExclusions.js;
    if (excludeMinification) {
        for (var index = 0; index < excludeMinification.length; index++) {
            var exclusionEntry = excludeMinification[index];
            var exclusionStr = config.src.folder + exclusionEntry;

            doNotMinifySrc.push(exclusionStr);
            minifySrc.push('!' + exclusionStr);
        }
    }

    var minified = gulp.src(minifySrc)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(ngAnnotate({single_quotes: true}))
        .pipe(concat(config.dest.js))
        .pipe(removeUseStrict())
        .pipe(uglify().on('error', gutil.log))
        .pipe(gulp.dest(config.dest.folder));


    var notMinified = gulp.src(doNotMinifySrc, {base: config.src.folder})
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest(config.dest.folder))
        .pipe(connect.reload());

    return mergeStream(notMinified, minified);
});

// --------------------------------------------------
// HTML
// --------------------------------------------------
function getAllSources(fileFormatType) {
    var vendorBase = config.dest.folder + '/' + config.dest.vendorFolder + '/**/*.' + fileFormatType;
    var otherBase = config.dest.folder + '/**/*.' + fileFormatType;
    var appPaths = [otherBase, '!' + vendorBase];

    var injectExclusions = config.injectExclusions[fileFormatType];
    if (injectExclusions) {
        for (var index = 0; index < injectExclusions.length; injectExclusions++) {
            var exclusion = injectExclusions[index];
            appPaths.push('!' + config.dest.folder + exclusion + '*.' + fileFormatType);
        }
    }

    var paths = {
        app: gulp.src(appPaths),
        vendor: gulp.src([vendorBase])
    };

    return paths;
}

gulp.task('buildHtml', function () {
    var jsSrc = getAllSources('js');
    var cssSrc = getAllSources('css');

    var injectJs = inject(streamSeries(jsSrc.vendor.pipe(angularFilesort()), jsSrc.app), {
        starttag: '<!-- inject:js -->',
        endtag: '<!-- endinject -->',
        transform: function (filePath) {
            return templateFn({src: filePath.split('/dist/')[1]});
        }
    });
    var injectCss = inject(streamSeries(cssSrc.vendor, cssSrc.app), {
        starttag: '<!-- inject:css -->',
        endtag: '<!-- endinject -->',
        transform: function (filePath) {
            return cssTemplateFn({src: filePath.split('/dist/')[1]});
        }
    });

    return gulp.src(config.src.html)
        .pipe(injectJs)
        .pipe(injectCss)
        .pipe(gulp.dest(config.dest.folder))
        .pipe(connect.reload());
});

// --------------------------------------------------
// WATCHES
// --------------------------------------------------
gulp.task('watch', function () {
    gulp.watch(config.src.js, ['buildJs']);
    gulp.watch(config.src.html, ['buildHtml']);
    gulp.watch(config.src.sass, ['buildCss']);
});

gulp.task('watch-devel', function () {
    gulp.watch(config.src.js, ['buildJs-devel']);
    gulp.watch(config.src.html, ['buildHtml']);
    gulp.watch(config.src.sass, ['buildCss-devel']);
});
// --------------------------------------------------
// GENERAL
// --------------------------------------------------
gulp.task('clean', function (cb) {
    del([config.dest.folder], cb);
});

gulp.task('devel', function (cb) {
    config.buildType = buildTypes.DEVEL;

    runSequence('clean',
        ['bower-devel', 'buildCss-devel', 'buildJs-devel'],
        'buildHtml',
        cb);
});

gulp.task('build', function (cb) {
    config.buildType = buildTypes.PRODUCTION;

    runSequence('clean',
        ['bower', 'buildCss', 'buildJs'],
        'buildHtml',
        cb);
});
