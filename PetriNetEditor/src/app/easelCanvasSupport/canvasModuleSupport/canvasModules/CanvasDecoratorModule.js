'use strict';

(function () {
    angular.module('CanvasModules')
        .factory('CanvasDecoratorModule', function (CanvasModule) {

            function CanvasDecoratorModule() {
                this.Super_constructor();
            }

            var modulePrototype = createjs.extend(CanvasDecoratorModule, CanvasModule);

            modulePrototype.canDecorateObject = function (canvasObject) {
                throw new Error('Method canDecorateObject not implemented');
            };
            modulePrototype.decorateObject = function (canvasObject) {
                throw new Error('Method decorateObject not implemented');
            };
            modulePrototype.removeDecorations = function () {
                throw new Error('Method removeDecorations not implemented');
            };

            return createjs.promote(CanvasDecoratorModule, 'Super');
        });
}());