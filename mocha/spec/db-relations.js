var path = require('path');
var async = require('async');
var assert = require('assert');
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

describe('The relationships management', function() {
  var TestHolder, testHolderA, testHolderB,
      TestHolded, testHolded1, testHolded2, testHolded3;


  before(function(done) {
    async.series([
      function(cb) {
        mongoose.connect('mongodb://localhost/test-relations', {
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

  it('defines mongoose.model', function(done) {
    this.timeout(10000);

    schemaOrg.registerSchema('TestHolder', utils.schemas.TestHolder);

    schemaOrg.registerSchema('TestHolded', utils.schemas.TestHolded);

    schemaOrg(['TestHolded', 'TestHolder'], {}, done);
  });

  it('defines the Holder Model paths', function(done) {
    TestHolder = mongoose.model('TestHolder');
    var json = schemaOrg.get('TestHolder');
    assert.ok(mongoose.models.TestHolder);
    assert.equal(typeof mongoose.models.TestHolder.saveRefs, 'function');
    var paths = mongoose.models.TestHolder.schema.paths;
    assert.ok(paths.name);
    assert.equal(paths.single.options.ref, 'TestHolded');
    assert.equal(paths.multiple.options.type[0].ref, 'TestHolded');
    done();
  });

  it('defines the Holded Model paths', function(done) {
    TestHolded = mongoose.model('TestHolded');
    var paths = TestHolded.schema.paths;
    expect(mongoose.models.TestHolded).to.be.ok();
    expect(paths.name).to.be.ok();
    expect(paths.name.instance).to.be('String');
    expect(paths.boolean.options.type).to.be(Boolean);
    expect(paths.date.options.type).to.be(Date);
    expect(paths.time.options.type).to.be(Date);
    expect(paths.mixed.options.type).to.be(Schema.Types.Mixed);
    expect(paths.integer.instance).to.be('Number');
    expect(paths.number.instance).to.be('Number');
    expect(paths.float.instance).to.be('Number');
    expect(paths.text.instance).to.be('String');
    expect(paths.string.instance).to.be('String');
    expect(paths.url.instance).to.be('String');
    expect(paths.objectId.instance).to.be('ObjectID');
    done();
  });

  it('clears the test documents', function(done) {
    assert.doesNotThrow(function() {
      mongoose.model('TestHolder').find({}).remove(function(err) {
        if (err) {
          return done(err);
        }
        mongoose.model('TestHolded').find({}).remove(done);
      });
    }, done);
  });

  it('saves a Holded document', function(done) {
    assert.doesNotThrow(function() {
      // TestHolded = mongoose.model('TestHolded');
      testHolded1 = new TestHolded({
        name: 'Holded 1',

        boolean: false,
        date: new Date(),
        time: new Date(),
        mixed: {something: 'mixed'},
        integer: 10,
        number: 11,
        float: 11.1,
        text: 'Some text',
        string: 'A string',
        url: 'http://localhost:9000/',
        // objectId: 'ObjectId',

        booleanArray: [false, true, false],
        dateArray: [new Date(), new Date()],
        timeArray: [new Date()],
        mixedArray: ['Mixed', ['values']],
        integerArray: [3, 2, 1],
        numberArray: [3.1, 2.1, 1.1],
        floatArray: [3.2, 2.2, 1.2],
        textArray: ['Some other text'],
        stringArray: ['An other string', 'and one more'],
        urlArray: ['http://localhost:9000/api']
        // objectIdArray: ['ObjectId']
      });
      testHolded1.save(function(err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.name, 'Holded 1');
        done();
      });
    }, done);
  });
  
  it('saves a Holder document', function(done) {
    TestHolder = mongoose.model('TestHolder');
    testHolderA = new TestHolder({
      name: 'Holder A'
    });

    assert.ok(testHolderA.saveRefs);
    assert.equal(typeof testHolderA.saveRefs, 'function');

    testHolderA.save(function(err, doc) {
      if (err) {
        return done(err);
      }
      
      assert.equal(typeof doc.save, 'function');
      assert.equal(typeof doc.populate, 'function');
      assert.equal(typeof doc.populated, 'function');

      if (doc.name !== 'Holder A') {
        return done(new Error('Name is not matching'));
      }
      done();
    });
  });

  it('saves a Holded document when a Holder document is saved', function(done) {
    assert.doesNotThrow(function() {
      testHolderB = new TestHolder({
        name: 'Holder B',
        // single: {
        //   name: 'Holded 2'
        // },
        multiple: [
          testHolded1
        ]
      });

      // testHolderB.multiple.push(testHolded1);

      testHolded3 = new TestHolded({
        name: 'Holded 3'
      });
      testHolderB.multiple.push(testHolded3);
      testHolded3.save(function(err, doc) {
        if (err) {
          return done(err);
        }

        if (doc.name !== 'Holded 3') {
          return done(new Error('Name is not matching'));
        }
        testHolderB.save(function(err, doc) {
          if (err) {
            return done(err);
          }
        
          if (doc.name !== 'Holder B') {
            return done(new Error('Name is not matching'));
          }
          done();
        });
      });

    }, done);
  });

  it('retrieves a Holder document', function(done) {
    TestHolder.findById(testHolderB._id, function(err, doc) {
      if (err || !doc) {
        return done(err || (new Error('Could not find document '+testHolderB._id)));
      }
      if (doc.name !== 'Holder B') {
        return done(new Error('Name is not matching'));
      }
      done();
    });
  });

  describe('the loading of a Holder Model document', function() {
    it('loads unpopulated', function(done) {
      TestHolder
        .findById(testHolderB._id)
        .exec(function(err, doc) {
          if (err) {
            return done(err);
          }
          assert.ok(doc.name);
          assert.equal(doc.multiple.constructor.name, 'Array');
          assert.equal(doc.multiple.length, 2);
          done(err);
        });
    });

    it('loads populated', function(done) {
      TestHolder
        .findById(testHolderB._id)
        .populate('multiple')
        .exec(function(err, doc) {
          if (err) {
            return done(err);
          }
          // console.info('loading multiple', doc, err ? err.stack : null);
          assert.ok(doc.name);
          assert.equal(doc.populated('multiple').length, 2);
          assert.equal(doc.multiple.length, 2);
          done();
        });
    });
  });

  it('loads the Holded Model documents', function(done) {
    TestHolded.find({}, function(err, docs) {
      // console.info('loaded documents count', docs.length);
      done(err);
    });
  });

  it('retrieves a Holded Model document', function(done) {
    TestHolded.findById(testHolded1._id, function(err, doc) {
      if (err || !doc) {
        return done(err || (new Error('Could not find document '+testHolded1._id)));
      }
      // console.info('loaded document', doc);
      if (doc.name !== 'Holded 1') {
        return done(new Error('Name is not matching'));
      }
      done();
    });
  });

  it('can replace the referenced data by ids', function(done) {
    TestHolder.saveRefs({
      name: 'A name',
      single: {name: 'auto ref single'},
      multiple: [
        {name: 'auto ref multiple a'},
        {name: 'auto ref multiple b'}
      ]
    }, function(err, result) {
      if (err) {
        return done(err);
      }
      var json = JSON.parse(JSON.stringify(result));
      // console.info('json???', result, json);
      expect(json.name).to.be('A name');
      expect(json.single).to.be.a('string');
      expect(json.multiple).to.be.an('array');
      expect(json.multiple.length).to.be(2);
      expect(json.multiple[0]).to.be.a('string');
      expect(json.multiple[1]).to.be.a('string');
      done();
    });
  });
});