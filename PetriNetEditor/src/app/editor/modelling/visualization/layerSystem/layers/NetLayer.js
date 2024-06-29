'use strict';

(function () {
    angular.module('PNLayers', [
        'CanvasLayers'
    ])
        .factory('NetLayer', function (CanvasLayer) {

            function NetLayer() {
                CanvasLayer.call(this);
            }

            var layerPrototype = createjs.extend(NetLayer, CanvasLayer);

            layerPrototype._doInit = function () {
                this._places = new createjs.Container();
                this._transitions = new createjs.Container();
                this._arcs = new createjs.Container();
                this.addChild(this._arcs, this._transitions, this._places);

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
                this._placesListenerTokens = {
                    click: this._places.on('click', function (event) {
                        layer._eventManager.fireEvent('placeClick', event);
                    }),
                    mousedown: this._places.on('mousedown', function (event) {
                        layer._eventManager.fireEvent('placeMousedown', event);
                    }),
                    mouseover: this._places.on('mouseover', function (event) {
                        layer._eventManager.fireEvent('placeMouseover', event);
                    }),
                    mouseout: this._places.on('mouseout', function (event) {
                        layer._eventManager.fireEvent('placeMouseout', event);
                    })
                };
                this._transitionListenerTokens = {
                    click: this._transitions.on('click', function (event) {
                        layer._eventManager.fireEvent('transitionClick', event);
                    }),
                    mousedown: this._transitions.on('mousedown', function (event) {
                        layer._eventManager.fireEvent('transitionMousedown', event);
                    }),
                    mouseover: this._transitions.on('mouseover', function (event) {
                        layer._eventManager.fireEvent('transitionMouseover', event);
                    }),
                    mouseout: this._transitions.on('mouseout', function (event) {
                        layer._eventManager.fireEvent('transitionMouseout', event);
                    })
                };
                this._arcListenerTokens = {
                    mousedown: this._arcs.on('mousedown', function (event) {
                        layer._eventManager.fireEvent('arcMousedown', event);
                    }),
                    click: this._arcs.on('click', function (event) {
                        layer._eventManager.fireEvent('arcClick', event);
                    })
                };

                this.eventsRegistered = true;
            };
            layerPrototype.disposeEvents = function () {
                if (this.eventsRegistered) {
                    var layer = this;
                    _.forEach(this._placesListenerTokens, function (wrapper, type) {
                        layer._places.off(type, wrapper);
                    });
                    this._placesListenerTokens = undefined;

                    _.forEach(this._transitionListenerTokens, function (wrapper, type) {
                        layer._transitions.off(type, wrapper);
                    });
                    this._transitionListenerTokens = undefined;

                    _.forEach(this._arcListenerTokens, function (wrapper, type) {
                        layer._arcs.off(type, wrapper);
                    });
                    this._arcListenerTokens = undefined;

                    this.eventsRegistered = false;
                }
            };

            layerPrototype.addPlace = function (place) {
                return this._places.addChild(place);
            };
            layerPrototype.addTransition = function (transition) {
                return this._transitions.addChild(transition);
            };
            layerPrototype.addArc = function (arc) {
                return this._arcs.addChild(arc);
            };

            layerPrototype.removePlace = function (place) {
                this._places.removeChild(place);
            };
            layerPrototype.removeTransition = function (transition) {
                this._transitions.removeChild(transition);
            };
            layerPrototype.removeArc = function (arc) {
                this._arcs.removeChild(arc);
            };

            layerPrototype.findPTObject = function (obj, type) {
                var objId = obj ? typeof obj === 'string' ? obj : obj.id : undefined;
                var collection = this.findPTObjects(type);
                var canvasObj;

                if (collection) {
                    canvasObj = _.find(collection, function (curObj) {
                        return curObj.id === objId;
                    });
                }
                return canvasObj;
            };
            layerPrototype.findPTObjects = function (types) {
                var actTypes = types ? [].concat(types) : [];

                var collection = [];
                if (!actTypes.length || actTypes.indexOf('place') !== -1) {
                    collection = collection.concat(this._places.children);
                }

                if (!actTypes.length || actTypes.indexOf('transition') !== -1) {
                    collection = collection.concat(this._transitions.children);
                }

                if (!actTypes.length || actTypes.indexOf('arc') !== -1) {
                    collection = collection.concat(this._arcs.children);
                }
                return collection;
            };

            layerPrototype.findArc = function (srcId, destId) {
                return _.find(this._arcs.children, function (arc) {
                    return arc.src.id === srcId && arc.dest.id === destId;
                });
            };
            layerPrototype.findConnectedArcs = function (objId) {
                var arcs = [];
                if (objId) {
                    arcs = _.filter(this._arcs.children, function (child) {
                        return child.src.id === objId || child.dest.id === objId;
                    });
                }
                return arcs;
            };

            layerPrototype.findObjectsWithin = function (rectangle) {
                var localRectStartPoint = this.globalToLocal(rectangle.x, rectangle.y);
                var localRectEndPoint = this.globalToLocal(rectangle.x + rectangle.width, rectangle.y + rectangle.height);

                var places = _.filter(this._places.children, function (place) {
                    var center = place.getCenter();
                    var xCorrect = center.x >= localRectStartPoint.x && center.x <= localRectEndPoint.x;
                    var yCorrect = center.y >= localRectStartPoint.y && center.y <= localRectEndPoint.y;
                    return xCorrect && yCorrect;
                });
                var transitions = _.filter(this._transitions.children, function (transition) {
                    var center = transition.getCenter();
                    var xCorrect = center.x >= localRectStartPoint.x && center.x <= localRectEndPoint.x;
                    var yCorrect = center.y >= localRectStartPoint.y && center.y <= localRectEndPoint.y;
                    return xCorrect && yCorrect;
                });
                var arcs = _.filter(this._arcs.children, function (arc) {
                    var matches = false;

                    _.forEach(arc.points, function (point) {
                        var xCorrect = point.x >= localRectStartPoint.x && point.x <= localRectEndPoint.x;
                        var yCorrect = point.y >= localRectStartPoint.y && point.y <= localRectEndPoint.y;
                        matches = xCorrect && yCorrect;
                        return !matches;
                    });

                    return matches;
                });

                return {places: places, transitions: transitions, arcs: arcs};
            };

            layerPrototype.getDisplayObjects = function () {
                return this._places.children.concat(this._transitions.children, this._arcs.children);
            };
            layerPrototype.clearContent = function () {
                this._places.removeAllChildren();
                this._transitions.removeAllChildren();
                this._arcs.removeAllChildren();
            };

            return NetLayer;
        });
})();