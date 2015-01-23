'use strict';

angular.module('app.sonar').controller('SonarCtrl', ['$scope', '$log', '$q', 'appConfig', 'Sonar',
    function($scope, $log, $q, appConfig, Sonar) {
        $scope.metrics = new Array();
        $scope.goals = appConfig.sonar.goals;

        function sum(array, property) {
            return array.reduce(function(total, project) {
                return total + project[property];
            }, 0);
        }

        // primes a new metrics list with an empty entry for the end of each of the last 12 months, plus this month so far
        function generateTimePeriods() {
            var timePeriods = [];

            var now = moment().endOf("month"); // end of the current month
            var currentPeriod = moment(now).subtract(12, 'month').endOf('month');

            while (currentPeriod <= now) {
                timePeriods.push({
                    date: currentPeriod,
                    metrics: []
                });
                currentPeriod = moment(currentPeriod).add(1, 'month').endOf('month');
            }

            return timePeriods;
        }

        // for each time period, aggregate the metrics for all projects, weighted by lines
        function calculateMetrics(timePeriods) {
            $log.info('Calculating metrics from retrieved data');

            $scope.metrics = [];
            var periodsLength = timePeriods.length;

            for (var i = 0; i < periodsLength; i++) {
                var timePeriod = timePeriods[i];
                var totalLines = sum(timePeriod.metrics, 'lines');

                var weightedMetrics = timePeriod.metrics.map(function(project) {
                    var factor = project.lines / totalLines;

                    return {
                        methodComplexity: factor * project.methodComplexity,
                        fileComplexity: factor * project.fileComplexity,
                        coverage: factor * project.coverage,
                        compliance: factor * project.compliance,
                    };
                });

                $scope.metrics.push({
                    date: timePeriod.date,
                    totalLines: totalLines,
                    methodComplexity: sum(weightedMetrics, 'methodComplexity').toFixed(2),
                    fileComplexity: sum(weightedMetrics, 'fileComplexity').toFixed(2),
                    coverage: sum(weightedMetrics, 'coverage').toFixed(2),
                    compliance: sum(weightedMetrics, 'compliance').toFixed(2)
                });
            }

            $scope.latest = $scope.metrics[$scope.metrics.length - 1];
            $scope.previous = $scope.metrics[$scope.metrics.length - 2];

            $log.info('Finished calculating metrics');
        }

        function processTimePeriod(resource, timePeriod) {
            // TODO: optimise to use the end of the previous period instead of always selecting all data.
            // Not as easy as it sounds because a project might not have changed in that period so you'd
            // need to use the last value from the previous period instead, but each one loads async. At
            // least this way guarantees you always have at least 1 value
            return Sonar.metrics(resource.key, timePeriod.date).then(function(response) {
                var cells = response.data[0].cells;

                if (cells.length === 0) {
                    // project didn't exist at this point
                    return;
                }

                // use the final value for the requested period
                var project = cells[cells.length - 1];

                timePeriod.metrics.push({
                    name: resource.name,
                    lines: project.v[0],
                    methodComplexity: project.v[1],
                    fileComplexity: project.v[2],
                    coverage: project.v[3],
                    compliance: project.v[4]
                });

                $log.debug('Successfully retrieved metrics for %s during %s', resource.name, timePeriod.date.format('YYYY-MM'));
            });
        }

        function processResources(resources, timePeriods) {
            var length = resources.length;
            var periodsLength = timePeriods.length;
            var promises = [];
            var defer = $q.defer();

            // for each project, for each required time period, get final metrics for that period
            for (var i = 0; i < length; i++) {
                for (var j = 0; j < periodsLength; j++) (function(resource, timePeriod) {
                    promises.push(processTimePeriod(resource, timePeriod));
                })(resources[i], timePeriods[j]);
            }

            $q.all(promises).then(function() { calculateMetrics(timePeriods); });
        }

        // load all data from the Sonar service and aggregate results
        Sonar.resources().then(function(response) {
            var timePeriods = generateTimePeriods();
            processResources(response.data, timePeriods);
        });
    }
]);