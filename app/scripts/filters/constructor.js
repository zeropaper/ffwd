(function(){
  'use strict';

  angular.module('constructorFilter', [])
    .filter('constructorName', function() {
      return function(input) {
        return input && input.constructor ? input.constructor.name : typeof input;
      };
    });
}());