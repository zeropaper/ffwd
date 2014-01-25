/**
 * schemaOrg, a set of tools for persistence of data
 * following and extending the definition of [schema.org](http://schema.org)
 *
 * @module schemaOrg
 *
 */

var path = require('path');
var fs = require('fs');
var async = require('async');
var utils = require('./utils');
var _ = utils._;
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

/**
 * @private
 */
var _schemaInfo = {};

/**
 * @private
 */
var _cache;

/**
 * Determine if a property (aka path)
 * is an array of Thing instances
 *
 *
 * @param {string} schemaName - the name of the Thing
 * @param {string} propPath   - the path of the property to test
 * @return {boolean}
 */
function propIsMultiple(schemaName, propPath) {
  'use strict';
  if (!propPath) {
    return false;
  }

  var prop = utils.atPath(definedJSON[schemaName], propPath);
  return prop && prop.constructor.name === 'Array';
}

/**
 * Determine if a property (aka path)
 * is a Thing reference
 *
 *
 * @param {string} schemaName - the name of the Thing
 * @param {string} propPath   - the path of the property to test
 * @return {boolean}
 */
function propIsRef(schemaName, propPath) {
  'use strict';
  var type;
  try {
    var prop = utils.atPath(definedJSON[schemaName], propPath);
  } catch(err) {
    throw new Error('The schema "'+ schemaName +'" does not have a property at "'+ propPath +'"\n'+ JSON.stringify(definedJSON[schemaName], null, 2));
  }
  if (propIsMultiple(schemaName, propPath)) {
    type = prop[0];
  }
  else {
    type = prop;
  }
  // console.info('propIsRef', schemaName, propPath, prop, type);
  return !!mongoose.models[type] ? type : false;
}

/**
 * Determine if a property (aka path)
 * is Plain Object (who might have, deeper, Thing instances)
 *
 * @param {string} schemaName - the name of the Thing
 * @param {string} propPath   - the path of the property to test
 * @return {boolean}
 */
function propIsNested(schemaName, propPath) {
  'use strict';
  var prop = utils.atPath(definedJSON[schemaName], propPath);
  // console.info('schema at', schemaName+'#'+propPath +'\n', definedJSON[schemaName], '\n', _.isObject(prop), '\n', prop);
  return prop && !_.isString(prop) && !_.isArray(prop) && _.isObject(prop);
}

/**
 * Saves a referenced document
 *
 * @param {string} schemaName - the name of the Thing
 * @param {string} refDoc     - the referenced (child) document
 * @param {stringCallback}
 */
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

function propSaveNestedCallback(schemaName, propPath, value) {
  return function(propCb) {
    var cbs = {};
    _.each(value, function(prop, name) {
      cbs[name] = propSaveCallback(schemaName, propPath +'.'+ name, value[name]);
    });
    async.series(cbs, propCb);
  };
}

function propSaveSingleCallback(schemaName, propPath, value) {
  return function(propCb) { saveRef(schemaName, value, propCb); };
}

function propSaveMultipleCallback(schemaName, propPath, value) {
  return function(propCb) {
    async.map(value || [], function(subDoc, cb) {
      saveRef(schemaName, subDoc, cb);
    }, propCb);
  };
}

/**
 * Saves a property 
 *
 * @param {string} schemaName - the name of the Thing
 * @param {string} propPath   - the path of the value within the object
 * @param {Object} value      - the value to save
 * @returns {function}
 */
function propSaveCallback(schemaName, propPath, value) {
  var refModel = propIsRef(schemaName, propPath);

  if (!refModel) {
    if (propIsNested(schemaName, propPath)) {
      return propSaveNestedCallback(schemaName, propPath, value);
    }

    return function(propCb) { propCb(null, value); };
  }

  if (propIsMultiple(schemaName, propPath)) {
    return propSaveMultipleCallback(schemaName, propPath, value);
  }

  return propSaveSingleCallback(schemaName, propPath, value);
}

/**
 * Saves a referenced documents
 *
 * @param {string} schemaName   - the name of the Thing
 * @param {mongoose.Model} doc  - the referencing (parent) document
 * @param {Object} options      - some options
 * @param {arrayStringCallback}
 */
function saveRefs(schemaName, doc, options, done) {
  'use strict';
  if (arguments.length === 3) {
    done = options;
    options = {};
  }
  
  var scope;
  var cbs = {};
  var propPath = (options.path ? options.path +'.' : '');

  if (options.path) {
    scope = utils.atPath(doc, options.path);
  }
  else {
    scope = utils._.clone(doc);
  }

  for (var propName in scope) {
    cbs[propName] = propSaveCallback(schemaName, propPath + propName, scope[propName]);
  }

  async.series(cbs, done);
}

/**
 * Deprecate. Helper to register a JSON definition.
 */
function registerSchema(name, definition, done) {
  'use strict';
  console.warn('Deprecate, use: schemaOrg(name, {definition: { /* your schema */ }}, done) instead');
  _schemaInfo[name] = definition;
  if (done) {
    done();
  }
}

