#### Basic Usage
```javascript
'use strict';

var dust = require('dustjs-linkedin'),
    contextify = require('dustjs-onload-context');


var undo = contextify();
dust.onLoad = function (name, context, cb) {
    var str;

    // context.get('foo');
    // do stuff ...

    cb(null, str);
};
```