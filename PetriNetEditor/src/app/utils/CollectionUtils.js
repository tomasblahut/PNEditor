'use strict';
var CollectionUtils = {};

(function () {

    //==== TABLE =====
    function Table() {
        this._data = {};
    }

    Table.prototype.loadData = function (table) {
        this._data = table._data;
        this._invalidateCellSet();
    };
    Table.prototype.getData = function () {
        return this._data;
    };
    Table.prototype.get = function (rowKey, colKey) {
        var value;
        var row = this._data[rowKey];
        if (row) {
            value = row[colKey];
        }
        return value;
    };
    Table.prototype.row = function (rowId) {
        return this._data[rowId];
    };
    Table.prototype.colKeys = function (rowId) {
        var colKeys = [];
        var row = this.row(rowId);
        for (var colKey in row) {
            colKeys.push(colKey);
        }
        return colKeys;
    };
    Table.prototype.column = function (colId) {
        var column = {};

        for (var rowKey in this._data) {
            var curColumn = this._data[rowKey];
            var value = curColumn[colId];
            if (value) {
                column[rowKey] = value;
            }
        }

        return column;
    };
    Table.prototype.rowKeys = function (colId) {
        var rowKeys = [];

        for (var rowKey in this._data) {
            var column = this._data[rowKey];
            var value = column[colId];
            if (value) {
                rowKeys.push(rowKey);
            }
        }

        return rowKeys;
    };
    Table.prototype.cellSet = function () {
        var cellSet = this._cellSetCache;

        if (!cellSet) {
            cellSet = [];
            for (var rowKey in this._data) {
                var column = this._data[rowKey];
                for (var colKey in column) {
                    var value = column[colKey];
                    cellSet.push({rowKey: rowKey, colKey: colKey, value: value});
                }
            }
            this._cellSetCache = cellSet;
        }

        return cellSet;
    };
    Table.prototype._invalidateCellSet = function () {
        delete this._cellSetCache;
    };
    Table.prototype.put = function (rowKey, colKey, value) {
        var row = this._data[rowKey];
        if (!row) {
            row = {};
            this._data[rowKey] = row;
        }

        row[colKey] = value;
        this._invalidateCellSet();
    };
    Table.prototype.remove = function (rowKey, colKey) {
        var removed;
        var row = this._data[rowKey];
        if (row) {
            removed = row[colKey];
            if (removed) {
                delete row[colKey];
                if (LangUtils.isObjectEmpty(row)) {
                    delete this._data[rowKey];
                }
            }
        }

        if (removed) {
            this._invalidateCellSet();
        }

        return removed;
    };
    Table.prototype.removeByKey = function (key) {
        var removed = [];

        var row = this.row(key);
        if (row) {
            for (var colKey in row) {
                removed.push(row[colKey]);
            }
            delete this._data[key];
        }

        var table = this;
        var column = this.column(key);

        for (var rowKey in column) {
            var removedElement = table.remove(rowKey, key);
            removed.push(removedElement);
        }

        if (removed.length) {
            this._invalidateCellSet();
        }

        return removed;
    };
    Table.prototype.clear = function () {
        this._data = {};
        this._invalidateCellSet();
    };
    Table.prototype.isEmpty = function () {
        return LangUtils.isObjectEmpty(this._data);
    };
    //================

    CollectionUtils.cloneArray = function (array) {
        var newArray = [];
        for (var index = 0; index < array.length; index++) {
            newArray[index] = array[index];
        }
        return newArray;
    };
    CollectionUtils.cloneAndReverseArray = function (array) {
        var reversed = [];
        for (var index = array.length - 1; index >= 0; index--) {
            reversed[array.length - index - 1] = array[index];
        }
        return reversed;
    };
    CollectionUtils.sortBy = function (objects, property) {
        var sorted = [];

        var propMap = {};
        var props = [];
        for (var objIndex = 0; objIndex < objects.length; objIndex++) {
            var object = objects[objIndex];

            var propValue = object[property];
            var propObjects = propMap[propValue];
            if (!propObjects) {
                propObjects = [];
                propMap[propValue] = propObjects;
            }
            propObjects.push(object);

            if (props.indexOf(propValue) === -1) {
                props.push(propValue);
            }
        }

        props.sort();
        for (var propIndex = 0; propIndex < props.length; propIndex++) {
            var objProp = props[propIndex];
            sorted = sorted.concat(propMap[objProp]);
        }

        return sorted;
    };
    CollectionUtils.indexBy = function (objects, property) {
        var indexed = {};

        for (var index = 0; index < objects.length; index++) {
            var object = objects[index];
            var propValue = object[property];
            indexed[propValue] = object;
        }

        return indexed;
    };

    CollectionUtils.Table = Table;
}());