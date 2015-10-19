var gulp = require('gulp');

//Dependencies
var concat = require('gulp-concat');
var del = require('del');
var imagemin = require('gulp-imagemin');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var imageResize = require('gulp-image-resize');
var inlineCss = require('gulp-inline-css');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var pngquant = require('imagemin-pngquant');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var uncss = require('gulp-uncss');

// Paths to files
var paths = {
    styles: ['src/css/**/*.css'],
    js: ['src/js/*.js'],
    html: ['src/*.html'],
    images: ['src/img/*'],
}

//Clean out build directory
gulp.task('clean-build', function (cb) {
  del(['build/**'], cb);
});

gulp.task('clean', function(cb) {
    del(['dist/css', 'dist/ajs', 'dist/img'], cb)
});



//Compress jpg images
gulp.task('jpg-images', function () {
  return gulp.src(paths.images + '.jpg')
    .pipe(imageminJpegRecompress({loops: 6})())
    .pipe(gulp.dest('build/img'));
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

//Compress and images
gulp.task('resize1440', function () {
  gulp.src(paths.images)
    .pipe(imageResize({
      width : 1440,
      imageMagick: true,
      crop: false,
      upscale : false,
      quality: 0.5
    }))
    .pipe(rename(function (path) { path.basename += "_1440px"; }))
    .pipe(gulp.dest('build/img'));
});

gulp.task('resize100', function () {
  gulp.src(paths.images)
    .pipe(imageResize({
      width : 100,
      imageMagick: true,
      crop: false,
      upscale : false,
      quality: 0.3
    }))
    .pipe(rename(function (path) { path.basename += "_100px"; }))
    .pipe(gulp.dest('build/img'));
});

//Concatenate, remove unused styles and minify css
gulp.task('min-styles', function(){
  return gulp.src(paths.styles)
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(uncss({
      html: ['src/*.html']
      }))
    .pipe(minifyCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'));
});

//Inline css
gulp.task('inline-css', function() {
  return gulp.src('build/*.html')
    .pipe(inlineCss())
    .pipe(gulp.dest('build/'));
});

//Lint js
gulp.task('lint', function() {
  return gulp.src(paths.js)
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
  return gulp.src(paths.js)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js/'));
});

//Watch for changes, run tasks and notify
gulp.task('watch', function(){
  gulp.watch( paths.js, ['min-scripts']);
  gulp.watch( paths.js, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', running js minification ...');
  });
  gulp.watch( paths.styles, ['min-styles']);
  gulp.watch( paths.styles, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', running css minification ...');
  });
  gulp.watch( paths.js, ['lint']);
  gulp.watch( paths.js, function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', linting ...');
  });
  //gulp.watch( paths.images, ['png-images','jpg-images']);
  //gulp.watch( paths.images, function(event) {
  // console.log('File ' + event.path + ' was ' + event.type + ', running image compression ...');
 // });
  gulp.watch( paths.html, ['min-html']);
  gulp.watch( paths.html,  function(event) {
   console.log('File ' + event.path + ' was ' + event.type + ', running html minification ...');
  });

});


//Entire project build sequence
gulp.task('build', function(callback) {
  runSequence(
    //Clean out build directory
 //   'clean-build', <-- causing hang.  Update later
    //Run synchronous tasks
    //['min-html',
	['min-scripts', 'min-styles', 'lint', 'png-images', 'jpg-images'],
    //Inline css
   // 'inline-css',
    //Watch for changes
    'watch',
    callback);
});
//TODO:  Add image resize when image sizes are determined
//TODO:  Fix hang in sequence with clean
//TODO:  Add back inline-css