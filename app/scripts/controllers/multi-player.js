'use strict';

angular.module('fullstackApp')
  .controller('MultiPlayerCtrl', ['$scope', '$http', function ($scope, $http) {
    var resourceName = 'File';
    $http.get('/api/v1/'+ resourceName)
    .success(function(data) {
      $scope.collection = data._embedded[resourceName];
      console.info('fetched files', $scope.collection);
    })
    .error(function(err) {
      console.info('error while fetching files', err);
    })
    ;
  }])
;
