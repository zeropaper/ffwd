'use strict';
var request = module.exports = {};

function extend(obj, add) {
  var keys = Object.keys(add);
  for (var a in add) {
    obj[a] = add[a];
  }
  return obj;
}

function removeKeys(obj, keys) {
  for (var k in keys) {
    delete obj[keys[k]];
  }
  return obj;
}

function sendHal(req, res) {
  var response = {
    _links: {
      self: {
        href: req.url
      },
      definition: {
        href: '/api/definition/'+ res.thingType + (res.thingPath ? '/'+ res.thingPath : '')
      }
    }
  };

  if (res.thingId && !res.thingPath) {
    // var modelSchema = mongoose.model(res.thingType).schema;
    // for (var p in modelSchema.paths) {
    //   if (p !== '_id' && [
    //     'Number',
    //     'Date',
    //     'DateTime',
    //     'Timestamp',
    //     'String',
    //     'Text'
    //   ].indexOf(modelSchema.paths[p].instance) < 0) {
    //     response._links[p] = {
    //       href: response._links.self.href +'/'+ p
    //     };
    //   }
    // }
    var halJSON = extend(response, res.rawJSON || {});
    return res.send(halJSON);
  }

  response.limit = res.queryLimit;
  response.offset = res.queryOffset;
  response.count = res.thingsCount;
  response._links.next = {
    href: response._links.self.href.split('?')[0] +'?offset='+ ((res.queryOffset || 0) + (res.queryLimit || 20))
  };

  var items = [];
  for (var i in res.rawJSON) {
    items.push(extend({
      _links: {
        self: {
          href: '/api/v1/'+ res.rawJSON[i].thingType +'/'+ res.rawJSON[i]._id
        }
      }
    }, res.rawJSON[i]));
  }

  response._embedded = {};
  response._embedded[res.thingPath || res.thingType] = items;

  res.send(response);
}
request.sendHal = sendHal;