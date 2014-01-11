
'use strict';

var api = module.exports = {},
    schemaOrg = require('./../../../db/schema'),
    mongoose = schemaOrg.mongoose,
    async = require('async'),
    params = api.params = require('./params'),
    sendHal = require('./request').sendHal;

var things = {
  post: require('./post'),
  get: require('./get'),
  list: require('./list'),
  put: require('./put'),
  delete: require('./delete')
};

api.version =  'v1';

api.post = function(req, res, next) {
  if (things.post[res.thingType]) {
    things.post[res.thingType](req, res, next);
  }
  else {
    things.post.Thing(req, res, next);
  }
};

api.get = function(req, res) {
  res.rawJSON = res[res.thingType];
  // console.info('res.rawJSON', res.rawJSON);
  sendHal(req, res);
};

api.list = function(req, res, next) {
  if (!res.thingType) {
    return next(new Error('response.thingType is not defined'));
  }

  if (things.list[res.thingType]) {
    things.list[res.thingType](req, res, next);
  }
  else {
    things.list.Thing(req, res, next);
  }
};

api.put = function(req, res, next) {
  if (things.put[res.thingType]) {
    things.put[res.thingType](req, res, next);
  }
  else {
    things.put.Thing(req, res, next);
  }
};

api.delete = function(req, res, next) {
  if (things.delete[res.thingType]) {
    things.delete[res.thingType](req, res, next);
  }
  else {
    things.delete.Thing(req, res, next);
  }
};















function findAndCount(Model, options, cb) {
  Model
  .find(options.where || {})
  .setOptions(options.query || {})
  .exec(function(err, results) {
    if (err) {
      return cb(err);
    }

    if (results && results.length && results.length <= options.query.limit) {
      Model.count(options.where, function(err, count) {
        if (err) {
          return cb(err);
        }

        cb(null, count, results);
      });
    }
    else {
      cb(null, results ? results.length : 0, results);
    }
  });
}



api.defineThingType = function(req, res, next) {
  var response = {
    _links: {
      self: {
        href: req.url
      }
    }
  };

  if (res.thingType) {
    if (!mongoose.models[res.thingType]) {
      return res.send(501);
    }
    var Model = mongoose.model(res.thingType);
    return Model.count(function(err, count) {
      if (err) {
        return next(err);
      }
      response.count = count;
      // response = extend(response, mongoose.model(res.thingType).schema);
      var paths = schemaOrg.get(res.thingType);
      response.paths = {};
      for (var p in paths) {
        response.paths[p] = paths[p];//schemaOrg.getProp(p);
      }
      // response.paths = slim(response.paths, ['']);
      res.send(response);
    });
  }

  response._embedded = {};
  var models = {};
  for (var m in mongoose.models) {
    models[m] = (function(model, Model) {
      return function(cb) {
        Model.count(function(err, count) {
          if (err) {
            return cb(err);
          }

          cb(null, {
            _links: {
              self: {href: req.url +'/'+ model}
            },
            count: count,
            paths: schemaOrg.get(model)
          });
        });
      };
    })(m, mongoose.model(m));
  }
  
  async.parallel(models, function(err, definitions) {
    if (err) {
      return next(err);
    }

    for (var n in definitions) {
      if (n[0] === '_') {
        delete definitions[n];
      }
    }
    response._embedded = definitions;
    // response._embedded = definitions.sort(function(a, b) {
    //   return a.count < b.count ? 1 : (a.count > b.count ? -1 : 0);
    // });
    res.send(response);
  });
};















var TumblrPost = {};

TumblrPost.list = function(req, res, next) {
  var Model = mongoose.model('TumblrPost');
  var offset = res.queryOffset = parseInt(req.query.offset, 10) || 0;
  var limit = res.queryLimit = Math.min(req.query.limit || 20, 20);
  var where = {};

  var options = {
    query: {
      limit: limit,
      skip: offset
    },
    where: where
  };

  findAndCount(Model, options, function(err, count, results) {
    if (err) {
      return next(err);
    }
    res.thingsCount = count;
    res.rawJSON = results;
    sendHal(req, res);
  });
};
things.list.TumblrPost = TumblrPost.list;