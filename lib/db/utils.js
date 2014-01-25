var fs = require('fs');
var _ = require('underscore');
var fetch = require('fetch').fetchUrl;

/**
 * Utilities for the database schema
 * 
 * @exports utils
 */
var utils = module.exports = {
  fetch: fetch,
  _: _
}; 

/**
 * Utility to get a value deep in a object.
 *
 * @param obj {Object}          - an object to dig in
 * @param varPath {string} - the path at which the value is searched
 * @returns {*}
 * @throws an error telling that the value can not be found at the specified path
 */
utils.atPath = function(obj, varPath, options) {
  'use strict';
  options = options || {};
  var paths = varPath.split(options.separator || '.')
    , current = obj
    , i;
  
  for (i = 0; i < paths.length; ++i) {
    if (current[paths[i]] === undefined) {
      throw new Error('The path "'+ varPath +'" can not be accessed.');
    } else {
      current = current[paths[i]];
    }
  }

  return current;
};

/**
 * Utility to get the content of the online JSON schema
 * or its locally cached version.
 *
 * @param {string} cachedPath  - The path where the cached version should be
 * @param {miscCallback} done  - The callback handling the 
 */
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