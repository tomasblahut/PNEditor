'use strict';

(function () {
    angular.module('PNTools')
        .factory('ArcTool', function (CanvasTool) {

            function ArcTool() {
                CanvasTool.call(this);
            }

            var toolPrototype = createjs.extend(ArcTool, CanvasTool);
            toolPrototype.setup = function () {
                if (this.eventsRegistered) {
                    throw new Error('Events already registered for this tool');
                }

                var tool = this;
                var objConnector = this._moduleBus.getModule('objectConnector');
                objConnector.initConnection();

                this._listenerTokens = [
                    this._eventManager.addListener('bgClick', function (bcEvent) {
                        if (bcEvent.button === 'left') {
                            objConnector.addArcPoint();
                        } else {
                            objConnector.restoreState();
                        }
                    }),
                    this._eventManager.addListener('stageMousemove', function (smmEvent) {
                        objConnector.moveArcEndpoint(new createjs.Point(smmEvent.x, smmEvent.y));
                    }),
                    this._eventManager.addListener('placeClick', function () {
                        objConnector.connect();
                    }),
                    this._eventManager.addListener('transitionClick', function () {
                        objConnector.connect();
                    })
                ];
                this.eventsRegistered = true;
            };
            toolPrototype.cleanup = function () {
                var objConnector = this._moduleBus.getModule('objectConnector');
                objConnector.restoreState(true);

                if (this.eventsRegistered) {
                    var tool = this;
                    _.forEach(this._listenerTokens, function (token) {
                        tool._eventManager.clearListener(token);
                    });
                    this._listenerTokens = undefined;

                    this.eventsRegistered = false;
                }
            };

            return ArcTool;
        });
}());