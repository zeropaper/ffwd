'use strict';
/* global describe:false, it:false, before:false, after:false */

var async = require('async');
var expect = require('expect.js');
var utils = require('./../utils');
var schemaOrg = require('./../../lib/db/schema');
var mongoose = schemaOrg.mongoose;

describe('The schemaOrg API', function() {
  function expectSchemaDefinition(schema) {
    expect(schema).to.be.a('object');
  }

  before(function(done) {
    async.series([
      function(cb) {
        mongoose.connect('mongodb://localhost/test-schemaorg', {
          db: { safe: true }
        }, cb);
      },
      function(cb) {
        utils.clearSchemas(mongoose, cb);
      }
    ], done);
  });
  after(function(done) {
    mongoose.disconnect(done);
  });

  describe('The base definition', function() {

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

    it('creates Thing', function(done) {
      schemaOrg('Thing', {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        expectSchemaDefinition(schema);
        done();
      });
    });

    it('creates Event', function(done) {
      schemaOrg('Event', {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        expectSchemaDefinition(schema);
        done();
      });
    });

    it('creates Person and Place', function(done) {
      schemaOrg(['Person', 'Place'], {}, function(err, schema) {
        if (err) {
          return done(err);
        }
        expect(schema).to.be.a('array');
        // expectSchemaDefinition(schema);
        done();
      });
    });
  });

  describe('The custom definition', function() {
    describe('A custom Model with ancestors', function() {
      it('registers Ancestored', function(done) {
        schemaOrg.registerSchema('Ancestored', utils.schemas.Ancestored);
        expect(function() {
          schemaOrg.get('Ancestored');
          done();
        }).not.to.throwError(done);
      });

      it('creates a Model for Ancestored', function(done) {
        schemaOrg('Ancestored', {}, function(err, schema) {
          if (err) {
            return done(err);
          }
          expectSchemaDefinition(schema);
          done();
        });
      });

      it('can create a Model with the definition option', function(done) {
        schemaOrg('Ancestored2', {
          definition: utils.schemas.Ancestored
        }, function(err, schema) {
          if (err) {
            return done(err);
          }
          expectSchemaDefinition(schema);
          expect(schema.paths.custom).to.be.an('object');
          done();
        });
      });
    });

    describe('A custom Model with relations', function() {
      it('registers TestHolder', function(done) {
        try {
          schemaOrg.registerSchema('TestHolder', utils.schemas.TestHolder);
          schemaOrg('TestHolder', {}, function(err) {
            if (err) {
              throw err;
            }
            schemaOrg.mongoose.model('TestHolder');
            done();
          });
        }
        catch (err) {
          // console.info('Error', err.stack);
          return done(err);
        }
      });

      it('registers TestHolded', function(done) {
        try {
          schemaOrg.registerSchema('TestHolded', utils.schemas.TestHolded);
          schemaOrg('TestHolded', {}, function(err) {
            if (err) {
              throw err;
            }
            schemaOrg.mongoose.model('TestHolded');
            done();
          });
        }
        catch (err) {
          // console.info('Error', err.stack);
          return done(err);
        }
      });

      it('creates TestHolder and TestHolded', function(done) {
        schemaOrg(['TestHolded', 'TestHolder'], {}, function(err, schema) {
          if (err) {
            return done(err);
          }
          // expectSchemaDefinition(schema);
          done();
        });
      });

      it('saves a TestHolder with TestHolded documents', function(done) {
        mongoose.model('TestHolder').saveRefs({
          name: 'A TestHolder'
        }, {}, done);
      });
    });

    describe('A custom complex Model', function() {
      it('registers TestComplexHolder', function(done) {
        schemaOrg.registerSchema('TestComplexHolder', utils.schemas.TestComplexHolder);
        expect(function() {
          schemaOrg.get('TestComplexHolder');
          done();
        }).not.to.throwError(done);
      });

      it('creates a Model for TestComplexHolder', function(done) {
        schemaOrg('TestComplexHolder', {}, function(err, schema) {
          if (err) {
            return done(err);
          }
          expectSchemaDefinition(schema);
          done();
        });
      });

      it('saves the document', function(done) {
        // console.info('TestComplexHolder', schemaOrg.get('TestComplexHolder'));
        var TestComplexHolder = mongoose.model('TestComplexHolder');
        TestComplexHolder.saveRefs({
          name: 'Name',
          first: {
            name: 'first.name',
            reference: {
              name: 'first.reference.name'
            }
          },
          second: {
            title: 'Bla',
            references: [
              {
                name: 'second.references.name'
              }
            ]
          }
        }, function(err, saved) {
          if (err) {
            return done(err);
          }
console.info('saved', saved);
          expect(saved.name).to.be('Name');

          // console.info('typeof saved.first.reference', typeof saved.first.reference, saved.first.reference.constructor.name);
          expect(saved.first).to.be.an('object');
          expect(saved.first.name).to.be.a('string');
          expect(saved.first.reference.constructor.name).to.be('ObjectID');
          expect(saved.first.reference.toString).to.be.a('function');
          expect(saved.first.reference.toString()).to.be.ok();

          expect(saved.second).to.be.an('object');
          expect(saved.second.title).to.be.a('string');
          expect(saved.second.references).to.be.an('array');
          expect(saved.second.references[0].constructor.name).to.be('ObjectID');

          done();
        });
      });
    });
  });
});