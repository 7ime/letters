'use strict';

const gulp = require('gulp');
const hb = require('gulp-hb');
const rename = require('gulp-rename');
const through = require('through2');
const path = require('path');

var path_to_dist = "dest/";
var path_to_templates = "src/html";

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

gulp.task('build', gulp.parallel('handlebars'), (done) => {
    done();
});

gulp.task('watch', () => {
    gulp.watch('src/*.handlebars', gulp.parallel('handlebars'));
});
