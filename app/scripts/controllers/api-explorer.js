'use strict';

angular.module('fullstackApp')
  .controller('ThingTypesCtrl', [
    '$scope',
    '$http',
    function ($scope, $http) {
      console.info('API explorer', $scope);
  
      $http.get('/api/v1/definition')
      .success(function(data) {
        console.info('success callback', data);
        $scope.definition = data._embedded;
      })
      .error(function(err) {
        console.info('error callback', err);
      });
    }
  ])
  .controller('ThingTypeCtrl', [
    '$location',
    '$scope',
    'HALThings',
    '$routeParams',
    '$http',
    function ($location, $scope, HALThings, $routeParams, $http) {
      $scope.fillEditForm = function() {
        if (!$scope.thingSearchForm.$valid) {
          return;
        }

        var items = $scope.things[$scope.thingType].items;
        for (var i = 0; i < items.length - 1; i++) {
          if (items[i]._id === $scope.editId) {
            // $scope.thingDocument = items[i];
            // i = items.length;
            var newPath = '/api/'+ $scope.thingType +'/'+ $scope.editId;
            console.info('redirect to', newPath);
            $location.path(newPath);
            return;
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
          $scope.things[$scope.thingType]
          .put($scope.thingDocument)
          .success(function() {
            console.info('putttted!!!!');
          });
        }
        else {
          $scope.things[$scope.thingType]
          .post($scope.thingDocument)
          .success(function() {
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
        

        $http.get('/api/v1/definition/'+ $scope.thingType)
        .success(function(definition) {
          $scope.definition = definition;
          $scope.things[$scope.thingType].list().success(function(){
            console.info('$routeParams.thingId', $routeParams.thingId);
            if ($routeParams.thingId) {
              var items = $scope.things[$scope.thingType].items;
              for (var i = 0; i < items.length - 1; i++) {
                if (items[i]._id === $routeParams.thingId) {
                  $scope.editId = $routeParams.thingId;
                  $scope.thingDocument = items[i];
                  i = items.length;
                  return;
                }
              }
            }
          });
  
        });
      }
    }
  ]);
