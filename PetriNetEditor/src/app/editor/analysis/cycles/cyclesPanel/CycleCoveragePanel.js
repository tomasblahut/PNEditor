'use strict';

(function () {
    angular.module('CyclesDirectives')
        .directive('cycleCoveragePanel', function ($rootScope, $timeout, $mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    carrierData: '='
                },
                link: function (scope) {
                    scope.$watch('carrierData', function (newVal) {
                        var places = _.get(newVal, 'places');
                        var trans = _.get(newVal, 'transitions');
                        scope.hasData = !_.isUndefined(places) && !_.isUndefined(trans);

                        scope.placesNotCovered = scope.hasData ? (_.get(places, 'names') || []).join(', ') : undefined;
                        scope.transNotCovered = scope.hasData ? (_.get(trans, 'names') || []).join(', ') : undefined;
                    });


                    scope.highlightNotCoveredPlaces = function () {
                        highlightNotCoveredObjects(_.get(scope.carrierData, 'places.ids'));
                    };
                    scope.highlightNotCoveredTrans = function () {
                        highlightNotCoveredObjects(_.get(scope.carrierData, 'transitions.ids'));
                    };
                    scope.clearHighlight = function () {
                        notifyHighlight();
                    };

                    function highlightNotCoveredObjects(objectIds) {
                        if (objectIds) {
                            var highlightObjects = _.map(objectIds, function (objId) {
                                return {id: objId};
                            });
                            notifyHighlight({
                                identificationMethod: 'byId',
                                highlightType: 'accent',
                                objects: highlightObjects
                            });
                        }
                    }

                    scope.showAllNotCoveredPlaces = function () {
                        showNotCoveredObjectDialog('places', _.get(scope.carrierData, 'places.names'));
                    };
                    scope.showAllNotCoveredTrans = function () {
                        showNotCoveredObjectDialog('transitions', _.get(scope.carrierData, 'transitions.names'));
                    };

                    function showNotCoveredObjectDialog(dialogTitle, objectNames) {
                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/cycles/cyclesPanel/cycleCoverageDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.dialogTitle = dialogTitle;
                                $scope.objectNames = objectNames;

                                $scope.close = function () {
                                    $mdDialog.cancel();
                                };
                            }
                        });
                    }

                    function notifyHighlight(data) {
                        $timeout(function () {
                            $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                        });
                    }
                },
                templateUrl: 'editor/analysis/cycles/cyclesPanel/cycleCoveragePanel.tmpl.html'
            };
        });
}());