var gulp = require('gulp');

//Dependencies
var concat = require('gulp-concat');
var del = require('del');
var ghPages = require('gulp-gh-pages');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var notify = require('gulp-notify');
var pngquant = require('imagemin-pngquant');
var rename = require("gulp-rename");
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var usemin = require('gulp-usemin');


// Paths to files
var paths = {
    styles: ['src/css/**/*.css', 'src/fonts/css/*.css'],
    alljs: [ 'src/components/jquery/dist/jquery.min.js','src/components/knockout/dist/knockout.js', 'src/js/*.js' ],
    appjs: [ 'src/js/*.js', ],
    html: ['src/*.html'],
    images: ['src/img/*'],
    fonts: ['src/fonts/font/*']
}

//Clean out build directory
gulp.task('clean-build', function (cb) {
  del(['build/**'], cb);
});

//Compress png images
gulp.task('png-images', function() {
  return gulp.src(paths.images + '.png')
    .pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
    }))
  .pipe(gulp.dest('build/img'))
})

//Concatenate and minify css
gulp.task('min-styles', function(){
  return gulp.src(paths.styles)
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'))
    .pipe( notify('CSS task complete!'));
});

//Lint js
gulp.task('lint', function() {
  return gulp.src(paths.appjs)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
});

//Minify html
gulp.task('min-html', function() {
  return gulp.src(paths.html)
    .pipe(minifyHTML({
      empty: true,
      quotes: true
    }))
    .pipe(gulp.dest('build/'));
});

//Minify js
gulp.task('min-scripts', function(){
  return gulp.src(paths.alljs)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js/'));
});

//Transfer fonts to build
gulp.task('fonts', function() {
    return gulp.src(paths.fonts)
     .pipe(gulp.dest('build/font/'));
});

//Send build to GitHub pages
gulp.task('deploy', function() {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

//Watch for changes, run tasks and notify
gulp.task('watch', function(){
  gulp.watch( paths.appjs, ['lint']);
  gulp.watch( paths.appjs, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', linting ...');
  });
  gulp.watch( paths.images, ['png-images']);
  gulp.watch( paths.images, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', running image compression ...');
  });
  gulp.watch( paths.fonts, ['fonts']);
  gulp.watch( paths.images, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', running font transfer ...');
  });
  gulp.watch( [paths.appjs, paths.styles, paths.html], ['usemin'])
  gulp.watch( [paths.appjs, paths.styles, paths.html], function(event) {
     console.log('File ' + event.path + ' was ' + event.type + ', running usemin ...');
  });
});

gulp.task('usemin', function() {
  return gulp.src('src/*.html')
    .pipe(usemin({
      css: [ minifyCSS(), 'concat', rev() ],
      html: [ minifyHTML({ empty: true }) ],
      js: [ uglify(), rev() ],
      inlinejs: [ uglify() ]
    }))
    .pipe(gulp.dest('build/'));
});

//Project build sequence -- RUN gulp clean-build FIRST. Had to remove from sequence because of bug.
gulp.task('build', function(callback) {
  runSequence(
    //Run synchronous tasks
    ['usemin', 'lint', 'png-images', 'fonts'],
	//Set updated file to github.io
	'deploy',
    //Watch for changes
    'watch',
    callback);
});

//TODO: Find better way to clean build directory. Current method doesn't work with runSequence
//TODO: Find alternative for usemin that allows for sourcemaps