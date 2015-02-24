'use strict';

angular.module('app.sonar').service('Sonar', ['$http', 'appConfig',
    function($http, appConfig) {
        return ({
            resources: resources,
            metrics: metrics
        });

        $http.defaults.withCredentials = true;
        $http.defaults.headers['Authorization'] = 'Basic ' + window.btoa(appConfig.sonar.username + ':' + appConfig.sonar.password);

        function resources() {
            return $http.jsonp(appConfig.sonar.baseUrl + '/resources?callback=JSON_CALLBACK');
        }

        function metrics(key, date) {
            return $http.jsonp(
                appConfig.sonar.baseUrl
                + '/timemachine?callback=JSON_CALLBACK'
                + '&metrics=ncloc,complexity,files,functions,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,lines_to_cover,uncovered_lines'
                + '&resource=' + key
                + '&toDateTime=' + date.toISOString());
        }
    }
]);