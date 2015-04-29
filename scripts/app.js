'use strict';

var app = angular.module('app', [
    'app.dashboard'
]);

app.constant('appConfig', {
    projectName: "OJP",
    sonar: {
        baseUrl: 'http://sonar.ojp:9000/api',
        username: 'admin',
        password: 'admin',
        goals: {
            methodComplexity: 2.5,
            fileComplexity: 18,
            coverage: 40,
            compliance: 92
        },
        projectsRegex: '.*Ojp.*',
        weighting: {
            blocker: 10,
            critical: 5,
            major: 3,
            minor: 1,
            info: 0
        }
    },
	gerrit: {		
		gerritProduct1: 'project1 project2.2',
		gerritProduct2: 'project4 project5',		
		proxy: 'http://proxyServer:1234',
		startDate: new Date(new Date().setYear(new Date().getFullYear() - 1)),
		endDate: new Date(),
		botName: "Name of Jenkins bot",
		colors: ["#ff0000", "#008000", "#679DC6", "#0b62a4"]
	}
});
