'use strict';

(function () {
    angular.module('PNModuleSystem', [
        'CanvasModuleSupport',
        'PNConstructionModules',
        'PNManipulationModules',
        'PNMovementModules',
        'PNNavigationModules',
        'PNSimulationModules',
        'MementoModules'
    ])
        .factory('PNModuleLoader', function (CanvasModuleLoader, PNConstructor, ObjectSelector, PNHighlighter,
                                             ObjectConnector, ObjectInsertor, GuidelinesModule, ObjectRotator,
                                             ArcObjectMoover, PTObjectMoover, SetObjectMoover, SimulationPerformer,
                                             PNMemento) { 

            function PNModuleLoader() {
                this._registeredModules = [
                    {type: 'pnConstructor', moduleConstructor: PNConstructor},
                    {type: 'objectSelector', modes: 'modelling', moduleConstructor: ObjectSelector},
                    {type: 'highlighter', moduleConstructor: PNHighlighter},
                    {type: 'objectConnector', modes: 'modelling', moduleConstructor: ObjectConnector},
                    {type: 'objectInsertor', modes: 'modelling', moduleConstructor: ObjectInsertor},
                    {type: 'guidelinesModule', modes: 'modelling', moduleConstructor: GuidelinesModule},
                    {type: 'objectRotator', modes: 'modelling', moduleConstructor: ObjectRotator},
                    {type: 'arcObjectMoover', modes: 'modelling', moduleConstructor: ArcObjectMoover},
                    {type: 'ptObjectMoover', modes: 'modelling', moduleConstructor: PTObjectMoover},
                    {type: 'setObjectMoover', modes: 'modelling', moduleConstructor: SetObjectMoover},
                    {type: 'simulationPerformer', modes: 'simulation', moduleConstructor: SimulationPerformer},
                    {type: 'pnMemento', modes: 'modelling', moduleConstructor: PNMemento}
                ];
            }

            var loaderPrototype = createjs.extend(PNModuleLoader, CanvasModuleLoader);
            loaderPrototype._getRegisteredModules = function () {
                return this._registeredModules;
            };

            return PNModuleLoader;
        });
}());