'use strict';

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const jsonLoader = require('./lib/gulp-json-loader')({
  // sourcePath: __dirname,
  pathHtml: 'src/html',
  pathData: 'src/data',
  report: true,
});

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
