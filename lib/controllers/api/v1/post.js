'use strict';

var post = module.exports = {};

var schemaOrg = require('./../../../db/schema'),
    mongoose = schemaOrg.mongoose,
    sendHal = require('./request').sendHal;

post.Thing = function(req, res, next) {
  var Model = mongoose.model(res.thingType);

  if (!Model) {
    return next(new Error('Undefined mongoose model '+ res.thingType));
  }

  req._originalBody = req.body;
  Model.saveRefs(req.body, {}, function(err, saved) {
    console.info('err', err?err.stack:'', saved);
    if (err) {
      return next(err);
    }

    res.thingType = res.thingType;
    res.thingId = saved._id;
    res.rawJSON = saved;
    res.status(201);
    sendHal(req, res);

    // Model.create(body, function(err, saved) {
    //   if (err) {
    //     return next(err);
    //   }

    //   res.thingType = res.thingType;
    //   res.thingId = saved._id;
    //   res.rawJSON = saved.toObject();
    //   res.status(201);
    //   sendHal(req, res);
    // });
  });
};