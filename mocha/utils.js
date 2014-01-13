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

  Ancestored: {
    ancestors:['Person'],
    properties: {
      custom: 'Mixed'
    }
  }
}

utils.request = require('supertest');

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