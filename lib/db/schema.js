// var path = require('path');
// var fs = require('fs');
var path = require('path');
var fs = require('fs');
var async = require('async');
var fetch = require('fetch').fetchUrl;
var utils = require('./utils');
var definedJSON = {};
var defined = {};

// for (var r in require.cache) {
  // console.info('require.cache', r, r.split('goose').length > 1, r.split('fullstack/lib').length > 1);
//   if (r.split('goose').length > 1 || r.split('fullstack/lib').length > 1) {
    // console.info('----------------clearing', r);
//     delete require.cache[r];
//   }
// }

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var supergoose = require('supergoose');
var typesMap = {
  Array:    Array,
  Boolean:  Boolean,
  Date:     Date,
  DateTime: Date,
  Number:   Number,
  Integer:  Number,
  Float:    Number,
  Text:     String,
  String:   String,
  URL:      String,
  Time:     Date,
  Mixed:    Schema.Types.Mixed,
  ObjectId: Schema.Types.ObjectId
};
var notThings = [];
for (var t in typesMap) {
  notThings.push(t);
}

var schemaInfo = {};

var _cache;

function propIsMultiple(schemaName, propPath) {
  'use strict';
  if (!propPath) {
    return false;
  }
  // console.info('definedJSON.'+schemaName+' # '+propPath, definedJSON[schemaName][propPath].constructor.name);
  var prop = utils.atPath(definedJSON[schemaName], propPath);
  return prop && prop.constructor.name === 'Array';
}

function propIsRef(schemaName, propPath) {
  'use strict';
  var type;
  var prop = utils.atPath(definedJSON[schemaName], propPath);
  if (propIsMultiple(schemaName, propPath)) {
    type = prop[0];
  }
  else {
    type = prop;
  }
  return !!mongoose.models[type] ? type : false;
}

function isPlainObject(obj) {
  // Not plain objects: params that are not [[Class]] "[object Object]", DOM nodes, window
  if (typeof obj === 'string' ||
      typeof obj === 'array' ||
      typeof obj === 'number' ||
      typeof obj === 'undefined') {
    return false;
  }

  // Firefox 17+ will throw on host objects. ie window.location
  try {
    if (obj.constructor &&
      !{}.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
          return false;
    }
  }
  catch(e) {
    return false;
  }

  return obj === Object( obj );
}

function propIsNested(schemaName, propPath) {
  'use strict';
  var prop = utils.atPath(definedJSON[schemaName], propPath);
  return prop && isPlainObject(prop);
}

function saveRef(schemaName, refDoc, done) {
  'use strict';
  var where = {};
  var upsert = true;
  var Model = mongoose.model(schemaName);

  if (!refDoc) {
    return done();
  }

  if (typeof refDoc === 'string') {
    where._id = refDoc;
    upsert = false;
  }
  else if (refDoc._id) {
    where._id = refDoc._id;
  }
  
  if (!Object.keys(where).length) {
    return Model.create(refDoc, function(err, saved) {
      done(err, saved ? saved._id : null);
    });
  }
  
  Model.findOrCreate(where, refDoc, {upsert: upsert}, function(err, saved) {
    done(err, saved ? saved._id : null);
  });
}

