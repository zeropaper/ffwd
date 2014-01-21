var assert = require('assert');
var path = require('path');
var fs = require('fs');
var async = require('async');
var request = require('supertest');
var mime = require('mime');
var Crawler = require('./../../lib/file-crawler');
var schemaOrg = require('./../../lib/db/schema');
var mongoose = schemaOrg.mongoose;
var Schema = mongoose.Schema;
var FileModel;
var supergoose = schemaOrg.supergoose;
var crawler;
var app = require('./../../lib/server')({
}, {
  mongoose: schemaOrg.mongoose,
  supergoose: schemaOrg.supergoose
});

xdescribe('the file crawler', function() {
  describe('initialization', function() {
    it('initializes', function(done) {
      assert.doesNotThrow(function() {
        new Crawler(__dirname +'/../fixtures');
        done();
      }, done);
    });

    it('throws an error when no directory is passed', function(done) {
      assert.throws(function() {
        new Crawler();
      });
      done();
    });
  });

  describe('process callback', function() {
    crawler = new Crawler(__dirname +'/../fixtures');
    
    it('uses its own "done" callback', function(done) {
      crawler.done = function(err) {
        // console.info('yeah done!', err, crawler.files);
        assert.ok(crawler.files);
        done(err);
      };
      crawler.process();
    });

    it('can use a "done" callback passed in the options', function(done) {
      crawler.process({done: done});
    });
  });

  describe('"async" subset', function() {
    crawler = new Crawler(__dirname +'/../fixtures');
    var mapAsync = {
      method: 'map',
      iterator: function(fp, cb) {
        require('fs').stat(fp, function(err, stats) {
          if (err) { return cb(err); }
          stats.mime = require('mime').lookup(fp);
          stats.path = require('path').relative(crawler.directory, fp);
          cb(null, stats);
        });
      }
    };
    
    it('implements the "map" method', function(done) {
      crawler.process({
        done: function(err, stats) {
          var keys = Object.keys(crawler.files);
          for (var i in stats) {
            if (stats[i].path !== keys[i]) {
              return done(new Error('mismatching key for '+ stats[i].path));
            }
          }
          done(err, stats);
        },
        // done: done,
        async: mapAsync
      });
    });

    it('implements the "map" method on the directories', function(done) {
      crawler.async(mapAsync, done);
    });
  });

  describe('persistence', function() {
    before(function(done) {
      mongoose.connect('mongodb://localhost/test-file-crawler', {
        db: { safe: true }
      }, done);
    });

    after(function(done) {
      mongoose.disconnect(done);
    });

    crawler = new Crawler(__dirname +'/../fixtures');
    var mapAsync = {
      method: 'map',
      iterator: function(fp, cb) {
        require('fs').stat(fp, function(err, stats) {
          if (err) { return cb(err); }
          var returned = {
            size: stats.size,
            mtime: stats.mtime,
            atime: stats.atime,
            ctime: stats.ctime,
            mime: require('mime').lookup(fp),
            path: require('path').relative(crawler.directory, fp)
          };
          cb(null, returned);
        });
      }
    };

    it('has a model', function(done) {
      schemaOrg.registerSchema('File', require('./../../lib/db/types/file/schema'));
      schemaOrg('File', {}, function(err){
        if (err) {
          return done(err);
        }

        assert.ok(mongoose.models);
        assert.ok(mongoose.models.File);
        assert.doesNotThrow(function() {
          FileModel = mongoose.model('File');

          done();
        }, done, 'throwed up');
        // done();
      });
    });

    it('clears the File documents', function(done) {
      FileModel.find({}).remove(done);
    });

    it('stores', function(done) {
      crawler.process({
        done: function(err, stats) {
          if (err) {
            return done(err);
          }
          async.map(stats, function(stats, cb) {
            FileModel.findOrCreate({path: stats.path}, stats, function(err, doc, created) {
              if (created) {
                return cb(err, doc);
              }

              FileModel.findByIdAndUpdate(doc._id, { $set: stats }, function(err, results) {
                if (err) {
                  return cb(err);
                }
                cb(null, stats);
              });
            });
          }, done);
        },
        async: mapAsync
      });
    });

    it('supports the RESTful API', function(done) {
      var lastId;
      request(app)
        .get('/api/v1/File')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          assert.ok(res.body._embedded);
          assert.ok(res.body._embedded.File);

          var id = res.body._embedded.File[0]._id;
          request(app)
            .get('/api/v1/File/'+ id)
            .expect(200)
            .end(function(err, res) {
              assert.equal(res.body._id, id);
              assert.ok(res.body.path);
              assert.ok(res.body.mime);
              assert.ok(res.body.mtime);
              assert.ok(res.body.ctime);
              assert.ok(res.body.atime);
              done(err);
            });
        });
    });
  });
});