'use strict';

(function () {
    angular.module('Main', [
        'ngMaterial',
        'ngMessages',
        'ui.router',
        'ui-notification',
        'ngFileSaver',
        'angularSpinners',
        'NetEditor',
        'UtilsDirectives',
        'AppConfig'
    ])
        .config(function ($urlRouterProvider) {
            $urlRouterProvider.otherwise('/model');
        })
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('teal')
                .accentPalette('pink');
        });
}());


