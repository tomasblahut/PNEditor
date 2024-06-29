'use strict';

(function () {
    angular.module('PNConstructionModules')
        .factory('ObjectInsertor', function (CanvasModule) {

            function ObjectInsertor() {
                CanvasModule.call(this);
            }

            var modulePrototype = createjs.extend(ObjectInsertor, CanvasModule);

            modulePrototype.createDummyObject = function (type) {
                if (this._dummyObj) {
                    throw new Error('Dummy object already initialized');
                }
                this._dummyObj = this._objectFactory.create(type, {});
                this._dummyObj.alpha = 0.5;
                this._dummyObj.mouseEnabled = false;

                var module = this;
                var highlightDummy = function () {
                    var highlighter = module._moduleBus.getModule('highlighter');
                    module._highlightToken = highlighter.highlightObjects({
                        identificationMethod: 'connection',
                        positive: false,
                        objects: [module._dummyObj]
                    });
                };
                var clearDummyHighlight = function () {
                    var highlighter = module._moduleBus.getModule('highlighter');
                    highlighter.removeHighlight(module._highlightToken);
                };

                this._listenerTokens = [
                    this._eventManager.addListener('placeMouseover', highlightDummy),
                    this._eventManager.addListener('transitionMouseover', highlightDummy),
                    this._eventManager.addListener('placeMouseout', clearDummyHighlight),
                    this._eventManager.addListener('transitionMouseout', clearDummyHighlight)
                ];

                var enhancLayer = this._layerBus.getLayer('enhancement');
                enhancLayer.addChild(this._dummyObj);
                this._stageHandler.updateStage();
            };
            modulePrototype.updateDummyPosition = function (position) {
                if (this._dummyObj) {
                    var gridLocalPoint = this._navigator.moveAtGrid(position, this._dummyObj.getCenter(), 'enhancement');
                    if (gridLocalPoint) {
                        this._dummyObj.x = gridLocalPoint.x;
                        this._dummyObj.y = gridLocalPoint.y;

                        this._moduleBus.getModule('guidelinesModule').drawGuidlinesFor(this._dummyObj);
                        this._stageHandler.updateStage();
                    }
                }
            };
            modulePrototype.insertObject = function () {
                if (this._dummyObj) {
                    var pnConstructor = this._moduleBus.getModule('pnConstructor');
                    var objData = {position: new createjs.Point(this._dummyObj.x, this._dummyObj.y)};

                    if (this._dummyObj.type === 'place') {
                        pnConstructor.addPlace(objData);
                    } else if (this._dummyObj.type === 'transition') {
                        pnConstructor.addTransition(objData);
                    }

                    this._stageHandler.updateStage();
                }
            };

            modulePrototype.restoreState = function () {
                if (this._dummyObj) {
                    var enhancLayer = this._layerBus.getLayer('enhancement');
                    enhancLayer.removeChild(this._dummyObj);
                    this._stageHandler.updateStage();

                    this._dummyObj = undefined;
                }

                var module = this;
                _.forEach(this._listenerTokens, function (token) {
                    module._eventManager.clearListener(token);
                });
                this._listenerTokens = undefined;

                this._moduleBus.getModule('guidelinesModule').restoreState();
            };

            modulePrototype.dispose = function () {
                this.restoreState();
            };

            return ObjectInsertor;
        });
}());