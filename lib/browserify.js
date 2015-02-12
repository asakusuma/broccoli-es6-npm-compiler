var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');
var mkdirp = require('mkdirp');
var browserify = require('browserify')
var BroccoliWriter = require('broccoli-writer');
var deamdify = require('deamdify');
var quickTemp = require('quick-temp');
var derequire = require('browserify-derequire');
var rimraf = require('rimraf');

function createBundle(code, name) {
  return '_' + code + '\nmodule.exports = _require("' + name + '");'
}

function BrowserifyWriter(inputTree, options) {
  options = options || {};

  quickTemp.makeOrRemake(this, '_amd');

  this.options = options;
  this.inputTree = inputTree;
}

BrowserifyWriter.prototype = Object.create(BroccoliWriter.prototype);
BrowserifyWriter.prototype.constructor = BrowserifyWriter;

BrowserifyWriter.prototype.cleanup = function() {
  if (this._amd) {
    rimraf.sync(this._amd);
  }
};

BrowserifyWriter.prototype.write = function (readTree, destDir) {
  var intermediaryFiles = this.options.npmImports.map(function(moduleName){
    var fileName = moduleName.replace('/', '-') + '.js';
    var filePath = path.join(this._amd, fileName);
    var contents = "define('npm:" + moduleName + "', ['" + moduleName + "'], function(theModule){ return { default: theModule['default'] }; });";
    fs.writeFileSync(filePath, contents);
    return {
      name: 'npm:' + moduleName,
      path: filePath
    };
  }.bind(this));

  return readTree(this.inputTree).then(function (srcDir) {
    mkdirp.sync(destDir);

    var browserifyOptions = {};
    browserifyOptions.basedir = srcDir;

    var b = browserify(browserifyOptions).add(this.options.root, {
      expose: this.options.name
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
          fs.writeFileSync(path.join(destDir, this.options.outputFile), createBundle(data, this.options.name));
          resolve(destDir);
        }
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

module.exports = BrowserifyWriter;