function saveRefs(schemaName, doc, options, done) {
  'use strict';
  if (arguments.length === 3) {
    done = options;
    options = {};
  }
  var cbs = {};

  var scope;
  if (options.path) {
    scope = doc;
    var parts = options.path.split('.');
    if (parts.length >= 2) {
      for (var pa in parts) {
        if (scope[parts[pa]]) {
          scope = scope[parts[pa]];
        }
        else {
          return done(new Error('The path "'+ options.path +'" can not be accessed in the document.'));
        }

      }
    }
    else {
      scope = scope[options.path];
    }

    // var altScope = utils.atPath(doc, options.path);
    // console.info('scopes?????????', options.path, '\n'+ JSON.stringify(altScope, null, 2), '\n'+ JSON.stringify(scope, null, 2));
    // scope = utils.atPath(doc, options.path);
  }
  else {
    scope = doc;
  }
  console.info('--------------------------------', options.path, doc === scope, '---------------------------------');
  


  for (var propName in scope) {
    /* jshint loopfunc: true */
    (function(value) {

      var propPath = (options.path ? options.path +'.' : '');
      var refModel = propIsRef(schemaName, propPath + propName);
    
      if (!refModel) {
        if (propIsNested(schemaName, propPath + propName)) {
          // console.info(schemaName+' # '+propName+' has NO model abd is nested', scope[propName]);

          // cbs[propName] = function(propCb) {
          //   console.info(schemaName+' # '+propPath+' scope '+ propName, JSON.stringify(scope[propName], null, 2));
          //   // console.info(schemaName+' # '+propPath+' is nested');
          //   saveRefs(schemaName, doc, {path: propPath + propName}, function(err, res) {
          //     if (err) {
          //       console.info('nested prop error', err.stack);
          //       return propCb(err);
          //     }
          //     // console.info('propCb for nested', res);
          //     propCb(null, res);
          //   });
          // };
          console.info('nested', propPath + propName, [[value]]);
          cbs[propName] = function(propCb) { propCb(null, value); };
        }
        else {
          cbs[propName] = function(propCb) { propCb(null, value); };
        }
      }
      else if (propIsMultiple(schemaName, propName)) {
        cbs[propName] = function(propCb) {
          async.map(value || [], function(subDoc, cb) {
            saveRef(schemaName, subDoc, cb);
          }, propCb);
        };
      }
      else {
        cbs[propName] = function(propCb) {
          saveRef(schemaName, value, propCb);
        };
      }
    }(scope[propName]));
  }

  async.series(cbs, done);
}

function registerSchema(name, definition, done) {
  'use strict';
  schemaInfo[name] = definition;
  if (done) {
    done();
  }
}

function mapTypes(obj) {
  'use strict';
  var returned = {};
  for (var k in obj) {
    var type = obj[k];
    
    if (type instanceof Array) {
      // returned[k] = mapTypes(obj[k]);
      var ref = type[0];
      if (!typesMap[ref]) {
        ref = {type: typesMap.ObjectId, ref: ref};
      }
      returned[k] = [ref];
    }
    // else if (obj[k].constructor.name === 'Object') {
    //   returned[k] = mapTypes(obj[k]);
    // }
    else if (typesMap[type]) {
      returned[k] = typesMap[type];
    }
    else {
      returned[k] = {type: Schema.Types.ObjectId, ref: type};
    }
  }

  // console.info('mapped types', returned);

  for (var p in returned) {
    if (returned[p +'s']) {
      delete returned[p +'s'];
    }
  }

  return returned;
}

