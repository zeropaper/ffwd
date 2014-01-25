'use strict';
var _ = require('underscore');
var request = module.exports = {};

function removeKeys(obj, keys) {
  for (var k in keys) {
    delete obj[keys[k]];
  }
  return obj;
}

/**
 * Formats a request to follow the 
 * {@link http://stateless.co/hal_specification.html|HAL - Hypertext Application Language}
 * specification.
 * 
 */
function sendHal(req, res) {
  var response = {
    _links: {
      self: {
        href: req.url
      },
      definition: {
        href: '/api/definition/'+ res.thingType + (res.thingProperty ? '/'+ res.thingProperty : '')
      }
    }
  };

  if (res.thingId && !res.thingProperty) {
    _.extend(response, res.rawJSON.toObject ? res.rawJSON.toObject() : res.rawJSON || {});
  }
  else {
    response.limit = res.queryLimit;
    response.offset = res.queryOffset;
    response.count = res.thingsCount;
    response._links.next = {
      href: response._links.self.href.split('?')[0] +'?offset='+ ((res.queryOffset || 0) + (res.queryLimit || 20))
    };

    var items = [];
    for (var i in res.rawJSON) {
      items.push(_.extend({
        _links: {
          self: {
            href: '/api/v1/'+ res.rawJSON[i].thingType +'/'+ res.rawJSON[i]._id
          }
        }
      }, res.rawJSON[i]));
    }

    response._embedded = {};
    response._embedded[res.thingProperty || res.thingType] = items;
  }

  res.send(response);
}
request.sendHal = sendHal;