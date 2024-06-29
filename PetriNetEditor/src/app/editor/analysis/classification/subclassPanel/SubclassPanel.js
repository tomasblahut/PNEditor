'use strict';

(function () {
    angular.module('ClassificationDirectives', [])
        .directive('subclassPanel', function ($rootScope, $mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    subclass: '='
                },
                link: function (scope) {
                    scope.guiData = {
                        hasAdditionalData: !_.isEmpty(scope.subclass.additionalData)
                    };

                    if (scope.guiData.hasAdditionalData) {
                        var guiAddData = parseAdditionalData();
                        scope.guiData.additionalDataTitle = guiAddData.title;
                        scope.guiData.additionalDataStr = guiAddData.strDataObjects.join(', ');
                    }

                    scope.highlightAdditionalData = function () {
                        var highlightObjects = [];
                        var additionalData = scope.subclass.additionalData;

                        switch (scope.subclass.type) {
                            case 'Ordinary':
                            {
                                highlightObjects = additionalData.arcViolations;
                                break;
                            }
                            case 'State machine':
                            case 'Free choice':
                            {
                                highlightObjects = additionalData.transitionViolations;
                                break;
                            }
                            case 'Marked graph':
                            {
                                highlightObjects = additionalData.placeViolations;
                                break;
                            }
                        }

                        var highlighData = {
                            identificationMethod: 'byId',
                            highlightType: 'accent',
                            objects: _.map(highlightObjects, function (data) {
                                return {id: data.id};
                            })
                        };
                        notifyHighlight(highlighData);
                    };
                    scope.clearHighlight = function () {
                        notifyHighlight();
                    };

                    scope.showAdditionalData = function () {
                        var subclass = scope.subclass;

                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/classification/subclassPanel/subclassDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.subclassName = subclass.type;

                                var additionalData = parseAdditionalData();
                                $scope.errorsTitle = additionalData.title;
                                $scope.errors = additionalData.strDataObjects;

                                $scope.close = function () {
                                    $mdDialog.hide();
                                };
                            }
                        });
                    };

                    function notifyHighlight(data) {
                        $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                    }

                    function parseAdditionalData() {
                        var result = {};
                        var strViolations = [];
                        var additionalData = scope.subclass.additionalData;

                        switch (scope.subclass.type) {
                            case 'Ordinary':
                            {
                                strViolations = _.map(additionalData.arcViolations, function (arcViolation) {
                                    return arcViolation.srcName + ' ⇾ ' + arcViolation.destName;
                                });
                                result.title = 'Erroneous arcs';
                                break;
                            }
                            case 'State machine':
                            case 'Free choice':
                            {
                                strViolations = _.pluck(additionalData.transitionViolations, 'name');
                                result.title = 'Erroneous transitions';
                                break;
                            }
                            case 'Marked graph':
                            {
                                strViolations = _.pluck(additionalData.placeViolations, 'name');
                                result.title = 'Erroneous places';
                                break;
                            }
                        }

                        result.strDataObjects = strViolations;
                        return result;
                    }
                },
                templateUrl: 'editor/analysis/classification/subclassPanel/subclassPanel.tmpl.html'
            };
        });
}());