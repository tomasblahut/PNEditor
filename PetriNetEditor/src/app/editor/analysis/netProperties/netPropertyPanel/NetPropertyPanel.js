'use strict';

(function () {
    angular.module('NetPropertyDirectives', [])
        .directive('netPropertyPanel', function () {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    property: '='
                },
                link: function (scope) {
                    scope.guiData = {
                        hasAdditionalData: !_.isEmpty(scope.property.additionalData),
                        hasErrors: !_.isEmpty(scope.property.errors),
                        hasReasons: !_.isEmpty(scope.property.reasons),
                        statusResolved: !_.isNull(scope.property.status) && !_.isUndefined(scope.property.status)
                    };

                    var templateUrl;
                    switch (scope.property.type) {
                        case 'BOUNDEDNESS':
                        {
                            templateUrl = 'editor/analysis/netProperties/netPropertyPanel/additionalDataTemplates/boundedness.tmpl.html';
                            break;
                        }
                    }
                    scope.guiData.templateUrl = templateUrl;
                },
                templateUrl: 'editor/analysis/netProperties/netPropertyPanel/netPropertyPanel.tmpl.html'
            };
        });
}());