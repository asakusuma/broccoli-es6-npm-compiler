var transpileES6 = require('broccoli-es6modules');
var broccoliBrowserify = require('broccoli-browserify');
var fs = require('fs');

/*
var fs = require('fs');
var merge = require('broccoli-merge-trees');
var CachingWriter = require('broccoli-caching-writer');
var walkSync = require('walk-sync');
var path = require('path');
var acorn = require('acorn');
var browserify = require('browserify');
var RSVP = require('rsvp');


function findImports(ast) {
  if (ast.type === 'ImportDeclaration') {
    var id = ast.source.value;
    if (id.substring(0,4) === 'npm:') {
      return id.substring(4);
    } else {
      return [];
    }
  } else if(ast.body) {
    var result = [];
    ast.body.forEach(function(ast) {
      result = result.concat(findImports(ast));
    });
    return result;
  } else {
    return [];
  }
};

function getImports(code) {
  var ast = acorn.parse(code, {
    ecmaVersion: 6
  });
  return findImports(ast);
}

var injectNpmDepedencies = CachingWriter.extend({
  init: function(inputTrees, options) {},
  updateCache: function(srcPaths, destDir) {
    var deferred = RSVP.defer();
    //var result = new transpileES6(merge(srcPaths));
    srcPaths.forEach(function(rootPath) {
      walkSync(rootPath).forEach(function(relativePath) {
        var filePath = path.join(rootPath, relativePath);
        var extension = filePath.substr(filePath.length - 3);
        if (extension === '.js') {
          var file = fs.readFileSync(filePath, 'utf8');

          var npmImports = getImports(file);

          var intermediary = npmImports.map(function(moduleName){
            return "define('npm:" +
              moduleName +
              "', function(){ return { default: require('" +
              moduleName +
              "')};})";
          }).join("\n");

          fs.writeFileSync('./intermediary.js', intermediary);

          var opts = {
            outputFile: './browserify.js',
            fullPaths: true,
            entries: './intermediary.js'
          };
          var b = browserify(opts);
          //b.add('./intermediary.js');

          console.log(intermediary);

          b.bundle(function (err, data) {
            if (err) {
              deferred.reject(err);
            } else {
              fs.writeFileSync(path.join(destDir, 'outfile.js'), data);
              deferred.resolve(destDir);
            }
          });
        }
      }.bind(this));
    });
    return deferred.promise;
  }
});
*/

function getDirectives(main) {
  var segs = main.split('/');
  var entry = segs.pop();
  return {
    entry: entry,
    parent: segs.join('/')
  };
}

module.exports = function(tree) {

  var p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  var es6Main = p['jsnext:main'];
  var main = p.main;

  var directives, js;

  if (es6Main) {
    directives = getDirectives(es6Main);
    js = new transpileES6(directives.parent, {
      format: 'cjs'
    });
  } else if (main) {
    directives = getDirectives(main);
    js = directives.parent;
  } else {
    throw 'You must declare a main file in the module: ' + p.name;
  }

  //var complete = new injectNpmDepedencies(js);

  return broccoliBrowserify(js, {
    entries: ['./' + directives.entry],
    outputFile: 'bundle.js'
  });
}