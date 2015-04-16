'use strict';

angular.module('app.dashboard').controller('DashboardCtrl', ['$scope','appConfig',
    function($scope, appConfig) {
        $scope.projectName = appConfig.projectName;
        $scope.generatedDate = new Date();
    }
]);