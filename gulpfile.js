'use strict';

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const jsonLoader = require('./lib/gulp-json-loader')(__dirname);

function html() {
    return gulp.src('src/html/**/*.pug')
        .pipe(plugins.data(jsonLoader))
        .pipe(plugins.pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist'))
    ;
}

exports.html = html;
exports.default = html;
