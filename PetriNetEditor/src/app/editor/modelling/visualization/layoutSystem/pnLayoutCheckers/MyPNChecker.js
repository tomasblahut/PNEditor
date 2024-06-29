'use strict';

(function () {
    angular.module('PNLayoutCheckers', [
        'CanvasLayoutCheckers'
    ])
        .factory('MyPNChecker', function (CanvasLayoutChecker) {

            function MyPNChecker() {
            }

            var layoutPrototype = createjs.extend(MyPNChecker, CanvasLayoutChecker);

            layoutPrototype.performLayoutCheck = function (petriNet) {
                var places = petriNet.places();
                this._checkPlaces(places);

                var transitions = petriNet.transitions();
                this._checkTransitions(transitions);

                var arcs = petriNet.arcs();
                this._checkArcs(arcs);
            };

            layoutPrototype._checkPlaces = function (places) {
                _.forEach(places, function (place) {
                    var position = place.position;
                    if (!position) {
                        throw new Error('Place ' + place.id + ' is missing position');
                    }

                    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
                        throw new Error('Position of place ' + place.id + ' is not a valid point');
                    }
                });
            };
            layoutPrototype._checkTransitions = function (transitions) {
                _.forEach(transitions, function (transition) {
                    var position = transition.position;
                    if (!position) {
                        throw new Error('Transition ' + transition.id + ' is missing position');
                    }

                    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
                        throw new Error('Position of transition ' + transition.id + ' is not a valid point');
                    }
                });
            };
            layoutPrototype._checkArcs = function (arcs) {
                function checkArc(arcObj, placeId, transId, input) {
                    var points = arcObj.points;
                    if (points.length < 2) {
                        throw new Error('Arc from ' + (input ? 'transition ' : 'place ') + (input ? transId : placeId) +
                            ' to ' + (input ? 'place ' : 'transition ') + (input ? placeId : transId) +
                            ' has invalid number of points: ' + points.length);
                    }

                    _.forEach(points, function (point) {
                        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
                            throw new Error('Arc from ' + (input ? 'transition ' : 'place ') + (input ? transId : placeId) +
                                ' to ' + (input ? 'place ' : 'transition ') + (input ? placeId : transId) +
                                ' contains invalid points');
                        }
                    });
                }

                _.forEach(arcs, function (arc) {
                    var placeId = arc.rowKey;
                    var transId = arc.colKey;
                    var arcData = arc.value;

                    if (arcData.inputArc) {
                        checkArc(arcData.inputArc, placeId, transId, true);
                    }

                    if (arcData.outputArc) {
                        checkArc(arcData.outputArc, placeId, transId, false);
                    }
                });
            };

            return MyPNChecker;
        });
})();