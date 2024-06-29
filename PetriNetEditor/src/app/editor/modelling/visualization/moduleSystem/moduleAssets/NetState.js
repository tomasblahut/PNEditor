'use strict';

(function () {
    angular.module('PNModuleAssets')
        .factory('NetState', function () {

            function NetState(data) {
                this.id = StringUtils.uuid();
                this._data = data ? _.cloneDeep(data) : {};
                this.stateHash = data ? data.stateHash : undefined;
            }

            NetState.prototype.loadFromNet = function (petriNet) {
                var data = this._data = {};
                var places = petriNet.places();

                _.forEach(places, function (place) {
                    data[place.id] = place.tokens;
                });

                this._calculateStateHash();
            };

            NetState.prototype.getTokens = function (placeId) {
                return this._data[placeId];
            };

            NetState.prototype.applyChanges = function (changes) {
                var stateClone = new NetState(this._data);
                var data = stateClone._data;

                _.forEach(changes, function (tokens, placeId) {
                    var curValue = data[placeId];
                    if (typeof curValue === 'undefined') {
                        throw new Error('Place ' + placeId + ' is not part of current net state');
                    }

                    curValue += tokens;
                    if (curValue < 0) {
                        throw new Error('Invalid update at place: ' + placeId + '. Resulting in negative tokens value');
                    }

                    data[placeId] = curValue;
                });

                stateClone._calculateStateHash();
                return stateClone;
            };

            NetState.prototype._calculateStateHash = function () {
                var mappedData = _.map(this._data, function (value, key) {
                    return {key: key, value: value};
                });
                mappedData = _.sortBy(mappedData, 'key');
                var sortedValues = _.pluck(mappedData, 'value');

                this.stateHash = sortedValues.join(';');
            };

            NetState.prototype.isSameAs = function (compareTo) {
                return compareTo.stateHash === this.stateHash;
            };

            return NetState;
        });
}());