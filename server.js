var async = require('async');
var fs = require('fs');
var path = require('path');
var Crawler = require('./lib/file-crawler');

var schemaOrg = require('./lib/db/schema');
require('./lib/db/mongo');

var app = require('./lib/server')({
}, {
  mongoose: schemaOrg.mongoose,
  supergoose: schemaOrg.supergoose
});

var port = process.env.PORT || 3000;

schemaOrg.registerSchema('File', require('./lib/db/types/file/schema'));
schemaOrg('File', {}, function(err){
  var FileModel = schemaOrg.mongoose.model('File');
  FileModel.find({}).remove(function() {
    var crawler = new Crawler(process.env.CRAWL_DIR || 'mocha/fixtures');

    crawler.process({
      async: {
        method: 'map',
        iterator: function(fp, cb) {
          fs.stat(fp, function(err, stats) {
            if (err) { return cb(err); }
            
            cb(null, {
              size: stats.size,
              mtime: stats.mtime,
              atime: stats.atime,
              ctime: stats.ctime,
              md5: null,
              mime: require('mime').lookup(fp),
              path: path.relative(crawler.directory, fp)
            });
          });
        }
      },
      done: function(err, docs) {
        // console.info('crawling done', err, docs.length);
        if (err) {
          throw err;
        }

        async.mapSeries(docs, function(doc, cb) {
          console.info('save', doc, FileModel.findOrCreate, Object.keys(FileModel));
          FileModel.findOrCreate({
            path: doc.path
          }, doc, {upsert: true}, function(err, saved, created) {
            // console.info('findOrCreate', err, saved, created);
            if (err) { return cb(err); }
            cb(err, saved);
          });
        }, function(err, savedDocs) {
          if (err) {
            throw err;
          }
          console.log('Saved files', savedDocs);

          app.listen(port, function () {
            console.log('Express server listening on port %d in %s mode', port, app.get('env'));
            console.log('Registered models at start', Object.keys(schemaOrg.mongoose.models));    
          });
        });
      }
    });
  });






});