'use strict';

(function (angular) {
    var origMethod = angular.module;
    var alreadyRegistered = {};

    angular.module = function (name, reqs, configFn) {
        reqs = reqs || [];
        var module = null;

        if (alreadyRegistered[name]) {
            module = origMethod(name);
            module.requires.push.apply(module.requires, reqs);
        } else {
            module = origMethod(name, reqs, configFn);
            alreadyRegistered[name] = module;
        }

        return module;
    };

})(angular);