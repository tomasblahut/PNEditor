'use strict';

(function () {
    angular.module('NetEditor', [
        'ui.router',
        'Modelling',
        'Analysis'
    ])
        .config(function ($stateProvider) {
            $stateProvider.state('netEditor', {
                abstract: true,
                templateUrl: 'editor/editor.html',
                controller: 'netEditorCtrl'
            });
        })
        .controller('netEditorCtrl', function ($scope) {
            $scope.editor = {
                settings: {
                    analysisEnabled: false
                }
            };
        });
})();
