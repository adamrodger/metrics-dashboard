'use strict';

angular.module('app.sonar').service('Sonar', ['$http', 'appConfig',
    function($http, appConfig) {
        return ({
            resources: resources,
            metrics: metrics
        });

        $http.defaults.withCredentials = true;
        $http.defaults.headers['Authorization'] = 'Basic ' + window.btoa(appConfig.username + ':' + appConfig.password);

        function resources() {
            return $http.jsonp(appConfig.baseUrl + '/resources?callback=JSON_CALLBACK');
        }

        function metrics(key) {
            return $http.jsonp(
                appConfig.baseUrl
                + '/resources?callback=JSON_CALLBACK&resource='
                + key
                + '&metrics=ncloc,function_complexity,file_complexity,coverage,violations_density');
        }
    }
]);