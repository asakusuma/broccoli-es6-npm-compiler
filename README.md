# broccoli-es6-npm-compiler
[Broccoli](http://broccolijs.com/) plugin that compiles ES6 modules along with npm dependencies into a single UMD bundle using [Browserify](https://github.com/substack/node-browserify). The plugin looks for the `jsnext:main` property in your package.json, compiles any ES6 modules to CommonJS modules, browserifies them, and saves the whole thing as single file based on the `main` property of the package.json.

For importing npm modules in your ES6 code, use the `npm:` prefix. For instance, if you wanted to use the [RSVP promise library](https://github.com/tildeio/rsvp.js/), you would import it like so:
```javascript
import npmModule from 'npm:rsvp';

// Use regular syntax for local modules
import myLocalModule from './lib/my-local-module';
```

This prefix, as well as the entire plugin, was inspired by [ember-browserify](https://github.com/ef4/ember-browserify).

## Example

Let's say your package.json looks something like this:
```json
// package.json
{
  "name": "MyModule",
  "main": "exports/my-module.js",
  "jsnext:main": "lib/index.js",
  //...
}

```

Now just add this to your Brocfile:
```javascript
//Brocfile.js
var compileEs6 = require('broccoli-es6-npm-compiler');
var options = {
  globalName: 'MyLibrary',
  amdModuleId: 'MyLibrary'
};
var outputTree = compileEs6(options);
```
Yea, it's that simple. Using `lib/index.js` as the root ES6 module, the plugin will bundle your ES6 code into a file named `my-module.js` in the dist output folder when you run [Broccoli](http://broccolijs.com/).

## Options

**globalName** - Name of global module variable exported via UMD. In other words, window[globalName]. Defaults to `name` in `package.json`.

**amdModuleId** - Module ID of exported AMD module. If undefined, AMD module will be anonymous.