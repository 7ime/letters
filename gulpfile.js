'use strict';

const gulp              = require('gulp');
const hb                = require('gulp-hb');
const through           = require('through2');
const path              = require('path');
const runSequence       = require('run-sequence');

const browserSync       = require('browser-sync');
const sass              = require('gulp-sass');
const inlineCss         = require('gulp-inline-css');

const notify            = require('gulp-notify');
const rename            = require('gulp-rename');
const concat            = require('gulp-concat');

const fs                = require('fs');
const replace           = require('gulp-replace');


const dest = "dest/emails";

const config = {
  destImg: dest + '/img',
};

gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: dest
    },
    notify: false,
  });
});

gulp.task('sass', function() {
  return gulp.src('src/sass/global.scss')
    .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
    .pipe(rename('main.css'))
    .pipe(gulp.dest('src/templates/css'))
    .pipe(browserSync.reload({stream: true}));
});

//сборка шаблонов
gulp.task('handlebars', (done) => {
  // JSON файл общий для всех проектов
  gulp.src('src/main.json')
    .pipe(through.obj(function(file, enc, cb) {
      // Парсим и данные заносим в переменную commonData
      let commonData = JSON.parse(file.contents.toString());
      // JSON файл с данными по каждому шаблону
      gulp.src('src/json/*.json')
        .pipe(through.obj(function(file, enc, cb) {
          // Парсим и данные заносим в переменную templateData
          let templateData = JSON.parse(file.contents.toString());
          // Map the handlebars template to a JSON file
          return gulp.src('src/templates/' + path.basename(file.path, '.json') + '.handlebars')
            .pipe(hb()
              .partials('src/partials/*.handlebars')
              .data(commonData)
              .data(templateData)
            )
            .pipe(rename({extname: ".html"}))
            .pipe(inlineCss({
              removeStyleTags: true,
              removeHtmlSelectors: true
            }))
            .pipe(replace(/<!--HEAD([\s\S]*?)HEAD-->/g, function(match, inner) {
              return inner;
            }))
            .pipe(gulp.dest(dest))
            .on('error', cb)
            .on('end', cb);
        }));
    }));
  done();
});

gulp.task('img', function() {
  return gulp.src('src/img/**')
    .pipe(gulp.dest(config.destImg))
});

gulp.task('watchHandlebars', function(done) {
  runSequence(
    'handlebars',
    done
  );
});

gulp.task('watchCss', function(done) {
  runSequence(
    'sass',
    'handlebars',
    done
  );
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.json', ['watchHandlebars']);
  gulp.watch('src/**/*.handlebars', ['watchHandlebars']);
  gulp.watch('src/sass/**/*.scss', ['watchCss']);
});

gulp.task('build', function(done) {
  runSequence(
    'img',
    'sass',
    'handlebars',
    done
  );
});

gulp.task('dev', function(done) {
  runSequence(
    'img',
    'sass',
    'handlebars',
    'browserSync',
    'watch',
    done
  );
});