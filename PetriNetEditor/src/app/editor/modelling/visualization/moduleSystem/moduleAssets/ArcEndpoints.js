'use strict';

(function () {
    angular.module('PNModuleAssets')
        .factory('ArcEndpoints', function () {

            function ArcEndpoints(args) {
                this.src = args.src;
                this.dest = args.dest;
            }

            ArcEndpoints.prototype.isNotAttached = function () {
                return !this.src && !this.dest;
            };
            ArcEndpoints.prototype.isPartiallyAttached = function () {
                return (this.src && !this.dest) || (!this.src && this.dest);
            };
            ArcEndpoints.prototype.isFullyAttached = function () {
                return this.src && this.dest;
            };

            ArcEndpoints.prototype.hasSource = function () {
                return typeof this.src !== 'undefined';
            };
            ArcEndpoints.prototype.hasDestination = function () {
                return typeof this.dest !== 'undefined';
            };

            return ArcEndpoints;
        });
}());