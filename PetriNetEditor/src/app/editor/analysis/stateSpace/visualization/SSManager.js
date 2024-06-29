'use strict';

(function () {
    angular.module('SSVisualization', [
        'EaselCanvasSupport',
        'SSEventSystem',
        'SSLayerSystem',
        'SSModuleSystem',
        'SSObjectSystem',
        'CanvasToolSupport',
        'SSLayoutSystem'
    ])
        .factory('SSManager', function (EaselCanvasManager, SSObjectFactory, SSEventFactory, SSLayerLoader, SSModuleLoader,
                                        EmptyToolLoader, SSLayoutLoader) {

            function SSManager(stage) {
                this.Super_constructor(stage);
            }

            var managerPrototype = createjs.extend(SSManager, EaselCanvasManager);
            managerPrototype._doInit = function () {
                var stage = this._stageHandler.getStage();
                stage.enableMouseOver();
                stage.enableDOMEvents(true);
                stage.snapToPixelEnabled = true;

                this._navigator._zoomSetting.minZoom = 0.1;
                this._navigator._shiftSmoothness = 20;
            };

            managerPrototype._getObjectFactory = function () {
                return new SSObjectFactory();
            };
            managerPrototype._getEventFactory = function () {
                return new SSEventFactory();
            };
            managerPrototype._getLayerLoader = function () {
                return new SSLayerLoader();
            };
            managerPrototype._getModuleLoader = function () {
                return new SSModuleLoader();
            };
            managerPrototype._getToolLoader = function () {
                return EmptyToolLoader;
            };
            managerPrototype._getLayoutLoader = function () {
                return new SSLayoutLoader();
            };

            managerPrototype.initStateSpace = function (petriNet, graphData) {
                var graphBuilder = this._moduleBus.getModule('ssGraphBuilder');
                graphBuilder.initStateSpace(petriNet, graphData);
            };
            managerPrototype.rebuildStateSpace = function () {
                var graphBuilder = this._moduleBus.getModule('ssGraphBuilder');
                graphBuilder.rebuildStateSpace();
            };
            managerPrototype.navigateToInitialMarking = function() {
                var graphBuilder = this._moduleBus.getModule('ssGraphBuilder');
                graphBuilder.navigateToInitialMarking();
            };
            managerPrototype.settingsChanged = function (changes) {
                this._moduleBus.getModule('ssGraphBuilder').settingsChanged(changes);
            };
            managerPrototype.interruptStateSpace = function () {
                var graphBuilder = this._moduleBus.getModule('ssGraphBuilder');
                graphBuilder.interrupt();
                this._layoutPerformer.interrupt();
            };

            return createjs.promote(SSManager, "Super");
        });
}());