var filter = require('broccoli-filter')

function Package (inputTree, options) {
  if (!(this instanceof Package)) return new Package(inputTree, options)
  filter.call(this, inputTree, options)
  this.options = options || {};
  this.options.extensions = this.options.extensions || ['js'];
  this.extensions = this.options.extensions;
}

Package.prototype = Object.create(filter.prototype);
Package.prototype.constructor = Package;

Package.prototype.processString = function (string) {

  var amdId = this.options.amdModuleId || '[]';

  var open = '(function (root, factory) { var artifact = factory();'
  open += "if (typeof define === 'function' && define.amd) { define('" + amdId + "', function () { return artifact; }); }";
  open += "if (typeof exports === 'object') { module.exports = artifact; }";
  
  if (this.options.globalAlias) {
    open += "root['" + this.options.globalAlias + "'] = artifact;"
  }

  open += '}(this, function () {' + string + '}));';

  return open;
}

module.exports = Package;