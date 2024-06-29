'use strict';

(function () {
    angular.module('PNVisualization', [
        'EaselCanvasSupport',
        'PNEventSystem',
        'PNLayerSystem',
        'PNModuleSystem',
        'PNObjectSystem',
        'PNToolSystem',
        'PNLayoutSystem'
    ])
        .factory('PNManager', function (EaselCanvasManager, PNObjectFactory, PNEventFactory, PNLayerLoader, PNModuleLoader,
                                        PNToolLoader, PNLayoutLoader) {

            function PNManager(stage, initialMode) {
                this.Super_constructor(stage, initialMode);
            }

            var managerPrototype = createjs.extend(PNManager, EaselCanvasManager);
            managerPrototype._doInit = function () {
                var stage = this._stageHandler.getStage();
                stage.enableMouseOver();
                stage.enableDOMEvents(true);
            };
            managerPrototype._initAfterSwitchingMode = function () {
                if (this._mode === 'simulation') {
                    var simulationPerformer = this._moduleBus.getModule('simulationPerformer');
                    simulationPerformer.initSimulation();
                }
            };

            managerPrototype._getObjectFactory = function () {
                return new PNObjectFactory();
            };
            managerPrototype._getEventFactory = function () {
                return new PNEventFactory();
            };
            managerPrototype._getLayerLoader = function () {
                return new PNLayerLoader();
            };
            managerPrototype._getModuleLoader = function () {
                return new PNModuleLoader();
            };
            managerPrototype._getToolLoader = function () {
                return new PNToolLoader();
            };
            managerPrototype._getLayoutLoader = function () {
                return new PNLayoutLoader();
            };

            managerPrototype.highlight = function (data) {
                var highlighter = this._moduleBus.getModule('highlighter');
                if (data) {
                    this._highlightToken = highlighter.highlightObjects(data);
                }
                else {
                    highlighter.removeHighlight(this._highlightToken);
                    this._highlightToken = undefined;
                }
            };
            managerPrototype.setZoomLevel = function (zoom) {
                this._navigator.setZoomLevel(zoom);
            };

            managerPrototype.loadNet = function (petriNet) {
                var manager = this;
                this._beforeNetRendered();

                var pnConstructor = manager._moduleBus.getModule('pnConstructor');
                pnConstructor.loadNet(petriNet).then(function () {
                    manager._afterNetRendered();
                });
            };
            managerPrototype.refreshNet = function () {
                var manager = this;
                this._beforeNetRendered();

                var pnConstructor = manager._moduleBus.getModule('pnConstructor');
                pnConstructor.refreshNet().then(function () {
                    manager._afterNetRendered();
                });
            };
            managerPrototype._beforeNetRendered = function () {
                if (this._mode === 'modelling') {
                    var objectSelector = this._moduleBus.getModule('objectSelector');
                    objectSelector.clearSelection();
                }
            };
            managerPrototype._afterNetRendered = function () {
                if (this._mode === 'simulation') {
                    var simPerformer = this._moduleBus.getModule('simulationPerformer');
                    simPerformer.initSimulation();
                }
                this._navigator.restoreState();
            };

            managerPrototype.layoutNet = function () {
                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                pnConstructor.applyLayout();
            };
            managerPrototype.applyChanges = function (delegate) {
                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                pnConstructor.applyChanges(delegate);
            };
            managerPrototype.interrupt = function () {
                var pnConstructor = this._moduleBus.getModule('pnConstructor');
                pnConstructor.interrupt();
                this._layoutPerformer.interrupt();
            };

            managerPrototype.goToStep = function (stepId) {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.goToStep(stepId);
            };
            managerPrototype.goToPreviousStep = function () {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.goToPreviousStep();
            };
            managerPrototype.goToNextStep = function () {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.goToNextStep();
            };
            managerPrototype.startAutomaticSimulation = function (periodMillis) {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.startAutomaticSimulation(periodMillis);
            };
            managerPrototype.stopAutomaticSimulation = function () {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.stopAutomaticSimulation();
            };
            managerPrototype.restartSimulation = function () {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.restartSimulation();
            };
            managerPrototype.executeBatch = function (stepCount) {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.executeSimulationBatch(stepCount);
            };
            managerPrototype.cancelBatch = function () {
                var simPerformer = this._moduleBus.getModule('simulationPerformer');
                simPerformer.cancelSimulationBatch();
            };
            
            // checks whether it is possible to perform undo operation in the editor
            managerPrototype.canUndo = function () {
            	var memento = this._moduleBus.getModule('pnMemento');
            	return memento.canUndo();
            };
            // checks whether it is possible to perform redo operation in the editor
            managerPrototype.canRedo = function () {
            	var memento = this._moduleBus.getModule('pnMemento');
            	return memento.canRedo();
            };
            // Gets the previous state of the Petri net model from Memento module. Returns that state.
            managerPrototype.undo = function () {
            	var memento = this._moduleBus.getModule('pnMemento');
            	return memento.undo();
            };
            // Gets the next state of the Petri net model from Memento module. Returns that state.
            managerPrototype.redo = function () {
            	var memento = this._moduleBus.getModule('pnMemento');
            	return memento.redo();
            };
            
            // Creates new memento object in Memento module.
            managerPrototype.createMemento = function () {
            	var pnConstructor = this._moduleBus.getModule('pnConstructor');
                pnConstructor.createMemento();
            };

            return createjs.promote(PNManager, "Super");
        });
})();
