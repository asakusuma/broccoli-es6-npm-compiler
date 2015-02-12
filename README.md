# broccoli-es6-npm-compiler
[Broccoli](http://broccolijs.com/) plugin that compiles ES6 modules along with npm dependencies into a single bundle using [Browserify](https://github.com/substack/node-browserify). The plugin looks for the `jsnext:main` property in your package.json, compiles any ES6 modules to CommonJS modules, browserifies them, and saves the whole thing as single file based on the `main` property of the package.json.

## Example

Let's say your package.json looks something like this:
```json
// package.json
{
  "name": "MyModule",
  "main": "exports/my-module.js",
  "jsnext:main": "lib/index.js"
  ...
}

```

Now just add this to your Brocfile:
```javascript
//Brocfile.js
var compileEs6 = require('broccoli-es6-npm-compiler');

var outputTree = compileEs6();
```
Yea, it's that simple. Using `lib/index.js` as the root ES6 module, the plugin will bundle your ES6 code into a file named `my-module.js` in the dist output folder when you run [Broccoli](http://broccolijs.com/).
