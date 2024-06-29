'use strict';

(function () {
    angular.module('PNModuleAssets')
        .factory('OCP', function () {

            function OCP(args) {
                this.realObj = args.realObj;
                this.conObj = args.conObj;
                this.magnetic = args.magnetic;
            }

            OCP.prototype.getType = function () {
                return this.conObj.type;
            };

            OCP.prototype.getConnectionPoint = function () {
                return this.realObj.getCenter();
            };

            return OCP;
        });
}());