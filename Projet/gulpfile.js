var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var htmlmin = require('gulp-htmlmin');
var sourceSass = './assets/stylesheets/**/*.scss';
var dest = './public';

gulp.task('sass', function () {
    return gulp.src(sourceSass)
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer()) // Add vendor prefixes to CSS rules by Can I Use
        .pipe(cssnano()) // Minify CSS
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest + '/css'));
});


// Static Server + watching SCSS/HTML files
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        proxy: 'localhost:3000'
    });

    gulp.watch(sourceSass, ['sass']).on('change', browserSync.reload);
});



