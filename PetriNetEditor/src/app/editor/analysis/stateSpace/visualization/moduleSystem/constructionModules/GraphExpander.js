'use strict';

(function () {
    angular.module('SSConstructionModules')
        .factory('GraphExpander', function (CanvasModule, spinnerService) {

            function GraphExpander() {
            }

            var modulePrototype = createjs.extend(GraphExpander, CanvasModule);
            modulePrototype._doInit = function () {
                var module = this;
                this._listenerTokens = [
                    this._eventManager.addListener('markingClick', function (mcEvent) {
                        if (mcEvent.button === 'right') {
                            module._handleMarkingExpansion(mcEvent.marking);
                        }
                    })
                ];
            };

            modulePrototype._handleMarkingExpansion = function (marking) {
                if (!marking.duplicity) {
                    spinnerService.show('analysisSpinner');

                    var promise;
                    var graphBuilder = this._moduleBus.getModule('ssGraphBuilder');
                    if (marking.expanded) {
                        promise = graphBuilder.collapseMarking(marking);
                    }
                    else {
                        promise = graphBuilder.expandMarking(marking);
                    }

                    var module = this;
                    promise
                        .then(function (changesOccured) {
                            if (changesOccured) {
                                var globalPos = marking.getGlobalCenter();
                                var shifted = module._navigator.centerPoint(globalPos);
                                if (!shifted) {
                                    module._navigator._updateObjectVisibility();
                                }

                                var markingSelector = module._moduleBus.getModule('markingSelector');
                                markingSelector.clear();
                                module._stageHandler.updateStage();
                            }
                        })
                        .finally(function () {
                            spinnerService.hide('analysisSpinner');
                        });
                }
            };

            modulePrototype.dispose = function () {
                var module = this;
                _.forEach(this._listenerTokens, function (token) {
                    module._eventManager.clearListener(token);
                });
                this._listenerTokens = undefined;
            };


            return GraphExpander;
        });
}());