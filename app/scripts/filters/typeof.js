(function(){
  'use strict';

  angular.module('typeofFilter', [])
    .filter('typeof', function() {
      return function(input) {
        return typeof input;
      };
    });
}());