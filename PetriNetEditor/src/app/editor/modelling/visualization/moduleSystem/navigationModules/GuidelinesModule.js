'use strict';

(function () {
    angular.module('PNNavigationModules')
        .factory('GuidelinesModule', function (CanvasModule) {

            function GuidelinesModule() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(GuidelinesModule, CanvasModule);
            modulePrototype._doInit = function () {
                this._guidlines = [];
                this._overflow = 10;
            };

            modulePrototype.drawGuidlinesFor = function (object) {
                this.restoreState();

                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                var netObjects = pnConstructor.findPTObjects(['place', 'transition']);

                var left, right, top, bottom;
                var objCenter = object.getCenter();
                var objHeight = object.height();
                var objWidth = object.width();

                var module = this;
                _.forEach(netObjects, function (netObj) {
                    if (object.id === netObj.id) {
                        return true;
                    }

                    var curCenter = netObj.getCenter();
                    if (curCenter.x === objCenter.x) {
                        var curHeight = netObj.height();
                        if (!top) {
                            top = Math.min(curCenter.y, objCenter.y) - ((curCenter.y < objCenter.y ? curHeight : objHeight) / 2) - module._overflow;
                        }
                        else if (top > curCenter.y) {
                            top = curCenter.y - (curHeight / 2) - 5;
                        }

                        if (!bottom) {
                            bottom = Math.max(curCenter.y, objCenter.y) + ((curCenter.y < objCenter.y ? objHeight : curHeight) / 2) + module._overflow;
                        }
                        else if (bottom < curCenter.y) {
                            bottom = curCenter.y + (curHeight / 2) + 5;
                        }
                    }

                    if (curCenter.y === objCenter.y) {
                        var curWidth = netObj.width();
                        if (!left) {
                            left = Math.min(curCenter.x, objCenter.x) - ((curCenter.x < objCenter.x ? curWidth : objWidth) / 2) - module._overflow;
                        }
                        else if (left > curCenter.x) {
                            left = curCenter.x - (curWidth / 2) - 5;
                        }

                        if (!right) {
                            right = Math.max(curCenter.x, objCenter.x) + ((curCenter.x < objCenter.x ? objWidth : curWidth) / 2) + module._overflow;
                        }
                        else if (right < curCenter.x) {
                            right = curCenter.x + (curWidth / 2) + 5;
                        }
                    }
                });

                var shouldRepaint = false;
                var enhancLayer = this._layerBus.getLayer('enhancement');
                if (right && left) {
                    var horLength = right - left;
                    var horGuideline = this._objectFactory.create('guideline', {length: horLength, horizontal: true});
                    horGuideline.x = left;
                    horGuideline.y = objCenter.y;

                    this._guidlines.push(horGuideline);
                    enhancLayer.addChild(horGuideline);
                    shouldRepaint = true;
                }

                if (top && bottom) {
                    var vertLength = bottom - top;
                    var vertGuideline = this._objectFactory.create('guideline', {
                        length: vertLength,
                        horizontal: false
                    });
                    vertGuideline.x = objCenter.x;
                    vertGuideline.y = top;

                    this._guidlines.push(vertGuideline);
                    enhancLayer.addChild(vertGuideline);
                    shouldRepaint = true;
                }

                if (shouldRepaint) {
                    this._stageHandler.updateStage();
                }
            };

            modulePrototype.restoreState = function () {
                if (this._guidlines.length > 0) {
                    var enhancLayer = this._layerBus.getLayer('enhancement');
                    _.forEach(this._guidlines, function (guidline) {
                        enhancLayer.removeChild(guidline);
                    });
                    this._guidlines = [];
                    this._stageHandler.updateStage();
                }
            };

            modulePrototype.dispose = function () {
                this.restoreState();
            };

            return GuidelinesModule;
        });
}());