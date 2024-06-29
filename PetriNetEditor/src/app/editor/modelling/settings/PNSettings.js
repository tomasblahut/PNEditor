'use strict';

(function () {
    angular.module('PNSettings', [])
        .service('PNSettingsManager', function () {
            var service = this;

            this.getSelectedLayout = function () {
                return this._settings.layout;
            };
            this.setSelectedLayout = function (layoutType) {
                this._settings.layout.type = layoutType;
            };

            this.getSettings = function () {
                return this._settings;
            };

            function initSettings() {
                service._settings = {
                    layout: {}
                };
            }

            initSettings();
        });
}());