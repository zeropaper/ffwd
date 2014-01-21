(function(factory){
  'use strict';
  /* global define: false */

  // node like module definition
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    /* jshint node: true */
    module.exports = factory();
  }

  // require.js like module definition
  else if (typeof define === 'function') {
    define([], factory);
  }

  // Browser only
  else {
    factory();
  }

}(function() {
  'use strict';

  return angular.module('fullstackApp', [
    'infinite-scroll',
    'constructorFilter',
    'typeofFilter',
    'publicPropertyFilter',
    'multiPlayer',
    'schema',
    'ffwd.factories',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute'
  ])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/multi-player-page',
        controller: 'MultiPlayerCtrl'
      })
      .when('/TumblrPost/:id', {
        templateUrl: 'partials/tumblr-post',
        controller: 'SingleTumblrPostCtrl'
      })
      .when('/TumblrPost/by/:query*', {
        templateUrl: 'partials/tumblr-posts',
        controller: 'TumblrPostCtrl'
      })
      .when('/api', {
        templateUrl: 'partials/api-explorer',
        controller: 'ThingTypesCtrl'
      })
      .when('/api/:thingType/:thingId', {
        templateUrl: 'partials/api-resource',
        controller: 'ThingTypeCtrl'
      })
      .when('/api/:thingType', {
        templateUrl: 'partials/api-resource',
        controller: 'ThingTypeCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  });
}));
