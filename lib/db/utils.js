var fs = require('fs');
var fetch = require('fetch').fetchUrl;
var utils = module.exports = {};

utils.atPath = function(object, variablePath, options) {
  'use strict';
  options = options || {};
  var parts = variablePath.split(options.separator || '.');
  var scope = object;

  if (parts.length >= 2) {
    for (var pa in parts) {
      if (scope[parts[pa]]) {
        scope = scope[parts[pa]];
      }
      else {
        console.info(variablePath, object);
        throw new Error('The path "'+ variablePath +'" can not be accessed in the object.\n'+ JSON.stringify(object, null, 2));
      }
    }
  }
  
  return scope;
};

utils.fetchOrRead = function(cachePath, done) {
  'use strict';

  fs.readFile(cachePath, 'utf8', function(err, data) {
    if (err) {
      return fetch('http://schema.rdfs.org/all.json', function(err, meta, body){
        if (err) {
          // console.info('Error while fetching', err.message);
          done(err);
          return;
        }
        fs.writeFile(cachePath, body, 'utf8', function(err) {
          if (err) {
            return done(err);
          }
          utils.fetchOrRead(cachePath, done);
        });
      });
    }

    try {
      var json = JSON.parse(data.toString());
      // _cache = JSON.parse(data.toString());
      done(null, json);
    }
    catch (err) {
      done(err);
    }
  });
};