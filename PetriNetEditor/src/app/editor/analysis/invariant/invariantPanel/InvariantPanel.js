'use strict';

(function () {
    angular.module('InvDirectives', [])
        .directive('invariantPanel', function ($rootScope, $timeout, $mdDialog) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    invariants: '=',
                    type: '@'
                },
                link: function (scope) {
                    scope.$watch('invariants', function (newVal) {
                        _.forEach(newVal, function (invariant) {
                            var strInv = '(' + _.pluck(invariant.struct, 'value') + ')';
                            invariant.structStr = strInv;

                            var sysStrs = buildSystemInvariantString(invariant);
                            var sysStr = sysStrs.length ? sysStrs[0] : 'Unrealizable';
                            invariant.systemStr = sysStr;
                        });
                        scope.hasInvariants = newVal && newVal.length > 0;
                    });

                    scope.vectorName = scope.type === 'P' ? 'Y' : 'X';

                    scope.highlightInvariant = function (inv) {
                        var invData = _.filter(inv.struct, function (data) {
                            return data.value > 0;
                        });
                        invData = _.map(invData, function (data) {
                            return {id: data.id, data: data.value.toString()};
                        });
                        notifyInvariantHighlight({
                            identificationMethod: 'invariant',
                            highlightType: 'accent',
                            objects: invData
                        });
                    };
                    scope.clearHighlight = function () {
                        notifyInvariantHighlight();
                    };

                    scope.showDetailsOf = function (inv) {
                        var type = scope.type;

                        $mdDialog.show({
                            clickOutsideToClose: true,
                            templateUrl: 'editor/analysis/invariant/invariantPanel/invariantDialog.tmpl.html',
                            controller: function ($scope) {
                                $scope.invariant = inv;
                                $scope.vectorType = type;
                                $scope.vectorName = $scope.vectorType === 'P' ? 'Y' : 'X';

                                $scope.sysInvStrs = buildSystemInvariantString(inv);

                                $scope.close = function () {
                                    $mdDialog.cancel();
                                };
                            }
                        });
                    };

                    function notifyInvariantHighlight(data) {
                        $timeout(function () {
                            $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                        });
                    }

                    function buildSystemInvariantString(invariant) {
                        var strInvs = [];
                        if (scope.type === 'P') {
                            strInvs.push(invariant.system.toString());
                        }
                        else {
                            _.forEach(invariant.system, function (sysInv) {
                                var invStr = _.pluck(sysInv, 'name').join(', ');
                                strInvs.push(invStr);
                            });
                        }

                        return strInvs;
                    }
                },
                templateUrl: 'editor/analysis/invariant/invariantPanel/invariantPanel.tmpl.html'
            };
        });
}());