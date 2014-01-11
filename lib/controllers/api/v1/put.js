'use strict';

var put = module.exports = {};

var schemaOrg = require('./../../../db/schema'),
    mongoose = schemaOrg.mongoose;

put.Thing = function(req, res, next) {
  var Model = mongoose.model(res.thingType);

  if (!Model) {
    return next(new Error('Undefined mongoose model '+ res.thingType));
  }

  for (var p in req.body) {
    if (p[0] === '_') {
      delete req.body[p];
    }
  }

  Model
  .update({_id: res.thingId}, req.body, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
  });
};