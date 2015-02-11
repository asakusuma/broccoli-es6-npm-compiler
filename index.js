var transpileES6 = require('broccoli-es6modules');
var browserify = require('./lib/browserify');
var fs = require('fs');
var acorn = require('acorn');
var walkSync = require('walk-sync');
var path = require('path');
var merge = require('broccoli-merge-trees');

function getDirectives(main) {
  var segs = main.split('/');
  var entry = segs.pop();
  return {
    entry: entry,
    parent: segs.join('/')
  };
}

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

function getImports(code) {
  var ast = acorn.parse(code, {
    ecmaVersion: 6
  });
  return {
    local: findImports(ast, function(id) {
      if (id.substring(0,4) !== 'npm:') {
        return id;
      }
    }),
    npm: findImports(ast, function(id) {
      if (id.substring(0,4) === 'npm:') {
        return id.substring(4);
      }
    })
  };
}

module.exports = function(tree) {
  // Read the host package.json
  var p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  // Attempt to pull out main files
  var es6Main = p['jsnext:main'];
  var main = p.main;

  var es6Directives, directives, js;

  var imports = {
    local: [],
    npm: []
  };

  if (es6Main && main) {
    directives = getDirectives(es6Main);
    es6Directives = getDirectives(main);




    walkSync(directives.parent).forEach(function(relativePath) {
      var filePath = path.join(directives.parent, relativePath);
      var extension = filePath.substr(filePath.length - 3);
      if (extension === '.js') {
        var file = fs.readFileSync(filePath, 'utf8');

        var fileImports = getImports(file);

        imports.local = imports.local.concat(fileImports.local);
        imports.npm = imports.npm.concat(fileImports.npm);
      }
    });





    js = new transpileES6(directives.parent, {
      format: 'cjs'
    });
  } else {
    throw 'You must declare a jsnext:main and main file for the module: ' + p.name;
  }

  var bundle = browserify(js, {
    entries: ['./' + directives.entry],
    outputFile: directives.entry, //directives.entry
    browserify: {
      ignore: [],
      standalone: p.name
    },
    npm: imports.npm,
    local: imports.local
  });

  return merge([js, bundle], {
    overwrite: true
  });
}