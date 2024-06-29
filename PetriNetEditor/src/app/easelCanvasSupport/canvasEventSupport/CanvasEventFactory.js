'use strict';

(function () {
    angular.module('CanvasEventSupport')
        .factory('CanvasEventFactory', function (StageEvents, BackgroundEvents) {

            function CanvasEventFactory() {
            }

            var commonEvents = _.union(StageEvents, BackgroundEvents);

            CanvasEventFactory.prototype.createEvent = function (type, nativeEvent) {
                var supportedEvent = _.find(this._getSupportedEvents(), 'type', type);
                if (!supportedEvent) {
                    supportedEvent = _.find(commonEvents, 'type', type);
                    if (!supportedEvent) {
                        throw new Error('Cannot fire event with unsupported type: ' + type);
                    }
                }

                var event = new supportedEvent.eventConstructor(nativeEvent);
                event.type = type;
                return event;
            };

            CanvasEventFactory.prototype.getSupportedEventTypes = function () {
                return _.pluck(_.union(commonEvents, this._getSupportedEvents()), 'type');
            };

            /**
             * Returns array of objects which contains info about supported events.
             * Each object consists of properties: type, eventConstructor. Type is
             * string identificator that is going to be used when creating event.
             * EventConstructor is event object constructor function.
             * @private
             */
            CanvasEventFactory.prototype._getSupportedEvents = function () {
                throw new Error('Method getSupportedEvents not implemented');
            };

            return CanvasEventFactory;
        });
}());