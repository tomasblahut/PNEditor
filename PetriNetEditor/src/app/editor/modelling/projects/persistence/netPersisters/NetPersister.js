'use strict';

(function () {
    angular.module('NetPersisters', [])
        .factory('NetPersister', function () {

            function NetPersister() {
            }

            NetPersister.prototype.loadNetList = function () {
                throw new Error('Method loadNetList not implemented');
            };

            NetPersister.prototype.loadNet = function (netId) {
                throw new Error('Method loadNet not implemented');
            };

            NetPersister.prototype.saveNet = function (net) {
                throw new Error('Method saveNet not implemented');
            };

            NetPersister.prototype.deleteNet = function (netId) {
                throw new Error('Method deleteNet not implemented');
            };

            return NetPersister;
        });
})();