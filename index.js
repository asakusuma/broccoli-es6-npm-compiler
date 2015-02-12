var transpileES6 = require('broccoli-es6modules');
var browserify = require('./lib/browserify');
var fs = require('fs');
var acorn = require('acorn');
var walkSync = require('walk-sync');
var path = require('path');
var umdify = require('broccoli-umd');

function getDirectives(main) {
  var segs = main.split('/');
  var entry = segs.pop();
  return {
    entry: entry,
    parent: segs.join('/')
  };
}

// Given a filter, find import statements that match
function findImports(ast, filter) {
  if (typeof filter !== 'function') {
    filter = function (a) { return a };
  }

  if (ast.type === 'ImportDeclaration') {
    var id = ast.source.value;
    var filtered = filter(id);
    if (filtered) {
      return filtered;
    } else {
      return [];
    }
  } else if(ast.body && ast.body.forEach) {
    var result = [];
    ast.body.forEach(function(ast) {
      result = result.concat(findImports(ast, filter));
    });
    return result;
  } else {
    return [];
  }
};

// Find all the npm imported modules
function getNpmImports(code) {
  var ast = acorn.parse(code, {
    ecmaVersion: 6
  });
  return findImports(ast, function(id) {
    if (id.substring(0,4) === 'npm:') {
      return id.substring(4);
    }
  });
}

module.exports = function(options) {
  options = options || {};
  // Read the host package.json
  var p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  // Attempt to pull out main files
  var es6Main = p['jsnext:main'];
  var main = p.main;

  if (!main) {
    main = es6Main;
  }

  var es6Directives, directives, js, npmImports = [];

  if (es6Main && main) {
    es6Directives = getDirectives(es6Main);
    directives = getDirectives(main);

    walkSync(es6Directives.parent).forEach(function(relativePath) {
      var filePath = path.join(es6Directives.parent, relativePath);
      var extension = filePath.substr(filePath.length - 3);
      if (extension === '.js') {
        var file = fs.readFileSync(filePath, 'utf8');
        var fileNpmImports = getNpmImports(file);

        npmImports = npmImports.concat(fileNpmImports);
      }
    });

    js = new transpileES6(es6Directives.parent, {
      format: 'cjs'
    });
  } else {
    throw 'You must declare a jsnext:main and main file for the module: ' + p.name;
  }

  var cjs = new browserify(js, {
    root: './' + es6Directives.entry,
    outputFile: directives.entry,
    name: p.name,
    npmImports: npmImports
  });

  var umd = umdify([cjs], directives.entry, directives.entry, {
    amdModuleId: options.amdModuleId || null,
    globalAlias: options.globalName || p.name
  });

  return umd;
};