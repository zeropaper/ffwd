(function() {
  'use strict';
  angular.module('multiPlayer', [])
  .directive('multiPlayer', function() {
  // .directive('multiPlayer', function($sce) {
    return {
      transclude: true,

      controller: function($scope, $sce) {
        console.info('controller: $scope', $scope);
        $scope.collection = $scope.$parent.collection || [];

        $scope.index = 0;

        $scope.repeat = false;

        $scope.looping = true;

        $scope.playing = false;

        $scope.media = $scope.collection[$scope.index];

        $scope.setIndex = function(index) {
          $scope.index = parseInt(index, 10) || 0;
          $scope.media = $scope.collection[$scope.index];
          $scope.src = '';
          switch ($scope.media.provider) {
            /* jshint camelcase: false */
            case 'soundcloud':
            case 'exfm':
            case 'mixcloud':
              break;

            case 'dailymotion':
            case 'arte':
              break;

            case 'youtube':
              var untrusted = '//www.'+ $scope.media.provider +'.com/embed/'+ $scope.media.provider_id;
              var trusted = $sce.trustAsResourceUrl(untrusted);
              $scope.src = trusted;
              break;
          }
        };

        $scope.prev = function() {
          console.info('prev', $scope.index);
          if ($scope.repeat) {
            $scope.setIndex($scope.index);
          }
          else if ($scope.index > 0) {
            $scope.setIndex($scope.index - 1);
          }
          else if ($scope.looping) {
            $scope.setIndex($scope.collection.length - 1);
          }
        };

        $scope.next = function() {
          console.info('next', $scope.index);
          if ($scope.repeat) {
            $scope.setIndex($scope.index);
          }
          else if ($scope.index < $scope.collection.length - 1) {
            $scope.setIndex($scope.index + 1);
          }
          else if ($scope.looping)  {
            $scope.setIndex(0);
          }
        };

        $scope.play = function() {
          $scope.playing = true;
          $scope.setIndex($scope.index);
        };

        $scope.pause = function() {
          $scope.playing = false;
          $scope.setIndex($scope.index);
        };

        $scope.item = function() {
          return $scope.collection[$scope.index];
        };
      },
      scope: {},
      templateUrl: 'partials/multi-player.html'
    };
  });
}());