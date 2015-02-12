var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');
var mkdirp = require('mkdirp');
var browserify = require('browserify')
var Writer = require('broccoli-writer');
var deamdify = require('deamdify');
var quickTemp = require('quick-temp');
var derequire = require('browserify-derequire');

function createBundle(code, name) {
  return '_' + code + '\nmodule.exports = _require("' + name + '");'
}

function BrowserifyWriter(inputTree, options) {
  options = options || {};

  quickTemp.makeOrRemake(this, '_amd');

  this.name = options.name;
  this.root = options.root;
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
  var name = this.name;
  var root = this.root;
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
    var contents = "define('npm:" + moduleName + "', ['" + moduleName + "'], function(theModule){ return { default: theModule['default'] }; });";
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

    browserifyOptions = {};
    browserifyOptions.basedir = srcDir;

    var b = browserify(browserifyOptions).add(root, {
      expose: name
    });

    b.transform(deamdify);    
    b.plugin(derequire);

    for (var i = 0; i < intermediaryFiles.length; i++) {
      var inter = intermediaryFiles[i];
      b.require(inter.path, {
        expose: inter.name
      });
    }

    return new RSVP.Promise(function (resolve, reject) {
      b.bundle(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(path.join(destDir, outputFile), createBundle(data, name));
          resolve(destDir);
        }
      });
    });
  });
};

module.exports = BrowserifyWriter;
