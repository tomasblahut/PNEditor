'use strict';

(function () {
    angular.module('SSDirectives', [])
        .directive('netStatePanel', function ($rootScope, $mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: {},
                link: function (scope) {
                    var listenerTokens = [
                        $rootScope.$on('marking_focused', function (event, args) {
                            handleMarkingFocus(_.get(args, 'marking'));
                        }),
                        $rootScope.$on('marking_selected', function (event, args) {
                            handleMarkingSelection(_.get(args, 'marking'));
                        })
                    ];

                    scope.showNetStateDialog = function () {
                        var marking = identifyCurrentMarking();
                        if (!marking) {
                            return;
                        }

                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/stateSpace/netStatePanel/netStateDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.markingName = marking.name;
                                $scope.netState = mapOmegaNetState(marking.netState);

                                $scope.close = function () {
                                    $mdDialog.hide();
                                };
                            }
                        });
                    };

                    function handleMarkingFocus(marking) {
                        scope.focusedMarking = marking;
                        refreshMarkingGui();
                    }

                    function handleMarkingSelection(marking) {
                        scope.selectedMarking = marking;
                        refreshMarkingGui();
                    }

                    function identifyCurrentMarking() {
                        var marking = scope.focusedMarking;
                        if (!marking) {
                            marking = scope.selectedMarking;
                        }
                        return marking;
                    }

                    function refreshMarkingGui() {
                        var marking = identifyCurrentMarking();
                        scope.activeSelection = typeof marking !== 'undefined';

                        scope.markingName = undefined;
                        scope.markingValue = undefined;
                        if (scope.activeSelection) {
                            scope.markingName = _.get(marking, 'name');
                            scope.markingValue = '(' + _.pluck(mapOmegaNetState(marking.netState), 'tokens').join(', ') + ')';
                        }
                    }

                    function mapOmegaNetState(netState) {
                        return _.map(netState, function (state) {
                            var stateClone = _.cloneDeep(state);
                            stateClone.tokens = stateClone.tokens === -1 ? 'ω' : stateClone.tokens.toString();
                            return stateClone;
                        });
                    }

                    scope.$on('destroy', function () {
                        _.forEach(listenerTokens, function (listener) {
                            listener();
                        });
                    });
                    refreshMarkingGui();
                },
                templateUrl: 'editor/analysis/stateSpace/netStatePanel/netStatePanel.tmpl.html'
            };
        })
        .filter('netStateFilter', function () {
            return function (input, compareTo) {
                return _.filter(input, function (item) {
                    var name = item.placeName.toLowerCase();
                    var tokens = item.tokens.toString();

                    var actCompareValue = compareTo && compareTo.toLowerCase();
                    if (!actCompareValue) {
                        return true;
                    }

                    return name.indexOf(compareTo) !== -1 ||
                        tokens.indexOf(compareTo) !== -1 ||
                        (compareTo === 'omega' && tokens === 'ω');
                });
            };
        });
}());