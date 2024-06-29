'use strict';

(function () {
    angular.module('PNTools')
        .factory('SelectionTool', function (CanvasTool) {

            function SelectionTool() {
                CanvasTool.call(this);
            }

            var toolPrototype = createjs.extend(SelectionTool, CanvasTool);
            toolPrototype.setup = function () {
                if (this.eventsRegistered) {
                    throw new Error('Events already registered for this tool');
                }

                var objSelector = this._moduleBus.getModule('objectSelector');
                this._listenerTokens = [
                    this._eventManager.addListener('bgMousedown', function (bme) {
                        if (bme.button === 'left') {
                            var point = new createjs.Point(bme.x, bme.y);
                            objSelector.initMassSelection(point);
                        }
                    }),
                    this._eventManager.addListener('bgPressmove', function (bpme) {
                        var point = new createjs.Point(bpme.x, bpme.y);
                        objSelector.updateMassSelection(point);
                    }),
                    this._eventManager.addListener('bgPressup', function (bpue) {
                        var point = new createjs.Point(bpue.x, bpue.y);
                        objSelector.selectMultipleObjects(point);
                    }),
                    this._eventManager.addListener('placeMousedown', function (pmdEvent) {
                        if (pmdEvent.button === 'left') {
                            var point = new createjs.Point(pmdEvent.x, pmdEvent.y);
                            objSelector.selectSingleObject(pmdEvent.place, point);
                        }
                    }),
                    this._eventManager.addListener('placeClick', function (pcEvent) {
                        if (pcEvent.button !== 'left') {
                            objSelector.deleteObject(pcEvent.place);
                        }
                    }),
                    this._eventManager.addListener('transitionMousedown', function (tmdEvent) {
                        if (tmdEvent.button === 'left') {
                            var point = new createjs.Point(tmdEvent.x, tmdEvent.y);
                            objSelector.selectSingleObject(tmdEvent.transition, point);
                        }
                    }),
                    this._eventManager.addListener('transitionClick', function (tcEvent) {
                        if (tcEvent.button !== 'left') {
                            objSelector.deleteObject(tcEvent.transition);
                        }
                    }),
                    this._eventManager.addListener('arcMousedown', function (amdEvent) {
                        if (amdEvent.button === 'left') {
                            var point = new createjs.Point(amdEvent.x, amdEvent.y);
                            objSelector.selectSingleObject(amdEvent.arc, point);
                        }
                    }),
                    this._eventManager.addListener('arcClick', function (acEvent) {
                        if (acEvent.button !== 'left') {
                            objSelector.deleteObject(acEvent.arc);
                        }
                    }),
                    this._eventManager.addListener('key_del', function () {
                        objSelector.deleteSelection();
                    })
                ];
                this.eventsRegistered = true;
            };
            toolPrototype.cleanup = function () {
                this._moduleBus.getModule('objectSelector').selectSingleObject(null);

                if (this.eventsRegistered) {
                    var tool = this;
                    _.forEach(this._listenerTokens, function (token) {
                        tool._eventManager.clearListener(token);
                    });

                    this._listenerTokens = undefined;
                    this.eventsRegistered = false;
                }
            };

            return SelectionTool;
        });
}());