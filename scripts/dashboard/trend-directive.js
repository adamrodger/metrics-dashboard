'use strict';

angular.module('app.dashboard').directive('lineChart', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'partial/trend-panel.html',
        scope: {
            title: '@title',
            property: '@property',
            goal: '=goal',
            unit: '@unit',
            metrics: '=metrics'
        },
        link: function($scope, element, attrs) {
            $scope.$watch('metrics', function(data) {
                if (data && data.length) {
                    var dataPoints = data.map(function(value) {
                        return {
                            label: value.date.format('YYYY-MM'),
                            value: value[attrs.property]
                        }
                    });

                    var properties = {
                        element: attrs.property,
                        data: dataPoints,
                        xkey: 'label',
                        ykeys: ['value'],
                        labels: [attrs.title],
                        xLabels: 'month',
                        xLabelAngle: 45,
                        hideHover: 'auto',
                        smooth: false
                    };

                    if ($scope.goal) {
                        properties.goals = [$scope.goal];
                        properties.goalLineColors = ['red'];
                    }

                    if ($scope.unit) {
                        properties.postUnits = $scope.unit;
                    }

                    Morris.Line(properties);
                }
            }, true);
        }
    };
});