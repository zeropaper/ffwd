var utils = module.exports = {};

utils.schemas = {
  TestHolded: {
    properties: {
      name: 'String',

      boolean: 'Boolean',
      date: 'Date',
      time: 'DateTime',
      mixed: 'Mixed',
      integer: 'Integer',
      number: 'Number',
      float: 'Float',
      text: 'Text',
      string: 'String',
      url: 'URL',
      objectId: 'ObjectId',

      booleanArray: ['Boolean'],
      dateArray: ['Date'],
      timeArray: ['DateTime'],
      mixedArray: ['Mixed'],
      integerArray: ['Integer'],
      numberArray: ['Number'],
      floatArray: ['Float'],
      textArray: ['Text'],
      stringArray: ['String'],
      urlArray: ['URL'],
      objectIdArray: ['ObjectId']
    }
  },
  
  TestHolder: {
    properties: {
      name: 'String',
      single: 'TestHolded',
      multiple: ['TestHolded']
    }
  },
  
  TestComplexHolder: {
    properties: {
      name: 'Text',
      first: {
        name: 'Text',
        reference: 'TestHolded'
      },
      multiple: {
        title: 'Text',
        references: ['TestHolder']
      }
    }
  },

  Ancestored: {
    ancestors:['Person'],
    properties: {
      custom: 'Mixed'
    }
  }
};

utils.clearSchemas = function(mongoose, done) {
  var ok = true;
  var cb = function(err) {
    if (err) {
      ok = false;
      if (done) {
        done(err);
      }
    }
  };

  for (var model in mongoose.models) {
    if (ok) {
      mongoose.model(model).find({}).remove(cb);
    }
  }

  if (ok && done) {
    done();
  }
};

utils.request = require('supertest');

// utils.connect = function(url, options) {
//   return function (done) {
//     function connect(cb) {
//       mongoose.connect(url, options || {
//         db: { safe: true }
//       }, cb);
//     }

//     mongoose = require('../lib/db/schema').mongoose;
    
//     if (mongoose.connection) {
//       mongoose.disconnect(function(err) {
//         if (err) {
//           return done(err);
//         }
//         connect(done);
//       });
//     }
//     else {
//       connect(done);
//     }
//   };
// }

utils.beforeApp = function(app) {
  return function(done) {
    
    done();  
  };
};

utils.afterApp = function(app) {
  return function(done) {
    
    done();  
  };
};

utils.beforeSchema = function(conf) {
  return function(done) {
    
    done();  
  };
};

utils.afterSchema = function(conf) {
  return function(done) {
    
    done();  
  };
};