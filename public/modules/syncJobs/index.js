(function(){
	'use strict';

	angular.module('myApp.Sync', ['ngRoute', 'chart.js'])

	.config(['$routeProvider', function($routeProvider) {
        $routeProvider
	    .when('/sync', {
            title: 'Sync Jobs Now',
	        templateUrl: 'modules/syncJobs/views/index.html',
            controller: 'SyncController'
        })
        ;
	}])
	.controller('SyncController', SyncController)
    .factory('SyncService', SyncService)
	;
    
    function SyncController($scope, $http, $window, SyncService ){
        
        $scope.syncJobs = function() {
            $scope.processing = true;
            console.log("Sincronizando");
            
            SyncService.syncJobs()
            .success(function(data){
                console.log('Results:', data); 
                $scope.total = data['total'];
                delete data['total'];
                $scope.results = data;
                $scope.labels = Object.keys(data);
                var values = $scope.labels.map(function(type){
                    return data[type];
                });
                $scope.data = values;
                console.log('Values: ',values);
                $scope.processing = false;

            }).error(function(status){
                console.log('Se presentó un error sincronizando ' + status);
            });
        }

	}
    
    function SyncService($http){
        var syncService = {};
        
        syncService.syncJobs = function() {
            return $http.get('/api/v1/syncjobs')
            .success(function(data) {
                return data;
            }).error(function(status){
                console.log(status);
            });
        };
        
        /*historyService.getCommunityStream = function(communityId) {
            return $http.get('/api/v1/activityStream/' + communityId)
            .success(function(data) {
                return data;
            }).error(function(status){
                console.log(status);
            });
        };*/
        
        return syncService;
    }

	SyncController['$inject'] = ['$scope', '$http', '$window', 'SyncService'];
    SyncService['$inject'] = ['$http'];

}());