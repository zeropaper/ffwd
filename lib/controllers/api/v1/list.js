'use strict';

var list = module.exports = {};

var schemaOrg = require('./../../../db/schema'),
    mongoose = schemaOrg.mongoose,
    sendHal = require('./request').sendHal;

list.Thing = function(req, res, next) {
  var Model = mongoose.model(res.thingType);
  var offset = res.queryOffset = parseInt(req.query.offset, 10) || 0;
  var limit = res.queryLimit = Math.min(req.query.limit, 20);

  if (!Model) {
    return next(new Error('Undefined mongoose model '+ res.thingType));
  }

  Model
  .find({})
  .setOptions({
    limit: limit,
    skip: offset
  })
  .exec(function(err, results) {
    if (err) {
      return next(err);
    }
    res.rawJSON = results;
    sendHal(req, res);
    // res.send(results);
  });
};