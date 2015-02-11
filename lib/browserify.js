var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');
var mkdirp = require('mkdirp');
var browserify = require('browserify')
var Writer = require('broccoli-writer');
var deamdify = require('deamdify');
var quickTemp = require('quick-temp');
var derequire = require('browserify-derequire');

function BrowserifyWriter(inputTree, options) {
  options = options || {};

  quickTemp.makeOrRemake(this, '_amd');

  this.entries = options.entries || [];
  this.outputFile = options.outputFile || '/browserify.js';
  this.browserifyOptions = options.browserify || {};
  this.requireOptions = options.require || {};
  this.process = options.process || function() {};
  this.inputTree = inputTree;
  this.npm = options.npm || [];
  this.local = options.local || [];
}

BrowserifyWriter.prototype = Object.create(Writer.prototype);
BrowserifyWriter.prototype.constructor = BrowserifyWriter;

BrowserifyWriter.prototype.write = function (readTree, destDir) {
  var entries = this.entries;
  var outputFile = this.outputFile;
  var browserifyOptions = this.browserifyOptions;
  var requireOptions = this.requireOptions;
  var process = this.process;
  var npmImports = this.npm;
  var localImports = this.local;

  var tempDir = this._amd;

  var intermediaryFiles = npmImports.map(function(moduleName){
    var fileName = moduleName.replace('/', '-') + '.js';
    var filePath = path.join(tempDir, fileName);
    var contents = "define('npm:" + moduleName + "', ['" + moduleName + "'], function(theModule){ return { default: theModule }; });";
    fs.writeFileSync(filePath, contents);
    return {
      name: 'npm:' + moduleName,
      path: filePath
    };
  });

  //.join("\n");

  //fs.writeFileSync(amdPath, intermediary);

  return readTree(this.inputTree).then(function (srcDir) {
    mkdirp.sync(path.join(destDir, path.dirname(outputFile)));

    browserifyOptions.basedir = srcDir;

    var b = browserify(browserifyOptions);

    for (var i = 0; i < entries.length; i++) {
      b.add(entries[i]);
    }

    /*
    for(var i = 0; i < requireOptions.length; i++){
      b.require.apply(b, requireOptions[i]);
    }
    */
    

    for (var i = 0; i < intermediaryFiles.length; i++) {
      var inter = intermediaryFiles[i];
      console.log(inter.name);
      b.require(inter.path, {
        expose: inter.name
      });
    }

    localImports.forEach(function(name) {
      b.exclude(name);
    });

    b.transform(deamdify);

    b.plugin(derequire);

    return new RSVP.Promise(function (resolve, reject) {
      b.bundle(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(path.join(destDir, outputFile), data);
          resolve(destDir);
        }
      });
    });
  });
};

module.exports = BrowserifyWriter;
