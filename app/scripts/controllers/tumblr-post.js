'use strict';

angular.module('fullstackApp')
  .controller('SingleTumblrPostCtrl', function ($scope, $routeParams, $http) {
    $http.get('/api/TumblrPost/'+ $routeParams.id).success(function(tumblrPost) {
      $scope.tumblrPost = tumblrPost;
      console.info('$scope.tumblrPost', $scope.tumblrPost);
    });
  })
  // .controller('TumblrPostCtrl', function ($scope, $http, ThingFactory) {
  //   $scope.thingFactory = new ThingFactory('TumblrPost');
  //   // $http.get('/api/TumblrPost').success(function(tumblrPosts) {
  //   //   $scope.tumblrPosts = tumblrPosts;
  //   //   console.info('$scope.tumblrPosts', $scope.tumblrPosts);
  //   // });
  // })
  .controller('TumblrPostCtrl', function ($scope, $http, HALThings) {
    $scope.HALThings = new HALThings('TumblrPost');
    // $http.get('/api/TumblrPost').success(function(tumblrPosts) {
    //   $scope.tumblrPosts = tumblrPosts;
    //   console.info('$scope.tumblrPosts', $scope.tumblrPosts);
    // });
    $scope.HALThings.list();
    $scope.next = function(){
      console.info('next posts please');
      $scope.HALThings.list('next');
    };
  })
  // .controller('TumblrPostCtrl', function ($scope, $http, Restangular) {
  //   var tumblrPosts = Restangular.all('TumblrPost');
  //   tumblrPosts.busy = false;
  //   tumblrPosts.getNext = function() {
  //     var nextUrl;
  //     try {
  //       nextUrl = $scope.tumblrList.$object.metadata.next.href;
  //     } catch (err) {}

  //     console.info('nextUrl', nextUrl);
  //     if (nextUrl) {
  //       tumblrPosts = Restangular.allUrl('TumblrPost', nextUrl);
  //     }
  //     else {
  //       tumblrPosts = Restangular.all('TumblrPost');
  //     }
  //   };

  //   $scope.tumblrProvider = tumblrPosts;
  //   $scope.tumblrList = tumblrPosts.getList();
  //   console.info('$scope.tumblrList', $scope.tumblrList);
  //   $scope.tumblrList.then(function() {
  //     console.info('and then...', $scope.tumblrList.$object.metadata);
  //   });
  //   $scope.tumblrPosts = $scope.tumblrList.$object;

  //   // console.info('$scope.tumblrPosts', tumblrPosts.getList());
  //   // var newPost = {tumblr: {id: 123456789}};
  //   // tumblrPosts.post(newPost);
  // })
  ;
