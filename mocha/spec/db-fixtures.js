var path = require('path');
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

describe('The relationships management', function() {});