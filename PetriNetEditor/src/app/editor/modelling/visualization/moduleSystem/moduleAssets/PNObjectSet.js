'use strict';

(function () {
    angular.module('PNModuleAssets')
        .factory('PNObjectSet', function (ArcEndpoints) {

            function PNObjectSet(args) {
                this.type = 'pnObjectSet';

                this.places = args.places || [];
                this._placeIdMap = _.indexBy(this.places, 'id');

                this.transitions = args.transitions || [];
                this._transIdMap = _.indexBy(this.transitions, 'id');

                this.arcs = args.arcs || [];
                this._arcIdMap = _.indexBy(this.arcs, 'id');
            }

            PNObjectSet.prototype.containsElement = function (object) {
                var objId = object ? typeof object === 'string' ? object : object.id : undefined;
                if (!objId) {
                    return false;
                }

                var setObject = this.places.concat(this.transitions, this.arcs);
                var setObj = _.find(setObject, function (curSetObj) {
                    return curSetObj.id === objId;
                });

                return !_.isUndefined(setObj);
            };
            PNObjectSet.prototype.containsIdenticalElements = function (anotherSet) {
                if (!this.checkIndenticalObjects(this.places, anotherSet.places)) {
                    return false;
                }

                if (!this.checkIndenticalObjects(this.transitions, anotherSet.transitions)) {
                    return false;
                }

                if (!this.checkIndenticalObjects(this.arcs, anotherSet.arcs)) {
                    return false;
                }

                return true;
            };
            PNObjectSet.prototype.checkIndenticalObjects = function (curObjects, anotherObjects) {
                var curObjectsById = _.indexBy(curObjects, 'id');
                var otherObjectstIds = _.pluck(anotherObjects, 'id');

                var matches = true;
                _.forEach(otherObjectstIds, function (objId) {
                    var curObj = curObjectsById[objId];
                    matches = typeof curObj !== 'undefined';

                    if (matches) {
                        delete curObjectsById[objId];
                    }
                    return matches;
                });

                return matches && _.isEmpty(curObjectsById);
            };

            PNObjectSet.prototype.identifyArcEndpoints = function (arc) {
                var srcId = arc.src.id;
                var destId = arc.dest.id;

                var endpoints = {};

                endpoints.src = this._placeIdMap[srcId];
                if (!endpoints.src) {
                    endpoints.src = this._transIdMap[srcId];
                }

                endpoints.dest = this._placeIdMap[destId];
                if (!endpoints.dest) {
                    endpoints.dest = this._transIdMap[destId];
                }

                return new ArcEndpoints(endpoints);
            };

            PNObjectSet.prototype.toArray = function () {
                return _.union(this.places, this.transitions, this.arcs);
            };

            return PNObjectSet;
        });
}());