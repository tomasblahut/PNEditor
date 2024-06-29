'use strict';

(function () {
    angular.module('CanvasLayoutSupport')
        .factory('CanvasLayoutLoader', function () {

            function CanvasLayoutLoader() {
            }

            CanvasLayoutLoader.prototype.loadLayouts = function () {
                var layoutInfo = this._getRegisteredLayouts();

                return _.map(layoutInfo, function (info) {
                    return {type: info.type, name: info.name, instance: new info.layoutConstructor()};
                });
            };
            CanvasLayoutLoader.prototype.loadCheckers = function () {
                var checkerInfo = this._getRegisteredLayoutsCheckers();

                return _.map(checkerInfo, function (info) {
                    return {type: info.type, instance: new info.checkerConstructor()};
                });
            };

            CanvasLayoutLoader.prototype._getRegisteredLayouts = function () {
                throw new Error('Method getRegisteredLayouts not implemented');
            };
            CanvasLayoutLoader.prototype._getRegisteredLayoutsCheckers = function () {
                throw new Error('Method getRegisteredLayouts not implemented');
            };

            return CanvasLayoutLoader;
        });
}());
