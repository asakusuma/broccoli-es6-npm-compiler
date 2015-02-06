var transpileES6 = require('broccoli-es6modules');
var broccoliBrowserify = require('broccoli-browserify');
var fs = require('fs');

function getDirectives(main) {
  var segs = main.split('/');
  var entry = segs.pop();
  return {
    entry: entry,
    parent: segs.join('/')
  };
}

module.exports = function(tree) {
  // Read the host package.json
  var p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  // Attempt to pull out main files
  var es6Main = p['jsnext:main'];
  var main = p.main;

  var directives, js;

  if (es6Main) {
    directives = getDirectives(es6Main);
    js = new transpileES6(directives.parent, {
      format: 'cjs'
    });
  } else {
    throw 'You must declare a jsnext:main file in the module: ' + p.name;
  }

  return broccoliBrowserify(js, {
    entries: ['./' + directives.entry],
    outputFile: 'bundle.js'
  });
}