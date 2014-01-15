var path = require('path');
var assert = require('assert');
var request = require('supertest');
var schemaOrg = require('./../../lib/db/schema');
var mongoose = schemaOrg.mongoose;
var app = require('./../../lib/server')({
}, {
  mongoose: mongoose,
  supergoose: schemaOrg.supergoose
});

describe('the server application', function() {
  it('serves static files', function(done) {
    request(app)
      .get('/robots.txt')
      .expect('Content-type', 'text/plain; charset=UTF-8', done)
    ;
  });
});

describe('GET /api/v1/definition', function(){
  before(function(done) {
    mongoose.connect('mongodb://localhost/test-server', {
      db: { safe: true }
    }, done);
  });

  after(function(done) {
    mongoose.disconnect(done);
  });

  it('respond with html', function(done){
    request(app)
      .get('/api')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });

  it('has a json definition of the resources', function(done){
    request(app)
      .get('/api/v1/definition')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        assert.ok(res.body._links);
        assert.ok(res.body._embedded);
        
        assert.ok(res.body._embedded.Thing);
        assert.ok(res.body._embedded.Thing._links);
        assert.ok(res.body._embedded.Thing._links.self);
        assert.ok(res.body._embedded.Thing._links.self.href);

        assert.ok(res.body._embedded.Thing.count >= 0);
        assert.ok(res.body._embedded.Thing.paths);
        done(err);
      })
      ;
  });

  it('has a json definition of the Thing resource', function(done){
    request(app)
      .get('/api/v1/definition/Thing')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        assert.ok(typeof res.body.count !== 'undefined');
        assert.ok(res.body.paths.additionalType);
        assert.ok(res.body.paths.name);
        assert.ok(res.body.paths.alternateName);
        assert.ok(res.body.paths.description);
        assert.ok(res.body.paths.image);
        assert.ok(res.body.paths.sameAs);
        assert.ok(res.body.paths.url);
        done(err);
      })
      ;
  });

  describe('GET /api/definition', function() {
    it('responds with a HTML page', function(done) {
      request(app)
        .get('/api/definition')
        .expect('Content-type', 'text/html; charset=utf-8', done)
      ;  
    });
  });

  describe('TestHolder resource', function() {
    it('has a json definition of the TestHolder resource', function(done){
      request(app)
        .get('/api/v1/definition/TestHolder')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          assert.ok(typeof res.body.count !== 'undefined');
          assert.equal(res.body.paths.name, 'String');
          assert.equal(res.body.paths.single, 'TestHolded');
          assert.equal(res.body.paths.multiple.constructor.name, 'Array');
          done(err);
        })
      ;
    });

    it('creates a TestHolder document and returns it', function(done) {
      var modelName = 'API Holder A';
      request(app)
        .post('/api/v1/TestHolder')
        .send({name: modelName})
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          assert.ok(res.body._links);
          assert.ok(res.body._links.self);
          assert.ok(res.body._links.self.href);
          assert.equal(res.body.name, modelName);
          done();
        })
      ;
    });

    describe('The automatic creation of referenced objects', function() {
      var modelName = 'An other Holder';
      var req, reqErr, response;
      before(function(done) {
        req = request(app)
          .post('/api/v1/TestHolder')
          .send({
            name: modelName,
            single: {
              boolean: false,
              integer: 1
            },
            multiple: [
              {
                boolean: true,
                integer: 1
              },
              {
                boolean: true,
                integer: 2
              }
            ]
          })
          // .expect(201)
          .end(function(err, res) {
            reqErr = err;
            response = res;
            done();
          });
        ;
      });

      it('responds without error', function(done) {
        done(reqErr);
      });

      it('responds with status code 201', function(done) {
        assert.equal(response.status, 201);
        done();
      });

      it('responds with an object having the same name', function(done) {
        assert.equal(response.body.name, modelName);
        done();
      });

      it('replaced values with object ids when possible', function(done) {
        assert.equal(typeof response.body.single, 'string');
        assert.equal(response.body.multiple.constructor.name, 'Array');
        assert.equal(response.body.multiple.length, 2);
        assert.equal(typeof response.body.multiple[0], 'string');
        done();
      });
    });
  });

  // describe('has a _PassportUser', function() {});
});
