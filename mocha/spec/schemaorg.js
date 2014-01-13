var expect = require('expect.js');
var utils = require('./../utils');
var schemaOrg = require('./../../lib/db/schema');
var mongoose = schemaOrg.mongoose;

describe('The schemaOrg API', function() {
  before(function(done) {
    mongoose.connect('mongodb://localhost/test-schemaorg', {
      db: { safe: true }
    }, done);
  });
  after(function(done) {
    mongoose.disconnect(done);
  });

  xdescribe('The base definition', function() {
    function expectSchemaDefinition(schema) {
      expect(schema).to.be.a('object');
    }

    it('has a property schemaCachePath', function(done) {
      expect(schemaOrg.schemaCachePath).to.be.ok();
      done();
    });

    it('comes from an online JSON file', function(done) {
      this.timeout(5000);
      expect(schemaOrg.fetch).to.be.a('function');
      schemaOrg.fetch(function(err, json) {
        expect(err).not.to.be.ok();
        expect(json).to.be.a('object');
        done();
      });
    });

    it('has a method to get the age of the cached JSON file', function(done) {
      expect(schemaOrg.schemaCacheAge).to.be.a('function');
      expect(schemaOrg.schemaCacheAge()).to.be.a('number');
      done();
    });

    it('creates a mongoose Model for Thing', function(done) {
      schemaOrg('Thing', {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        expectSchemaDefinition(schema);
        done();
      });
    });

    it('creates a mongoose Model for Event', function(done) {
      schemaOrg('Event', {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        expectSchemaDefinition(schema);
        done();
      });
    });

    it('creates mongoose Models for Person and Place', function(done) {
      schemaOrg(['Person', 'Place'], {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        console.info('schema', schema);
        // expectSchemaDefinition(schema);
        done();
      });
    });
  });

  describe('The custom definition', function() {
    describe('A custom Model with ancestors', function() {
      it('registers the custom Model for Ancestored', function(done) {
        schemaOrg.registerSchema('Ancestored', utils.schemas.Ancestored);
        expect(function() {
          schemaOrg.mongoose.model('Ancestored');
        }).not.to.throwError();
        done();
      });

      it('creates a mongoose custom Model for Ancestored', function(done) {
        schemaOrg('Thing', {}, function(err, schema) {
          if (err) {
            return done(err);
          }
          expectSchemaDefinition(schema);
          done();
        });
      });
    });

    describe('A custom Model with relations', function() {
      it('registers the custom Model for TestHolder and TestHolded', function(done) {
        schemaOrg.registerSchema('TestHolder', utils.schemas.TestHolder);
        expect(function() {
          schemaOrg.mongoose.model('TestHolder');
        }).not.to.throwError();

        schemaOrg.registerSchema('TestHolded', utils.schemas.TestHolded);
        expect(function() {
          schemaOrg.mongoose.model('TestHolded');
        }).not.to.throwError();
        done();
      });

      it('creates a mongoose custom Models for TestHolder and TestHolded', function(done) {
        schemaOrg(['TestHolded', 'TestHolder'], {}, function(err, schema) {
          if (err) {
            return done(err);
          }
          // expectSchemaDefinition(schema);
          done();
        });
      });
    });
  });
});