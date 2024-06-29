'use strict';

(function () {
    angular.module('SSNavigationModules', [
        'CanvasModules'
    ])
        .factory('MarkingSelector', function ($rootScope, $timeout, $mdDialog, CanvasModule) {

            function MarkingSelector() {
            }

            var modulePrototype = createjs.extend(MarkingSelector, CanvasModule);
            modulePrototype._doInit = function () {
                var module = this;
                this._listenerTokens = [
                    this._eventManager.addListener('markingClick', function (mcEvent) {
                        if (mcEvent.button === 'left') {
                            module._selectMarking(mcEvent.marking);
                        }
                    }),
                    this._eventManager.addListener('bgClick', function (bcEvent) {
                        if (bcEvent.button === 'left') {
                            module._unselectMarking();
                            module._stageHandler.updateStage();
                        }
                    }),
                    this._eventManager.addListener('markingMouseover', function (mmovEvent) {
                        module._focusMarking(mmovEvent.marking);
                    }),
                    this._eventManager.addListener('markingMouseout', function () {
                        module._unfocusMarking();
                        module._stageHandler.updateStage();
                    })
                ];
            };

            modulePrototype._selectMarking = function (marking) {
                var select = this._selectedMarking !== marking && typeof marking !== 'undefined';
                this._unselectMarking();

                if (select) {
                    this._selectedMarking = marking;
                    var ssBuilder = this._moduleBus.getModule('ssGraphBuilder');
                    var objects = ssBuilder.findSameMarkings(marking);

                    var arcs = this._sendArcsToFront(marking);
                    objects = objects.concat(arcs);

                    var highlighter = this._moduleBus.getModule('highlighter');
                    this._selectionToken = highlighter.highlightObjects({
                        highlightType: 'selection',
                        objects: objects
                    });

                    this._notifyMarkingSelected();
                }
                else {
                    this._stageHandler.updateStage();
                }
            };
            modulePrototype._unselectMarking = function () {
                if (this._selectedMarking) {
                    var highlighter = this._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(this._selectionToken, true);
                    delete this._selectionToken;
                    this._notifyMarkingUnselected();
                }
                delete this._selectedMarking;
            };
            modulePrototype._notifyMarkingSelected = function () {
                var marking = this._loadMarkingNetState(this._selectedMarking);
                $timeout(function () {
                    $rootScope.$broadcast('marking_selected', {marking: marking});
                });
            };
            modulePrototype._notifyMarkingUnselected = function () {
                $timeout(function () {
                    $rootScope.$broadcast('marking_selected', {});
                });
            };

            modulePrototype._focusMarking = function (marking) {
                if (marking) {
                    this._focusedMarking = marking;
                    var ssBuilder = this._moduleBus.getModule('ssGraphBuilder');
                    var objects = ssBuilder.findSameMarkings(marking);

                    var arcs = this._sendArcsToFront(marking);
                    objects = objects.concat(arcs);

                    var highlighter = this._moduleBus.getModule('highlighter');
                    this._focusToken = highlighter.highlightObjects({highlightType: 'focus', objects: objects});

                    this._notifyMarkingFocused();
                }
            };
            modulePrototype._unfocusMarking = function () {
                if (this._focusedMarking) {
                    var highlighter = this._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(this._focusToken, true);
                    delete this._focusToken;
                    this._notifyMarkingUnfocused();
                }
                delete this._focusedMarking;
            };
            modulePrototype._notifyMarkingFocused = function () {
                var marking = this._loadMarkingNetState(this._focusedMarking);
                $timeout(function () {
                    $rootScope.$broadcast('marking_focused', {marking: marking});

                    var netState = _.get(marking, 'netState');
                    var data = {
                        identificationMethod: 'byId',
                        highlightType: 'accent',
                        objects: netState ? _.map(netState, function (state) {
                            return {
                                id: state.placeId,
                                data: state.tokens === -1 ? 'ω' : state.tokens.toString()
                            };
                        }) : undefined
                    };
                    $rootScope.$broadcast('highlight_pn_objects', {highlightData: data});
                });
            };
            modulePrototype._notifyMarkingUnfocused = function () {
                $timeout(function () {
                    $rootScope.$broadcast('marking_focused', {});
                    $rootScope.$broadcast('highlight_pn_objects', {});
                });
            };

            modulePrototype._sendArcsToFront = function (marking) {
                if (marking) {
                    var graphLayer = this._layerBus.getLayer('graph');
                    var arcs = graphLayer.findConnectedArcs(marking);
                    graphLayer.sendToFront(arcs);
                    return arcs;
                }
            };
            modulePrototype._loadMarkingNetState = function (marking) {
                if (marking) {
                    var ssBuilder = this._moduleBus.getModule('ssGraphBuilder');
                    var markingClone = {
                        name: marking.name,
                        netState: _.sortBy(ssBuilder.loadNetState(marking), 'placeName')
                    };
                    return markingClone;
                }
            };

            modulePrototype.clear = function () {
                this._unselectMarking();
                this._unfocusMarking();
            };
            modulePrototype.dispose = function () {
                var module = this;
                _.forEach(this._listenerTokens, function (token) {
                    module._eventManager.clearListener(token);
                });
                this._listenerTokens = undefined;
            };

            return MarkingSelector;
        });
}());