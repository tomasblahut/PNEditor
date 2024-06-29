'use strict';

(function () {
    angular.module('NetProperties', [
        'NetPropertyDirectives'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('netProperties', {
                parent: 'model',
                url: '/netProperties',
                templateUrl: 'editor/analysis/netProperties/netProperties.tmpl.html',
                controller: 'netPropertiesCtrl'
            });
        })
        .controller('netPropertiesCtrl', function ($scope) {

            $scope.$watch('netProperties', function () {
                refreshProperties();
            });

            function refreshProperties() {
                $scope.properties = $scope.netProperties || [];
            }
        });
})();