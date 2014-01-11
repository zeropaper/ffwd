var path = require('path');
var assert = require('assert');
var libDir = './../../lib';
var schemaOrg = require(libDir +'/db/schema');
var mongoose = schemaOrg.mongoose;
var Schema = mongoose.Schema;

describe('The database layer', function() {

  before(function(done) {
    mongoose.connect('mongodb://localhost/test-relations', {
      db: { safe: true }
    }, done);
  });
  after(function(done) {
    mongoose.disconnect(done);
  });

  it('defines mongoose.model', function(done) {
    assert.ok(typeof mongoose.model === 'function', 'is function');
    done();
  });

  describe('The things schema', function() {
    it('produces a mongoose schema instance', function(done) {
      this.timeout(5000);
      schemaOrg('Thing', {}, done);
    });

    it('is defined', function(done) {
      assert.ok(typeof schemaOrg !== 'undefined', 'is '+ typeof schemaOrg);
      done();
    });

    it('defines the Thing Model', function(done) {
      assert.doesNotThrow(function() {
        mongoose.model('Thing');
        done();
      }, function() {
        done();
      });
    });
  });
});