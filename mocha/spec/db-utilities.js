var utils = require('../../lib/db/utils');
var fs = require('fs');
var path = require('path');
var expect = require('expect.js');

describe('The utilities', function() {
  describe('atPath()', function() {
    it('access variable using a path', function(done) {
      expect(utils.atPath({
        first: {
          second: 'ok'
        }
      }, 'first.second')).to.be('ok');
      done();
    });

    it('supports array using key.1.key', function(done) {
      expect(utils.atPath({
        first: [{val: 'ok'}]
      }, 'first.0.val')).to.be('ok');
      done();
    });

    it('throw an error when the path does not exists', function(done) {
      expect(function() {
        utils.atPath({}, 'not.existing');
      }).to.throwError();
      done();
    });
  });

  describe('fetchOrRead()', function() {
    var definition;
    var cachePath = path.resolve('../../.test-schema-cache');
    function clean(done) {
      // fails silently
      fs.unlink(cachePath, function() {done();});
    }

    before(clean);
    after(clean);

    it('downloads the online version of the schema and saves it at the specified path', function(done) {
      this.timeout(5000);
      utils.fetchOrRead(cachePath, function(err, result){
        if (err) {
          return done(err);
        }
        definition = result;
        done();
      });
    });

    it('provides a definition from schema.org', function(done) {
      expect(definition).to.be.an('object');
      expect(definition.types).to.be.an('object');
      expect(definition.types.Thing).to.be.an('object');
      done();
    });
  });
});