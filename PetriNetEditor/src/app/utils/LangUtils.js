'use strict';
var LangUtils = {};

(function () {

    LangUtils.isUndefined = function (obj) {
        return typeof obj === 'undefined';
    };

    LangUtils.isObjectEmpty = function (obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    };

    LangUtils.mergeObjects = function (obj1, obj2) {
        var obj3 = {};

        var attrName;
        for (attrName in obj1) {
            obj3[attrName] = obj1[attrName];
        }
        for (attrName in obj2) {
            obj3[attrName] = obj2[attrName];
        }
        return obj3;
    };

}());