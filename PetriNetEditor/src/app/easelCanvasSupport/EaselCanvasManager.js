'use strict';

(function () {
    angular.module('EaselCanvasSupport', [
        'EaselStageApi',
        'CanvasLayerSupport',
        'CanvasEventSupport',
        'CanvasBackgroundSupport',
        'CanvasModuleSupport',
        'CanvasToolSupport',
        'CanvasLayoutSupport',
        'CanvasNavigationSupport'
    ])
        .factory('EaselCanvasManager', function (EaselStageHandler, CanvasLayerBus, CanvasEventManager, CanvasModuleBus, CanvasToolManager,
                                                 CanvasLayoutPerformer, CanvasBackgroundManager, CanvasNavigator) {

            function EaselCanvasManager(stage, initialMode) {
                this._stageHandler = new EaselStageHandler(stage);
                this._mode = initialMode;

                //-- Independent factors
                this._initObjects();
                this._initLayouts();
                this._initEvents();

                //-- Dependent factors
                this._initBackground();
                this._initLayers();
                this._initNavigation();
                this._initModules();
                this._initTools();

                //-- Additional optional factors
                this._doInit();
                this._stageHandler.updateStage();
            }

            //============= Inicialization =============//
            EaselCanvasManager.prototype._doInit = function () {
                //Optional to implement
            };
            EaselCanvasManager.prototype._initObjects = function () {
                this._objectFactory = this._getObjectFactory();
            };
            EaselCanvasManager.prototype._initLayouts = function () {
                this._layoutPerformer = new CanvasLayoutPerformer();
                this._layoutPerformer.loadLayouts(this._getLayoutLoader());
            };
            EaselCanvasManager.prototype._initEvents = function () {
                var api = {stageHandler: this._stageHandler};
                this._eventManager = new CanvasEventManager(api);
                this._eventManager.init(this._getEventFactory());
            };

            EaselCanvasManager.prototype._initBackground = function () {
                var api = {stageHandler: this._stageHandler, eventManager: this._eventManager};
                this._bgManager = new CanvasBackgroundManager(api);
                this._bgManager.init();
            };
            EaselCanvasManager.prototype._initLayers = function () {
                var api = {stageHandler: this._stageHandler, eventManager: this._eventManager};
                this._layerBus = new CanvasLayerBus(api);
                this._layerBus.loadLayers(this._getLayerLoader(), this._mode);
            };
            EaselCanvasManager.prototype._initNavigation = function () {
                var api = {
                    stageHandler: this._stageHandler,
                    eventManager: this._eventManager,
                    bgManager: this._bgManager,
                    layerBus: this._layerBus
                };
                this._navigator = new CanvasNavigator(api);
                this._navigator.init();
            };
            EaselCanvasManager.prototype._initModules = function () {
                var api = {
                    stageHandler: this._stageHandler,
                    objectFactory: this._objectFactory,
                    layerBus: this._layerBus,
                    eventManager: this._eventManager,
                    layoutPerformer: this._layoutPerformer,
                    navigator: this._navigator
                };
                this._moduleBus = new CanvasModuleBus(api);
                this._moduleBus.loadModules(this._getModuleLoader(), this._mode);
            };
            EaselCanvasManager.prototype._initTools = function () {
                var api = {eventManager: this._eventManager, moduleBus: this._moduleBus};
                this._toolManager = new CanvasToolManager(api);
                this._toolManager.loadTools(this._getToolLoader(), this._mode);
            };

            //-
            EaselCanvasManager.prototype._getObjectFactory = function () {
                throw new Error('Method getObjectFactory not implemented');
            };
            EaselCanvasManager.prototype._getEventFactory = function () {
                throw new Error('Method getEventFactory not implemented');
            };
            EaselCanvasManager.prototype._getLayerLoader = function () {
                throw new Error('Method getLayerLoader not implemented');
            };
            EaselCanvasManager.prototype._getModuleLoader = function () {
                throw new Error('Method getModuleLoader not implemented');
            };
            EaselCanvasManager.prototype._getToolLoader = function () {
                throw new Error('Method getToolLoader not implemented');
            };
            EaselCanvasManager.prototype._getLayoutLoader = function () {
                throw new Error('Method getLayoutLoader not implemented');
            };
            EaselCanvasManager.prototype._getNavigatorSettings = function () {
                throw new Error('Method getNavigatorSettings not implemented');
            };

            //============= Tools =============//
            EaselCanvasManager.prototype.getTools = function () {
                return this._toolManager.getTools();
            };
            EaselCanvasManager.prototype.setActiveTool = function (tool) {
                this._toolManager.setActiveTool(tool);
            };

            //============= Layouts =============//
            EaselCanvasManager.prototype.getLayouts = function () {
                return this._layoutPerformer.getLayouts();
            };

            //============= Grids =============//
            EaselCanvasManager.prototype.getGrids = function () {
                return this._navigator.getSupportedGrids();
            };
            EaselCanvasManager.prototype.setActiveGrid = function (type) {
                this._navigator.setActiveGrid(type);
            };
            EaselCanvasManager.prototype.setGridVisible = function (visible) {
                this._navigator.setGridVisible(visible);
            };
            EaselCanvasManager.prototype.setSnapToGrid = function (snap) {
                this._navigator.setSnapToGrid(snap);
            };

            //============= Modes =============//
            EaselCanvasManager.prototype.switchToMode = function (mode) {
                var modeChanged = this._mode !== mode;
                if (modeChanged) {
                    this._toolManager.switchToMode(mode);
                    this._moduleBus.switchToMode(mode);
                    this._layerBus.switchToMode(mode);

                    this._navigator.restoreState();
                    this._stageHandler.updateStage();
                    this._mode = mode;

                    this._initAfterSwitchingMode();
                }
                return modeChanged;
            };

            //-
            EaselCanvasManager.prototype._initAfterSwitchingMode = function () {
                //optional to implement
            };

            //============= Cleanup =============//
            EaselCanvasManager.prototype.dispose = function () {
                this._stageHandler.dispose();
                this._toolManager.dispose();
                this._moduleBus.dispose();
                this._navigator.dispose();
                this._layerBus.dispose();
                this._bgManager.dispose();
                this._eventManager.dispose();
                this._layoutPerformer.dispose();

                this._doDispose();
                this._stageHandler.updateStage();
            };
            EaselCanvasManager.prototype._doDispose = function () {
                //Optional to implement
            };

            return EaselCanvasManager;
        });
}());