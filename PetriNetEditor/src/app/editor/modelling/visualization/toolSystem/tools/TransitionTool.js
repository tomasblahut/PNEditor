'use strict';

(function () {
    angular.module('PNTools')
        .factory('TransitionTool', function (CanvasTool) {

            function TransitionTool() {
                CanvasTool.call(this);
            }

            var toolPrototype = createjs.extend(TransitionTool, CanvasTool);
            toolPrototype.setup = function () {
                if (this.eventsRegistered) {
                    throw new Error('Events already registered for this tool');
                }

                var objInsertor = this._moduleBus.getModule('objectInsertor');
                objInsertor.createDummyObject('transition');

                this._listenerTokens = [
                    this._eventManager.addListener('bgClick', function () {
                        objInsertor.insertObject();
                    }),
                    this._eventManager.addListener('stageMousemove', function (smmEvent) {
                        objInsertor.updateDummyPosition(new createjs.Point(smmEvent.x, smmEvent.y));
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

                var objInsertor = this._moduleBus.getModule('objectInsertor');
                objInsertor.restoreState();
            };

            return TransitionTool;
        });
}());