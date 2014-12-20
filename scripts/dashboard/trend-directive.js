'use strict';

angular.module('app.dashboard').directive('lineChart', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'partial/trend-panel.html',
        scope: {
            title: '@title',
            property: '@property',
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

                    Morris.Line({
                        element: attrs.property,
                        data: dataPoints,
                        xkey: 'label',
                        ykeys: ['value'],
                        labels: [attrs.title],
                        xLabels: 'month',
                        xLabelAngle: 45
                    });
                }
            }, true);
        }
    };
});