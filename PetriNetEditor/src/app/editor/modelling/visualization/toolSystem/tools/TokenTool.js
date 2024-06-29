'use strict';

(function () {
    angular.module('PNTools')
        .factory('TokenTool', function (CanvasTool) {

            function TokenTool() {
                CanvasTool.call(this);
            }

            var toolPrototype = createjs.extend(TokenTool, CanvasTool);
            toolPrototype.setup = function () {
                if (this.eventsRegistered) {
                    throw new Error('Events already registered for this tool');
                }

                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                this._listenerTokens = [
                    this._eventManager.addListener('placeClick', function (pcEvent) {
                        pnConstructor.addTokens(pcEvent.place, 'left' === pcEvent.button ? 1 : -1);
                    }),
                    this._eventManager.addListener('arcClick', function (acEvent) {
                        pnConstructor.adjustArcMultiplicity(acEvent.arc, 'left' === acEvent.button ? 1 : -1);
                    })
                ];
                this.eventsRegistered = true;
            };
            toolPrototype.cleanup = function () {
                if (this.eventsRegistered) {
                    var tool = this;
                    _.forEach(this._listenerTokens, function (token) {
                        tool._eventManager.clearListener(token);
                    });

                    this._listenerTokens = undefined;
                    this.eventsRegistered = false;
                }
            };

            return TokenTool;
        });
}());