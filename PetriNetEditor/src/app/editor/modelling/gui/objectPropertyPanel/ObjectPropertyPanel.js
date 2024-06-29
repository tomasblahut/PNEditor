'use strict';

(function () {
    angular.module('PNGui')
        .directive('objectPropertyPanel', function ($timeout) {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function (scope) {
                    scope.save = function () {
                        if (scope.editedObject) {
                            var delegate = {
                                objId: scope.editedObject.id,
                                objType: scope.editedObject.type,
                                type: 'update',
                                updateGui: true,
                                changes: {}
                            };

                            var type = scope.editedObject.type;
                            if (type === 'place') {
                                delegate.changes.name = scope.editedObject.name;
                                delegate.changes.tokens = scope.editedObject.tokens;
                            }
                            else if (type === 'transition') {
                                delegate.changes.name = scope.editedObject.name;
                            }
                            else if (type === 'arc') {
                                delegate.srcId = scope.editedObject.src.id;
                                delegate.destId = scope.editedObject.dest.id;
                                delegate.changes.multiplicity = scope.editedObject.multiplicity;
                            }

                            scope.pnManager.applyChanges(delegate);
                        }
                    };

                    var listeners = [
                        scope.$on('objectSelected', function (event, args) {
                            $timeout(function () {
                                var object = _.get(args, 'object');
                                scope.editedObject = object;
                            });
                        }),
                        scope.$on('selectionCleared', function () {
                            $timeout(function () {
                                delete scope.editedObject;
                            });
                        })
                    ];

                    scope.$on('destroy', function () {
                        _.forEach(listeners, function (listener) {
                            listener();
                        });
                    });
                },
                templateUrl: 'editor/modelling/gui/objectPropertyPanel/objectPropertyPanel.tmpl.html'
            };
        });
}());