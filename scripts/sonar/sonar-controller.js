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
            var weighting = appConfig.sonar.weighting

            $scope.metrics = [];
            var periodsLength = timePeriods.length;

            for (var i = 0; i < periodsLength; i++) {
                var timePeriod = timePeriods[i];
                var totalLines = sum(timePeriod.metrics, 'lines');

                var sonarData = timePeriod.metrics.map(function(project) {

                    return {
                        numberOfMethods: project.totalMethods,
                        numberOfFiles: project.totalFiles,
                        projectComplexity: project.totalComplexity,
                        projectTestableLines: project.testableLines,
                        projectUntestableLines: project.untestedLines,
                        weightedBlockingIssues: weighting.blocker * project.blockerIssues,
                        weightedCriticalIssues: weighting.critical * project.criticalIssues,
                        weightedMajorIssues: weighting.major * project.majorIssues,
                        weightedMinorIssues: weighting.minor * project.minorIssues,
                        weightedInfoIssues: weighting.info * project.infoIssues
                    };
                });
                
                // Complexity calculations
                var methodComplexity = calculateMethodComplexity(sonarData);
                var fileComplexity = calculateFileComplexity(sonarData);
                
                // Compliance calculations
                var rulesCompliance = calculateCompliance(sonarData, totalLines);
                
                // Coverage calculations
                var codeCoverage = calculateLineCoverage(sonarData);
                
                // add the details for the complete time period
                $scope.metrics.push({
                    date: timePeriod.date,
                    totalLines: totalLines,
                    methodComplexity: methodComplexity.toFixed(2),
                    fileComplexity: fileComplexity.toFixed(2),
                    coverage: codeCoverage.toFixed(2),
                    compliance: rulesCompliance.toFixed(2)
                });
            }

            $scope.latest = $scope.metrics[$scope.metrics.length - 1];
            $scope.previous = $scope.metrics[$scope.metrics.length - 2];

            $log.info('Finished calculating metrics');
        }

        function calculateFileComplexity(sonarData) {
            var complexity = sum(sonarData, 'projectComplexity')
            return complexity / sum(sonarData, 'numberOfFiles')
        }
        
        function calculateMethodComplexity(sonarData){
            var complexity = sum(sonarData, 'projectComplexity')
            return complexity / sum(sonarData, 'numberOfMethods')
        }
        
        function calculateLineCoverage(sonarData){
            var testableLinesOfCode = sum(sonarData, 'projectTestableLines')
            var untestedLinesOfCode = sum(sonarData, 'projectUntestableLines')      
            
            return (((testableLinesOfCode - untestedLinesOfCode) / testableLinesOfCode) * 100) || 0
        }
        
        function calculateCompliance(sonarData, totalLines){
            var totalWeightedIssues = sum(sonarData, 'weightedBlockingIssues') + sum(sonarData, 'weightedCriticalIssues')
                                    + sum(sonarData, 'weightedMajorIssues') + sum(sonarData, 'weightedMinorIssues')
                                    + sum(sonarData, 'weightedInfoIssues');
                                    
            return (100 - (totalWeightedIssues / totalLines) * 100)
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
                    totalComplexity: project.v[1],
                    totalFiles: project.v[2],
                    totalMethods: project.v[3],
                    blockerIssues: project.v[4],
                    criticalIssues: project.v[5],
                    majorIssues: project.v[6],
                    minorIssues: project.v[7],
                    infoIssues: project.v[8],
                    testableLines: project.v[9],
                    untestedLines: project.v[10]
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
            var filteredResponseData = response.data.filter(function(project) {
                return project.name.match(appConfig.sonar.projectsRegex);
            });
            var timePeriods = generateTimePeriods();
            processResources(response.data, timePeriods);
        });
    }
]);