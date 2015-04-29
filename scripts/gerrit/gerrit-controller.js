'use strict';

angular.module('app.gerrit').controller('GerritCtrl', ['$scope', 'appConfig', 'GerritProject',
    function($scope, appConfig, GerritProject) {
		
		var gerritProduct1 = new GerritProject("PRODUCT 1", appConfig.gerrit.gerritProduct1);
		var gerritProduct2 = new GerritProject("PRODUCT 2", appConfig.gerrit.gerritProduct1);	
		var products = [gerritProduct1, gerritProduct2];

		for (var i = 0; i < products.length; i++) {
			products[i].analyseProjects();
		}
		
		$scope.gerritStats = products;
	}
]);