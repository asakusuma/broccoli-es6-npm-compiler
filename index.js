var fs = require('fs');
var path = require('path');
var transpileES6 = require('broccoli-es6modules');
var merge = require('broccoli-merge-trees');
var CachingWriter = require('broccoli-caching-writer');
var broccoliBrowserify = require('broccoli-browserify');
var walkSync = require('walk-sync');
var path = require('path');
var acorn = require('acorn');

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
  init: function(inputTrees, options) {
    
  },

  updateCache: function(srcPaths, destDir) {
    //var result = new transpileES6(merge(srcPaths));
    srcPaths.forEach(function(rootPath) {
      walkSync(rootPath).forEach(function(relativePath) {
        var filePath = path.join(rootPath, relativePath);
        var extension = filePath.substr(filePath.length - 3);
        if (extension === '.js') {
          var file = fs.readFileSync(filePath, 'utf8');

          var npmImports = getImports(file);

          console.log(npmImports);
        }
      }.bind(this));
    });
  }
});

module.exports = function(tree) {

  var js = new transpileES6(tree, {
    format: 'cjs'
  });
  var complete = new injectNpmDepedencies(js);

  return complete;
}