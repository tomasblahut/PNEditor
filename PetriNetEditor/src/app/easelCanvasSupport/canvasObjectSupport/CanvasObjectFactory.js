'use strict';

(function () {
    angular.module('CanvasObjectSupport', [])
        .factory('CanvasObjectFactory', function () {

            function CanvasObjectFactory() {
            }

            CanvasObjectFactory.prototype.create = function (type, options) {
                var registeredObject = _.find(this._getRegisteredObjects(), 'type', type);
                if (!registeredObject) {
                    throw new Error('Cannot create object with type: ' + type);
                }

                var object = new registeredObject.objectConstructor(options || {});
                object.type = type;
                return object;
            };

            /**
             * Returns array of objects which contains info about registered objects.
             * Each object consists of properties: type, objectConstructor. Type is
             * string identificator that is going to be used when creating object.
             * ObjectConstructor is canvasObject constructor function.
             * @private
             */
            CanvasObjectFactory.prototype._getRegisteredObjects = function () {
                throw new Error('Method getRegisteredObjects not implemented');
            };

            return CanvasObjectFactory;
        });
}());