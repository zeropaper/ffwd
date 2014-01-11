'use strict';

angular.module('fullstackApp')
  .controller('ThingTypesCtrl', function ($scope, $http) {
    console.info('API explorer', $scope);

    $http.get('/api/v1/definition')
      .success(function(data) {
        console.info('success callback', data);
        $scope.definition = data._embedded;
      })
      .error(function(err) {
        console.info('error callback', err);
      })
    ;
  })
  .controller('ThingTypeCtrl', function ($scope, HALThings, $routeParams, $http) {
    console.info('');
    $scope.fillEditForm = function() {
      if (!$scope.thingSearchForm.$valid) {
        return;
      }

      var items = $scope.things[$scope.thingType].items;
      for (var i = 0; i < items.length - 1; i++) {
        if (items[i]._id === $scope.editId) {
          $scope.thingDocument = items[i];
          i = items.length;
        }
      }
    };
    $scope.editSearchProperty = function() {
      var property = $scope.thingDocumentProperty;
      if ($scope.definition.paths[property]) {
        $scope.thingDocument[property] = '';
        $scope.thingDocumentProperty = '';
      }
    };

    $scope.submit = function() {
      console.info('submit', !!$scope.thingDocument._id);
      if ($scope.thingDocument._id) {
        $scope.things[$scope.thingType].put($scope.thingDocument).success(function() {
          console.info('putttted!!!!');
        });
      }
      else {
        $scope.things[$scope.thingType].post($scope.thingDocument).success(function() {
          console.info('posted!!!!');
          $scope.things[$scope.thingType].list();
        });
      }
    };

    if ($scope.thingType !== $routeParams.thingType) {
      $scope.thingType = $routeParams.thingType;

      $scope.thingDocument = {
        name: 'New '+ $scope.thingType +' document'
      };

      $scope.things = $scope.things || {};
      $scope.things[$scope.thingType] = $scope.things[$scope.thingType] || new HALThings($scope.thingType);
      
      $http.get('/api/v1/definition/'+ $scope.thingType).success(function(definition) {
        console.info('fetched defintion', definition);
        $scope.definition = definition;
        $scope.things[$scope.thingType].list();
      });
    }
  });
