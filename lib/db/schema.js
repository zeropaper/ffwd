// var path = require('path');
// var fs = require('fs');
var path = require('path');
var fs = require('fs');
var async = require('async');
var fetch = require("fetch").fetchUrl;
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

function _iA(v) {
  return v instanceof Array;
}


var extendedProperties = {
  name: {
    count: 1
  },
  url: {
    count: 1
  },
  description: {
    count: 1
  },
  additionalType: {
    count: 1
  },
  additionalType: {
    count: 1
  },
  
  about: {
    count: 1
  },
  author: {
    count: 1
  }
};

var schema = module.exports = function(name, options, callback) {
  // console.info('------- schemaOrg("'+name+'", <'+ typeof options +'>, <'+ typeof callback +'>)');
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
  if (arguments.length == 2) {
    callback = options;
    options = {};
  }

  options = options || {};
  callback = (callback.constructor.name === 'Function' ? callback : function(){});

  if (name.constructor.name === 'Array') {
    return async.map(name, function(n, done) {
      schema(n, options, done);
    }, callback);
    // var n = name.shift();
    // dependencies = dependencies.concat(name);
    // name = n;
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

      for (var p in schemaInfo[name].properties) {
        props[p] = schemaInfo[name].properties[p];
      }
    }

    for (var p in props) {
      if (notThings.indexOf(props[p]) < 0) {
        dependencies = dependencies.concat(props[p]);
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
      schema(depName, options, cb);
    }, function(err, results) {
      var thingSchema = new Schema(mapTypes(definedJSON[name]));
      thingSchema.plugin(supergoose, {instance: mongoose});

      thingSchema.statics.saveRefs = function (doc, options, callback) {
        if (arguments.length === 2) {
          callback = options;
          options = {};
        }
        // console.info(name +'.saveRefs() called', doc, options);
        saveRefs(name, doc, options, callback);
      };
      thingSchema.methods.saveRefs = function(options, callback) {
        var doc = this;
        // console.info(name +' doc.saveRefs() called', doc, options);
        saveRefs(name, doc, options, callback);
      };

      mongoose.model(name, thingSchema);
      defined[name] = thingSchema;
      // console.info('registered', name, 'mongoose schema');
      callback(null, thingSchema);
    });
    return;
  }

  callback(null, defined[name]);
};

function saveRef(schemaName, refDoc, done) {
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
  if (arguments.length === 3) {
    cb = options;
    options = {};
  }
  var cbs = {};
  var paths = schema.get(schemaName).paths;
  var Model = mongoose.model(schemaName);
  
  for (var propName in doc) {
    (function(value) {
      var refModel = propIsRef(schemaName, propName);
      if (!refModel) {
        cbs[propName] = function(propCb) { propCb(null, value); }
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
      // console.info('cbs.'+ propName, cbs[propName]);  
    }(doc[propName]));
  }
  async.series(cbs, done);
}

schema.mongoose = mongoose;
schema.supergoose = supergoose;

function extendSchema(properties) {
  for (var p in properties) {
    _cache.properties[p] = _cache.properties[p];
    for (var pp in properties[p]) {
      _cache.properties[p][pp] = properties[p][pp];
    }
  }
}


function propIsRef(schemaName, propName) {
  var type;
  if (propIsMultiple(schemaName, propName)) {
    type = definedJSON[schemaName][propName][0];
  }
  else {
    type = definedJSON[schemaName][propName];
  }
  return !!mongoose.models[type] ? type : false;
}
schema.propIsRef = propIsRef;

function propIsMultiple(schemaName, propName) {
  if (!propName) {
    return false;
  }
  // console.info('definedJSON.'+schemaName+'.'+propName, definedJSON[schemaName][propName].constructor.name);
  return definedJSON[schemaName]
          && definedJSON[schemaName][propName]
          && definedJSON[schemaName][propName].constructor.name === 'Array';
}
schema.propIsMultiple = propIsMultiple;

schema.registerSchema = function(name, definition, done) {
  schemaInfo[name] = definition;
  if (done) {
    done();
  }
};

// schema.registerSchema('TumblrPost', require('./types/tumblr-post/schema'));
// schema.registerSchema('Media', require('./types/media/schema'));
// schema.registerSchema('File', require('./types/file/schema'));


function fetchOrRead(done) {
  fs.readFile(schema.schemaCachePath, 'utf8', function(err, data) {
    if (err) {
      return fetch('http://schema.rdfs.org/all.json', function(err, meta, body){
        if (err) {
          // console.info('Error while fetching', err.message);
          done(err);
          return;
        }
        fs.writeFile(schema.schemaCachePath, body, 'utf8', function(err) {
          if (err) {
            return done(err);
          }
          fetchOrRead(done);
        });
      });
    }

    try {
      _cache = JSON.parse(data.toString());
      done();
    }
    catch (err) {
      done(err);
    }
  });
}

schema.schemaCachePath = path.resolve('./.schema-cache');

schema.schemaCacheAge = function() {
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
  fetchOrRead(function(err) {
    if (err) {
      return done(err);
    }

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


function mapTypes(obj) {
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
schema.mapTypes = mapTypes;

schema.get = function(name) {
  return definedJSON[name];
}
schema.getProp = function(name) {
  return _cache.properties[name];
};