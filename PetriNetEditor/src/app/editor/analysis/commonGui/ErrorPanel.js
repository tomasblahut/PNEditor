'use strict';

(function () {
    angular.module('AnalysisDirectives', [])
        .directive('errorPanel', function () {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    errors: '='
                },
                link: function (scope) {
                    scope.$watch('errors', function () {
                        updateErrorGui();
                    });

                    function updateErrorGui() {
                        scope.hasErrors = scope.errors && scope.errors.length > 0;
                        scope.errorMsg = scope.hasErrors ? scope.errors.join('. ') : undefined;
                    }

                    updateErrorGui();
                },
                templateUrl: 'editor/analysis/commonGui/errorPanel.tmpl.html'
            };
        });
}());