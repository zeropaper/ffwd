(function(){
  'use strict';

  angular.module('publicPropertyFilter', [])
    .filter('publicProperty', function() {
      return function(input) {
        console.info('publicProperty', arguments, this);
        return !!input;
      };
    });
}());