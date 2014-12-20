'use strict';

angular.module('app.dashboard').directive('lineChart', function() {
    return {
        restrict: 'A',
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
                        element: element,
                        data: dataPoints,
                        xkey: 'label',
                        ykeys: ['value'],
                        labels: [attrs.property]
                    });
                }
            }, true);
        }
    };
});