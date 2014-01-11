var path = require('path');
var fs = require('fs');
var async = require('async');
var mime = require('mime');

var Crawler = module.exports = function(directory) {
  if (!directory) {
    throw new Error('Crawler takes argument directory.');
  }
  this.setDirectory(directory);
};

function crawl(dirPath, filter, done) {
  fs.readdir(dirPath, function(err, files) {
    if (err) {
      return done(err);
    }

    // dirPath = path.resolve(dirPath);

    async.map(files, function(file, cb) {
      var filePath = path.join(dirPath, file);
      fs.stat(filePath, function(err, stats) {
        if (err) {
          return cb(err);
        }

        if (stats.isDirectory()) {
          crawl(filePath, filter, cb);
        }
        else {
          cb(null, filePath);
        }
      });
    }, function(err, crawled) {
      if (err) {
        return done(err);
      }
      var collected = [];
      for (var c in crawled) {
        collected = collected.concat(crawled[c]);
      }
      done(null, collected);
    });
  });
}

Crawler.prototype.setDirectory = function(directory) {
  this.directory = path.resolve(directory);
  this.files = {};
  this.directories = {};
  this.error = null;
  this.errors = [];
  this.finished = false;
  return this;
};

Crawler.prototype.done = function() { return this; };

Crawler.prototype.process = function(options) {
  options = options || {};
  var self = this;

  crawl(self.directory, self.filter, function(err, files) {
    self.finished = true;
    
    if (err) {
      self.error = err;
      return done(err);
    }

    for (var f in files) {
      var dirname = path.relative(self.directory, path.dirname(files[f]));
      var filepath = path.relative(self.directory, files[f]);

      self.files[filepath] = options.mime !== false ? mime.lookup(files[f]) : true;
      if (dirname) {
        self.directories[dirname] = self.directories[dirname] || 0;
        self.directories[dirname]++;
      }
    }
    
    var done = options.done || self.done || function() {};
    // console.info('options.async', !!options.async, done);
    if (options.async) {
      return self.async(options.async, done);
    }

    done(null, self.files);
  });
  return this;
};

Crawler.prototype.async = function(options, done) {
  options = options || {};
  
  if (!options.method || !async[options.method]) {
    return done(new Error('Crawler async method unknown.'));
  }
  
  var items = Object.keys(options.directories ? this.directories : this.files);
  for (var i in items) {
    items[i] = path.join(this.directory, items[i]);
  }

  // console.info('async', options.method, items, options.iterator, done);

  async[options.method](items, options.iterator, done);
};