'use strict';

var app = angular.module('app', [
    'app.dashboard'
]);

app.constant('appConfig', {
    baseUrl: 'http://localhost/api',
    username: 'YOURUSERNAME',
    password: 'YOURPASSWORD'
});