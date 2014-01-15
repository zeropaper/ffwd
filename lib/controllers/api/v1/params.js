'use strict';

var schemaOrg = require('./../../../db/schema'),
    mongoose = schemaOrg.mongoose;

var params = module.exports = {};

params.thingType = function(req, res, next) {
  if (mongoose.models[req.params.thingType]) {
    res.thingType = req.params.thingType;
  }
  next();
};

params.thingId = function(req, res, next) {
  var Model = mongoose.models[res.thingType || 'Thing'];
  Model.findById(req.params.thingId, function(err, model) {
    if (err) {
      return next(err);
    }
    
    if (!model) {
      return res.send(404);
    }

    res.thingId = req.params.thingId;
    res[res.thingType] = model.toJSON();
    next();
  });
};

params.thingProperty = function(req, res, next) {
  if (req.params.thingProperty) {
    var schema = schema.get(res.thingType);
    if (!schema[req.params.thingProperty]) {
      return next(new Error('Can not access resource path'));
    }
    res.thingProperty = req.params.thingProperty;
  }
  next();
};