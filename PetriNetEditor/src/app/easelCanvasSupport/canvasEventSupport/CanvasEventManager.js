'use strict';

(function () {
    angular.module('CanvasEventSupport', [
        'CommonCanvasEvents'
    ])
        .factory('CanvasEventManager', function ($rootScope) {

            function CanvasEventManager(api) {
                this._stageHandler = api.stageHandler;
            }

            CanvasEventManager.prototype.init = function (eventFactory) {
                if (!eventFactory) {
                    throw new Error('Event factory must be specified');
                }
                this.dispose();

                this._eventFactory = eventFactory;
                this._contextId = this._stageHandler.getContextId();
                this._keyboardTokens = [];

                var manager = this;
                _.forEach(this._eventFactory.getSupportedEventTypes(), function (keyType) {
                    var strTokens = keyType.split('_');

                    if (strTokens[0] === 'key' && strTokens.length > 1) {
                        var keyToken = strTokens[1];
                        manager._keyboardTokens.push(keyToken);
                        key(keyToken, manager._contextId, function (event) {
                            manager.fireEvent(keyType, event);
                        });
                    }
                });

                this._initCanvasEvents();
            };
            CanvasEventManager.prototype._initCanvasEvents = function () {
                var eventManager = this;

                var stage = this._stageHandler.getStage();

                function stageMouseMove(event) {
                    eventManager.fireEvent('stageMousemove', event);
                }

                this._stageListenerTokens = {
                    stagemousemove: stage.on('stagemousemove', stageMouseMove)
                };

                var canvas = this._stageHandler.getCanvas();

                function canvasMouseOver() {
                    key.setScope(eventManager._contextId);
                }

                function canvasMouseOut() {
                    key.setScope('all');
                }

                function canvasContextMenu(event) {
                    event.preventDefault();
                }

                function canvasMouseWheel(event) {
                    var stage = eventManager._stageHandler.getStage();
                    event.stageX = stage.mouseX;
                    event.stageY = stage.mouseY;
                    eventManager.fireEvent('stageMousewheel', event);
                }

                canvas.addEventListener('mouseover', canvasMouseOver, false);
                canvas.addEventListener('mouseout', canvasMouseOver, false);
                canvas.addEventListener('contextmenu', canvasContextMenu, false);
                canvas.addEventListener('mousewheel', canvasMouseWheel, false);
                canvas.addEventListener('DOMMouseScroll', canvasMouseWheel, false);

                this._canvasListenerTokens = [
                    {type: 'mouseover', listener: canvasMouseOver},
                    {type: 'mouseover', listener: canvasMouseOut},
                    {type: 'contextmenu', listener: canvasContextMenu},
                    {type: 'mousewheel', listener: canvasMouseWheel},
                    {type: 'DOMMouseScroll', listener: canvasMouseWheel}
                ];

                function canvasResized(event, args) {
                    var element = args.element;
                    if (element === canvas) {
                        var actEvent = _.merge(event, args);
                        eventManager.fireEvent('stageResize', actEvent);
                    }
                }

                this._scopeListenerTokens = [
                    $rootScope.$on('elementResized', canvasResized)
                ];
            };

            //Event firing
            CanvasEventManager.prototype.fireEvent = function (type, nativeEvent) {
                if (typeof nativeEvent.stopPropagation === 'function') {
                    nativeEvent.stopPropagation();
                }
                var pnEvent = this._eventFactory.createEvent(type, nativeEvent);
                this.dispatchEvent(pnEvent);
            };

            //Event listeners registration
            CanvasEventManager.prototype.addListener = function (type, listener) {
                if (!_.includes(this._eventFactory.getSupportedEventTypes(), type)) {
                    throw new Error('Cannot register event listener for unsupported type: ' + type);
                }

                var wrapper = this.on(type, listener);
                return {type: type, wrapper: wrapper};
            };

            //Event listeners clearing
            CanvasEventManager.prototype.clearListener = function (token) {
                this.off(token.type, token.wrapper);
            };

            CanvasEventManager.prototype.dispose = function () {
                var contextId = this._contextId;
                _.forEach(this._keyboardTokens, function (key) {
                    key.unbind(key, contextId);
                });
                this._contextId = undefined;
                this._keyboardTokens = undefined;

                var stage = this._stageHandler.getStage();
                _.forEach(this._stageListenerTokens, function (wrapper, type) {
                    stage.off(type, wrapper);
                });
                this._stageListenerTokens = undefined;

                var canvas = this._stageHandler.getCanvas();
                _.forEach(this._canvasListenerTokens, function (token) {
                    canvas.removeEventListener(token.type, token.listener);
                });
                this._canvasListenerTokens = undefined;

                _.forEach(this._scopeListenerTokens, function (token) {
                    token();
                });
                this._scopeListenerTokens = undefined;

                stage.enableDOMEvents(false);
            };

            createjs.EventDispatcher.initialize(CanvasEventManager.prototype);
            return CanvasEventManager;
        });
}());