/**
 * Map the JSON definition to a mongoose.Schema definition
 * 
 * @param {Object} obj  - a JSON representation
 * @param {Object}      - a mongoose.Schema compatible representation
 */
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

  for (var p in returned) {
    if (returned[p +'s']) {
      delete returned[p +'s'];
    }
  }

  return returned;
}

var schema = module.exports = function(name, options, callback) {
  'use strict';
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw new Error('You need to pass a callback.');
  }

  if (!name.length) {
    throw new Error('The first argument must be a string or array of strings.');
  }

  options = options || {};

  if (options.clear) {
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
    
    if (_schemaInfo[name]) {
      if (_schemaInfo[name].ancestors) {
        for (var a in _schemaInfo[name].ancestors) {
          var ancestor = _schemaInfo[name].ancestors[a];
          if (ancestor && ancestor.properties) {
            for (var p in _schemaInfo[ancestor].properties) {
              props[p === 'collection' ? '_collection' : p] = _schemaInfo[ancestor].properties[p];
            }
          }
        }
      }

      for (var pa in _schemaInfo[name].properties) {
        props[pa === 'collection' ? '_collection' : pa] = _schemaInfo[name].properties[pa];
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
      if (err) {
        return callback(err);
      }

      var thingSchema;

      try {
        thingSchema = new Schema(mapTypes(definedJSON[name]));
      }
      catch (err) {
        return callback(new Error('Can not register "'+ name +'": '+ err.message));
      }
      thingSchema.plugin(supergoose, {instance: mongoose});

      thingSchema.statics.saveRefs = function (doc, options, callback) {
        if (arguments.length === 2) {
          callback = options;
          options = {};
        }
        saveRefs(name, doc, options, callback);
      };
      thingSchema.methods.saveRefs = function(options, callback) {
        var doc = this;
        if (arguments.length === 1) {
          callback = options;
          options = {};
        }
        saveRefs(name, doc, options, callback);
      };

      mongoose.model(name, thingSchema);
      defined[name] = thingSchema;
      callback(err, thingSchema);
    });
    return;
  }

  callback(null, defined[name]);
};

schema.mongoose =                 mongoose;
schema.supergoose =               supergoose;
schema.propIsMultiple =           propIsMultiple;
schema.propSaveCallback =         propSaveCallback;
schema.propSaveSingleCallback =   propSaveSingleCallback;
schema.propSaveMultipleCallback = propSaveMultipleCallback;
schema.propIsRef =                propIsRef;
schema.propIsNested =             propIsNested;
schema.mapTypes =                 mapTypes;
schema.registerSchema =           registerSchema;
schema.schemaCachePath =          path.resolve('./.schema-cache');
schema.saveRef =                  saveRef;
schema.saveRefs =                 saveRefs;


schema.schemaCacheAge = function() {
  'use strict';
  var diff = 999999999999999999999999;
  if (fs.existsSync(schema.schemaCachePath)) {
    var stats = fs.statSync(schema.schemaCachePath);
    diff = (new Date()).getTime() - stats.mtime.getTime();
  }
  return diff;
};

schema.fetch = function(done) {
  'use strict';
  utils.fetchOrRead(schema.schemaCachePath, function(err, schemaDefinition) {
    if (err) {
      return done(err);
    }

    _cache = schemaDefinition;

    // for (var t in _cache.types) {
    //   var type = _cache.types[t];
    //   var props = {};
      
    //   for (var p in type.properties) {
    //     var prop = type.properties[p];
    //     props[prop] = _cache.properties[prop].ranges[0];
    //   }

    //   schema.registerSchema(t, {
    //     ancestors: type.ancestors || [],
    //     properties: props
    //   });
    // }

    // done(null, _cache);

    async.map(Object.keys(_cache.types), function(t, cb) {
      var type = _cache.types[t];
      var props = {};
      if (!type) {
        return cb(new Error('Undefined type "'+ t +'"'));
      }

      for (var p in type.properties) {
        var prop = type.properties[p];
        props[prop] = _cache.properties[prop].ranges[0];
      }

      _schemaInfo[t] = {
        ancestors: type.ancestors || [],
        properties: props
      };
      
      schema(t, {}, cb);
    }, function(err) {
      done(err, _cache);
    });
    
    
  });
};



/**
 * Get the JSON representation of a mongoose.Schema
 *
 * @param {string} name - the name of the wanted schema
 * @returns {Object}    - a JSON "stringifiable" Object
 */
schema.get = function(name) {
  'use strict';
  return definedJSON[name];
};

/**
 * Get the JSON representation of mongoose.Schema property
 *
 * @param {string} name - the name of the wanted schema property
 * @returns {Object}    - a JSON "stringifiable" Object
 */
schema.getProp = function(name) {
  'use strict';
  return _cache.properties[name];
};