var schema = module.exports = function(name, options, callback) {
  'use strict';
  // console.info('------- schemaOrg("'+name+'", <'+ typeof options +'>, <'+ typeof callback +'>)');
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw new Error('You need to pass a callback.');
  }

  if (!name.length) {
    console.info('name passed', name);
    throw new Error('The first argument must be a string or array of strings.');
  }

  options = options || {};

  if (options.clear) {
    console.info('========= clear the schema JSON cache ===============');
    delete options.clear;
    _cache = null;
  }
  
  if (!_cache) {
    return schema.fetch(function(err) {
      if (err) {
        return callback(err);
      }
      // console.info('JSON fetched, creating', name);
      schema(name, options, callback);
    });
  }

  var dependencies = [];
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  callback = (callback.constructor.name === 'Function' ? callback : function(){});

  if (name.constructor.name === 'Array') {
    return async.map(name, function(n, done) {
      schema(n, options, done);
    }, callback);
    // var n = name.shift();
    // dependencies = dependencies.concat(name);
    // name = n;
  }

  if (options.definition) {
    schema.registerSchema(name, options.definition);
  }

  if (!defined[name] && mongoose.models[name]) {
    // console.info('======================SHIT '+name +' '+ !!defined[name] +' DEFINED!!=====================');
    // return callback(null, mongoose.models[name].schema);
    defined[name] = mongoose.models[name].schema;
  }

  if (!defined[name]) {
    defined[name] = {};
    var props = {};
    
    if (schemaInfo[name]) {
      if (schemaInfo[name].ancestors) {
        for (var a in schemaInfo[name].ancestors) {
          var ancestor = schemaInfo[name].ancestors[a];
          for (var p in schemaInfo[ancestor].properties) {
            props[p] = schemaInfo[ancestor].properties[p];
          }
        }
      }

      for (var pa in schemaInfo[name].properties) {
        props[pa] = schemaInfo[name].properties[pa];
      }
    }

    for (var pr in props) {
      if (notThings.indexOf(props[pr]) < 0) {
        dependencies = dependencies.concat(props[pr]);
      }
    }
    dependencies = dependencies.filter(function (e, i, dependencies) {
      return !typesMap[e] && !defined[e] && dependencies.lastIndexOf(e) === i;
    });

    definedJSON[name] = props;
    // console.info('schema dependencies for', name, dependencies);
    async.map(dependencies, function(depName, cb) {
      if (defined[depName]) {
        return cb(null, defined[depName]);
      }
      // if (definedJSON[depName]) {
      if (typeof depName === 'string') {
        return schema(depName, options, cb);
      }
      cb();
    }, function(err) {
      var thingSchema = new Schema(mapTypes(definedJSON[name]));
      thingSchema.plugin(supergoose, {instance: mongoose});

      thingSchema.statics.saveRefs = function (doc, options, callback) {
        if (arguments.length === 2) {
          callback = options;
          options = {};
        }
        console.info('statics.saveRefs()', doc);
        saveRefs(name, doc, options, function(err, saved) {
          console.trace();
          console.info('saved references', saved);
          callback(err, saved);
        });
      };
      thingSchema.methods.saveRefs = function(options, callback) {
        var doc = this;
        if (arguments.length === 1) {
          callback = options;
          options = {};
        }
        console.info('methods.saveRefs()');
        saveRefs(name, doc, options, callback);
      };

      mongoose.model(name, thingSchema);
      defined[name] = thingSchema;
      // console.info('registered', name, 'mongoose schema');
      callback(err, thingSchema);
    });
    return;
  }

  callback(null, defined[name]);
};


schema.mongoose = mongoose;
schema.supergoose = supergoose;
schema.propIsMultiple = propIsMultiple;
schema.propIsRef = propIsRef;
schema.propIsNested = propIsNested;



schema.registerSchema = registerSchema;

// schema.registerSchema('TumblrPost', require('./types/tumblr-post/schema'));
// schema.registerSchema('Media', require('./types/media/schema'));
// schema.registerSchema('File', require('./types/file/schema'));


schema.schemaCachePath = path.resolve('./.schema-cache');

schema.schemaCacheAge = function() {
  'use strict';
  var diff = 999999999999999999999999;
  console.info('schema.schemaCachePath', schema.schemaCachePath);
  if (fs.existsSync(schema.schemaCachePath)) {
    var stats = fs.statSync(schema.schemaCachePath);
    diff = (new Date()).getTime() - stats.mtime.getTime();
  }
  console.info('cache age', diff / (1000 * 60 * 60 * 24), 'days');
  return diff;
};

schema.fetch = function(done) {
  'use strict';
  utils.fetchOrRead(schema.schemaCachePath, function(err, schemaDefinition) {
    if (err) {
      return done(err);
    }

    _cache = schemaDefinition;

    for (var t in _cache.types) {
      var type = _cache.types[t];
      var props = {};
      
      for (var p in type.properties) {
        var prop = type.properties[p];
        props[prop] = _cache.properties[prop].ranges[0];
      }

      schema.registerSchema(t, {
        ancestors: type.ancestors || [],
        properties: props
      });
    }
    
    done(null, _cache);
  });
};

schema.mapTypes = mapTypes;

schema.get = function(name) {
  'use strict';
  return definedJSON[name];
};

schema.getProp = function(name) {
  'use strict';
  return _cache.properties[name];
};