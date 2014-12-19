'use strict';

angular.module('app.dashboard').controller('DashboardCtrl', ['$scope', '$q', 'Sonar',
    function($scope, $q, Sonar) {
        $scope.metrics = new Array();

        function sum(array, property) {
            return array.reduce(function(a, b) {
                return a + b[property];
            }, 0);
        }

        function calculateMetrics() {
            var totalLines = sum($scope.metrics, 'lines');

            var weightedMetrics = $scope.metrics.map(function(a) {
                var factor = a.lines / totalLines;

                return {
                    methodComplexity: factor * a.methodComplexity,
                    fileComplexity: factor * a.fileComplexity,
                    coverage: factor * a.coverage,
                    compliance: factor * a.compliance,
                };
            });

            $scope.totalLines = totalLines;
            $scope.methodComplexity = sum(weightedMetrics, 'methodComplexity').toFixed(2);
            $scope.fileComplexity = sum(weightedMetrics, 'fileComplexity').toFixed(2);
            $scope.coverage = sum(weightedMetrics, 'coverage').toFixed(2);
            $scope.compliance = sum(weightedMetrics, 'compliance').toFixed(2);
        }

        Sonar.resources().then(function(response) {
            $scope.metrics = new Array();

            var resources = response.data;
            var length = resources.length;
            var promises = [];
            var defer = $q.defer();

            for (var i = 0; i < length; i++) {
                promises.push(Sonar.metrics(resources[i].key).then(function(response) {
                    var project = response.data[0];

                    $scope.metrics.push({
                        name: project.name,
                        lines: project.msr[0].val,
                        methodComplexity: project.msr[1].val,
                        fileComplexity: project.msr[2].val,
                        coverage: project.msr[3].val,
                        compliance: project.msr[4].val
                    });
                }));
            }

            $q.all(promises).then(calculateMetrics);
        });
    }
]);