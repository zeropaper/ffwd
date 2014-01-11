var path = require('path');
var assert = require('assert');
var libDir = './../../lib';
var schemaOrg = require(libDir +'/db/schema');
var mongoose = schemaOrg.mongoose;
var Schema = mongoose.Schema;

// mongoose.connect('mongodb://localhost/test-schema', { db: { safe: true } }, function() {});

for (var r in require.cache) {
  // console.info('require.cache', r, r.split('goose').length > 1, r.split('fullstack/lib').length > 1);
  if (r.split('goose').length > 1 || r.split('fullstack/lib').length > 1) {
    // console.info('----------------clearing', r);
    delete require.cache[r];
  }
}

schemaOrg = require(libDir +'/db/schema');
// mongoose = require('mongoose');
mongoose = schemaOrg.mongoose;
Schema = mongoose.Schema;
supergoose = schemaOrg.supergoose;

describe('The relationships management', function() {
  var TestHolder, testHolderA, testHolderB,
      TestHolded, testHolded1, testHolded2, testHolded3;

  before(function(done) {
    mongoose.connect('mongodb://localhost/test-relations', {
      db: { safe: true }
    }, done);
  });
  after(function(done) {
    mongoose.disconnect(done);
  });


  it('defines mongoose.model', function(done) {
    schemaOrg.registerSchema('TestHolder', {
      properties: {
        name: 'String',
        single: 'TestHolded',
        multiple: ['TestHolded']
      }
    });

    schemaOrg.registerSchema('TestHolded', {
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
    });

    schemaOrg(['TestHolded', 'TestHolder'], {}, done);
  });

  it('defines the Holder Model paths', function(done) {
    TestHolder = mongoose.model('TestHolder');
    var json = schemaOrg.get('TestHolder');
    // console.info('mongoose.models.TestHolder.schema.paths.single.options', mongoose.models.TestHolder.schema.paths.single.options, json, schemaOrg.mapTypes(json));
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
    var json = schemaOrg.get('TestHolded');
    // console.info('paths', mongoose.models.TestHolded.schema.paths, json, schemaOrg.mapTypes(json));
    assert.ok(mongoose.models.TestHolded);
    var paths = mongoose.models.TestHolded.schema.paths;
    assert.ok(paths.name);
    assert.equal(paths.name.instance, 'String');
    assert.equal(paths.boolean.options.type, Boolean);
    assert.equal(paths.date.options.type, Date);
    assert.equal(paths.time.options.type, Date);
    assert.equal(paths.mixed.options.type, Schema.Types.Mixed);
    assert.equal(paths.integer.instance, 'Number');
    assert.equal(paths.number.instance, 'Number');
    assert.equal(paths.float.instance, 'Number');
    assert.equal(paths.text.instance, 'String');
    assert.equal(paths.string.instance, 'String');
    assert.equal(paths.url.instance, 'String');
    assert.equal(paths.objectId.instance, 'ObjectID');
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
          return done(err);
        }

        if (res.name !== 'Holded 1') {
          return done(new Error('Name is not matching'));
        }
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
      // console.info('loaded document', doc);
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
          // console.info('loading multiple', doc, err ? err.stack : null);
          assert.ok(doc.name);
          assert.equal(doc.populated('multiple').length, 2);
          assert.equal(doc.multiple.length, 2);
          done(err);
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
      assert.ok(result.single);
      assert.equal(result.name, 'A name');
      assert.ok(result.single);
      assert.ok(result.multiple);
      assert.equal(result.multiple.length, 2);
      done(err);
    });
  });
});