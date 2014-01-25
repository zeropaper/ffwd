var path = require('path');
var async = require('async');
var expect = require('expect.js');
var utils = require('./../utils');
var libDir = './../../lib';

var schemaOrg = require(libDir +'/db/schema');
var mongoose = schemaOrg.mongoose;
var Schema = mongoose.Schema;

for (var r in require.cache) {
  if (r.split('goose').length > 1 || r.split('fullstack/lib').length > 1) {
    delete require.cache[r];
  }
}

schemaOrg = require(libDir +'/db/schema');

mongoose = schemaOrg.mongoose;
supergoose = schemaOrg.supergoose;
Schema = mongoose.Schema;

describe('The database fixtures', function(done) {
  before(function(done) {
    async.series([
      function(cb) {
        mongoose.connect('mongodb://localhost/test-fixtures', {
          db: { safe: true }
        }, cb);
      },
      function(cb) {
        utils.clearSchemas(mongoose, cb);
      }
    ], done);
  });
});