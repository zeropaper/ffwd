(function() {
  'use strict';

  var module = angular.module('ffwd.factories', []);
  // var _cache = {};

  module.factory('HALThings', function($http) {
    function HALThings(thingType) {
      this.thingType = thingType || this.thingType;
      // this.define();
    }


    HALThings.prototype.baseUrl =    '/api/v1';
    HALThings.prototype.busy =       false;
    HALThings.prototype.thingType =  'Thing';
    HALThings.prototype.offset =     0;
    HALThings.prototype.limit =      20;
    HALThings.prototype._links =     null;
    HALThings.prototype.items =      [];
    HALThings.prototype.data =       {};

    // HALThings.prototype.define = function(defined) {
    //   if (!_cache[this.thingType]) {
    //     // _cache[this.thingType] = {};
        
    //     $http.get(this.baseUrl +'/definition/'+ this.thingType).success(function(data) {
    //       _cache[this.thingType] = data;
    //       // console.info('Define', this.thingType, data);
    //       defined(data);
    //     }.bind(this));
    //     return;
    //   }

    //   defined(_cache[this.thingType]);
    // };

    HALThings.prototype.url = function(target) {
      if (target && this._links) {
        if (!this._links[target] || !this._links[target].href) {
          throw new Error('No link definition for "'+ target +'" in the resource.');
        }
        return this._links[target].href;
      }

      return this.baseUrl +'/'+ this.thingType;
    };

    HALThings.prototype.list = function(target) {
      if (this.busy) {
        return;
      }
      this.busy = true;
      console.info('Listing', target);

      return $http.get(this.url(target)).success(function(data) {
        this._links = data._links || {};
        this.items = this.items.concat(data._embedded[this.thingType]);
        this.offset = this.offset + data._embedded[this.thingType].length;
        this.busy = false;
      }.bind(this));
    };

    HALThings.prototype.head = function() {
    };

    HALThings.prototype.option = function() {
    };

    HALThings.prototype.post = function(data) {
      if (this.busy) {
        return;
      }
      this.busy = true;
      return $http.post(this.url(), data).success(function() {
        console.info('Posssssttteeeeddd!!!!!', arguments);
        this.busy = false;
      }.bind(this));
    };

    HALThings.prototype.get = function(where) {
      if (this.busy) {
        return;
      }
      this.busy = true;
      return $http.get(this.url, where).success(function(data) {
        console.info('got', data, 'where', where);
        this.busy = false;
      }.bind(this));
    };

    HALThings.prototype.getById = function(id) {
      if (this.busy) {
        return;
      }
      this.busy = true;
      return $http.get(this.url() +'/'+ id).success(function(data) {
        console.info('got', data, 'where id', id);
        this.busy = false;
      }.bind(this));
    };

    HALThings.prototype.put = function(data) {
      if (this.busy) {
        return;
      }
      this.busy = true;
      return $http.put(this.url() +'/'+ data._id, data).success(function() {
        console.info('Puuuuttteeeeddd!!!!!', arguments);
        this.busy = false;
      }.bind(this));
    };

    HALThings.prototype.patch = function() {
    };

    HALThings.prototype.delete = function() {
    };

    return HALThings;
  });

}());