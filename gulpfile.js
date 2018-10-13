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

let path_to_templates = "src/html";

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: 'dest'
        },
        notify: false,
    });
});

gulp.task('sass', function() {
    return gulp.src('src/sass/**/*.+(scss|sass)')
        .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
        .pipe(rename('main.css'))
        .pipe(gulp.dest('src/html/css'))
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
                    // Соотносим шаблон handlebars с JSON файлом
                    return gulp.src('src/templates/' + path.basename(file.path, '.json') + '.handlebars')
                    // Подставляем в него данные из всех JSON и partials
                        .pipe(hb()
                            .partials('src/partials/*.handlebars')
                            .data(commonData)
                            .data(templateData)
                        )
                        // Переименовываем
                        .pipe(rename({extname: ".html"}))
                        // Отправляем в папку с шаблонами
                        .pipe(gulp.dest(path_to_templates))
                        .on('error', cb)
                        .on('end', cb);
                }));
        }));
    done();
});

gulp.task('inlineCss', function() {
    setTimeout(function() {
        return gulp.src('src/html/*.html')
            .pipe(inlineCss())
            .pipe(gulp.dest('dest/'))
            .pipe(browserSync.reload({stream: true}));
    }, 500)
});

gulp.task('watchHandlebars', function(done) {
    runSequence(
        'handlebars',
        'inlineCss',
        done
    );
});

gulp.task('watchCss', function(done) {
    runSequence(
        'sass',
        'inlineCss',
        done
    );
});

gulp.task('watch', () => {
    gulp.watch('src/**/*.handlebars', ['watchHandlebars']);
    gulp.watch('src/sass/**/*.scss', ['watchCss']);
});

gulp.task('build', function(done) {
    runSequence(
        'sass',
        'handlebars',
        'inlineCss',
        'browserSync',
        done
    );
});

gulp.task('dev', function(done) {
    runSequence(
        'build',
        'watch',
        done
    );
});

