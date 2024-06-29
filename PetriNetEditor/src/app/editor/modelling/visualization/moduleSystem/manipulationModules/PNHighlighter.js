'use strict';

(function () {
    angular.module('PNManipulationModules')
        .factory('PNHighlighter', function (Highlighter, PNPlaceHighlights, PNTransitionHighlights, PNArcHighlights,
                                            PNHelperHighlights) {

            function PNHighlighter() {
                Highlighter.call(this);
            }

            var modulePrototype = createjs.extend(PNHighlighter, Highlighter);

            modulePrototype._identifyObjects = function (data) {
                var toHighlight = [];
                var identificationMethod = data.identificationMethod;

                switch (identificationMethod) {
                    case 'byId':
                    {
                        toHighlight = this._identifyObjectsById(data.objects);
                        break;
                    }
                    case 'invariant':
                    {
                        toHighlight = this._indentifyInvObjects(data.objects);
                        break;
                    }
                    case 'cycle':
                    {
                        toHighlight = this._identifyCycleObjects(data.objects);
                        break;
                    }
                    case 'connection':
                    {
                        toHighlight = this._identifyConnectionObjects(data);
                        break;
                    }
                    default:
                    {
                        toHighlight = _.map(data.objects, function (dataObj) {
                            return {obj: dataObj};
                        });
                        break;
                    }
                }

                return toHighlight;
            };

            modulePrototype._indentifyInvObjects = function (objects) {
                var toHighlight = [];
                var module = this;
                var pnConstructor = module._moduleBus.getModule('pnConstructor');

                _.forEach(objects, function (dataObj) {
                    var guiObject = pnConstructor.findPTObject(dataObj.id);
                    toHighlight.push({obj: guiObject, data: dataObj.data});

                    _.forEach(pnConstructor.findConnectedArcs(guiObject), function (arc) {
                        var highlightedArc = _.find(toHighlight, function (highlightedObj) {
                            var obj = highlightedObj.obj;
                            return obj.type === arc.type && obj.id === arc.id;
                        });
                        if (!highlightedArc) {
                            toHighlight.push({obj: arc});

                            var connectedObject;
                            if (arc.src.type === guiObject.type) {
                                connectedObject = arc.dest;
                            } else {
                                connectedObject = arc.src;
                            }

                            var highlightedObject = _.find(toHighlight, function (highlightedObj) {
                                var obj = highlightedObj.obj;
                                return obj.type === connectedObject.type && obj.id === connectedObject.id;
                            });
                            if (!highlightedObject) {
                                toHighlight.push({obj: connectedObject});
                            }
                        }
                    });
                });

                return toHighlight;
            };
            modulePrototype._identifyConnectionObjects = function (data) {
                var type;
                if (typeof data.positive === 'undefined') {
                    type = data.highlightType;
                }
                else {
                    type = data.positive ? 'connPos' : 'connNeg';
                }

                return _.map(data.objects, function (dataObj) {
                    return {highlightType: type, obj: dataObj};
                });
            };
            modulePrototype._identifyCycleObjects = function (objects) {
                var toHighlight = [];

                var module = this;
                var pnConstructor = module._moduleBus.getModule('pnConstructor');

                var prevObj;
                _.forEach(objects, function (dataObj) {
                    var guiObject = pnConstructor.findPTObject(dataObj.id);
                    toHighlight.push({obj: guiObject, data: dataObj.data});

                    if (prevObj) {
                        var arc = pnConstructor.findArc(prevObj, guiObject);
                        toHighlight.push({obj: arc});
                    }
                    prevObj = guiObject;
                });

                var firstObj = _.get(toHighlight, '[0].obj');
                if (prevObj && firstObj) {
                    var lastArc = pnConstructor.findArc(prevObj, firstObj);
                    toHighlight.push({obj: lastArc});
                }

                return toHighlight;
            };
            modulePrototype._identifyObjectsById = function (objects, type) {
                var pnConstructor = this._moduleBus.getModule('pnConstructor');

                return _.map(objects, function (dataObj) {
                    var ptObj = pnConstructor.findPTObject(dataObj.id, type);
                    return {obj: ptObj, data: dataObj.data};
                });
            };

            modulePrototype._getHighlightsData = function () {
                return _.union(PNPlaceHighlights, PNTransitionHighlights, PNArcHighlights, PNHelperHighlights);
            };

            return PNHighlighter;
        });
}());