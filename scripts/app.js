'use strict';

var app = angular.module('app', [
    'app.dashboard'
]);

app.constant('appConfig', {
    projectName: "MYPROJECTNAME",
    sonar: {
        baseUrl: 'http://localhost/api',
        username: 'YOURUSERNAME',
        password: 'YOURPASSWORD',
        goals: {
            methodComplexity: 2.5,
            fileComplexity: 10,
            coverage: 75,
            compliance: 90
        },
        projectsRegex: '.*',
        weighting: {
            blocker: 10,
            critical: 5,
            major: 3,
            minor: 1,
            info: 0
        }
    }
});
