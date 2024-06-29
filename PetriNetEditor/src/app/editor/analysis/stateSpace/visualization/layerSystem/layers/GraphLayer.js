'use strict';

(function () {
    angular.module('SSLayers', [
        'CanvasLayers'
    ])
        .factory('GraphLayer', function (CanvasLayer) {

            function GraphLayer() {
                this.Super_constructor();
            }

            var layerPrototype = createjs.extend(GraphLayer, CanvasLayer);

            layerPrototype._doInit = function () {
                this._markings = new createjs.Container();
                this._markingIdMap = {};

                this._arcs = new createjs.Container();
                this._arcIdMap = {};

                this.addChild(this._arcs, this._markings);
                this.setupEvents();
            };

            layerPrototype._doDispose = function () {
                this.clearContent();
                this.disposeEvents();
            };

            layerPrototype.setupEvents = function () {
                if (this.eventsRegistered) {
                    throw new Error('Events already registered for this object');
                }

                var layer = this;
                this._markingListenerTokens = {
                    click: this._markings.on('click', function (event) {
                        layer._eventManager.fireEvent('markingClick', event);
                    }),
                    mouseover: this._markings.on('mouseover', function (event) {
                        layer._eventManager.fireEvent('markingMouseover', event);
                    }),
                    mouseout: this._markings.on('mouseout', function (event) {
                        layer._eventManager.fireEvent('markingMouseout', event);
                    })
                };

                this.eventsRegistered = true;
            };
            layerPrototype.disposeEvents = function () {
                if (this.eventsRegistered) {
                    var layer = this;
                    _.forEach(this._markingListenerTokens, function (wrapper, type) {
                        layer._markings.off(type, wrapper);
                    });
                    this._markingListenerTokens = undefined;

                    this.eventsRegistered = false;
                }
            };

            layerPrototype.addMarking = function (marking) {
                this._markingIdMap[marking.id] = marking;
                return this._markings.addChild(marking);
            };
            layerPrototype.addArc = function (arc) {
                this._arcIdMap[arc.id] = arc;
                return this._arcs.addChild(arc);
            };

            layerPrototype.findMarking = function (marking) {
                var markingId = marking ? typeof marking === 'string' ? marking : marking.id : undefined;
                if (!markingId) {
                    throw new Error('Cannot search marking without ID');
                }
                return this._markingIdMap[markingId];
            };
            layerPrototype.findSameMarkings = function (marking) {
                return _.filter(this._markings.children, function (child) {
                    return marking.name === child.name;
                });
            };
            layerPrototype.findArc = function (arc) {
                var arcId = arc ? typeof arc === 'string' ? arc : arc.id : undefined;
                if (!arcId) {
                    throw new Error('Cannot search arc without ID');
                }
                return this._arcIdMap[arcId];
            };
            layerPrototype.findConnectedArcs = function (marking) {
                return _.filter(this._arcs.children, function (arc) {
                    return arc.src.id === marking.id || arc.dest.id === marking.id;
                });
            };

            layerPrototype.removeMarking = function (marking) {
                var markingId = marking ? typeof marking === 'string' ? marking : marking.id : undefined;
                var canvasMarking = this._markingIdMap[markingId];
                if (canvasMarking) {
                    delete this._markingIdMap[markingId];
                    this._markings.removeChild(canvasMarking);
                }
            };
            layerPrototype.removeArc = function (arc) {
                var arcId = arc ? typeof arc === 'string' ? arc : arc.id : undefined;
                var canvasArc = this._arcIdMap[arcId];
                if (canvasArc) {
                    delete this._arcIdMap[arc];
                    this._arcs.removeChild(canvasArc);
                }
            };

            layerPrototype.sendToFront = function (arcs) {
                var layer = this;
                _.forEach(arcs, function (arc) {
                    var arcId = arc ? typeof arc === 'string' ? arc : arc.id : undefined;
                    var guiArc = layer._arcIdMap[arcId];
                    if (guiArc) {
                        layer._arcs.removeChild(guiArc);
                        layer._arcs.addChild(guiArc);
                    }
                });
            };

            layerPrototype.getDisplayObjects = function () {
                var displayObjects = this._markings.children;
                displayObjects = displayObjects.concat(this._arcs.children);
                return displayObjects;
            };
            layerPrototype.clearContent = function () {
                this._markings.removeAllChildren();
                this._markingIdMap = {};

                this._arcs.removeAllChildren();
                this._arcIdMap = {};
            };

            return GraphLayer;
        });
})();