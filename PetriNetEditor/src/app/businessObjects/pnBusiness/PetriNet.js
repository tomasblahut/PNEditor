'use strict';

var PNBusiness;
if (!PNBusiness) {
    PNBusiness = {};
}

(function () {

    function PetriNet(args) {
        this._arcs = new CollectionUtils.Table(); //Source id, Destionation id, PNArc
        this.loadData(args);
    }

    PetriNet.prototype.loadData = function (data) {
        this._places = [];
        this._transitions = [];
        this._arcs.clear();

        if (data) {
            var dataPlaces = data.places;
            for (var placeIndex = 0; placeIndex < dataPlaces.length; placeIndex++) {
                var dataPlace = dataPlaces[placeIndex];
                this.addPlace(dataPlace);
            }

            var dataTransitions = data.transitions;
            for (var transIndex = 0; transIndex < dataTransitions.length; transIndex++) {
                var dataTransition = dataTransitions[transIndex];
                this.addTransition(dataTransition);
            }

            var arcs = data.arcs;
            for (var rowKey in arcs) {
                var column = arcs[rowKey];
                for (var colKey in column) {
                    var dataArc = column[colKey];
                    this._arcs.put(rowKey, colKey, dataArc);
                }
            }
        }
    };
    PetriNet.prototype.getData = function () {
        var netData = {
            places: this._places,
            transitions: this._transitions,
            arcs: this._arcs.getData()
        };
        return netData;
    };

    PetriNet.prototype.toJSON = function () {
        return this.getData();
    };

    PetriNet.prototype.addPlace = function (args) {
        if (!args.name) {
            args.name = 'P' + (this._places.length + 1);
        }

        var place = {
            id: args.id || StringUtils.uuid(),
            name: args.name || 'P',
            tokens: args.tokens || 0,
            position: args.position,
            labelPosition: args.labelPosition,
            gui: args.gui,
        };
        this._places.push(place);
        return place;
    };
    PetriNet.prototype.addTransition = function (args) {
        if (!args.name) {
            args.name = 'T' + (this._transitions.length + 1);
        }

        var transition = {
            id: args.id || StringUtils.uuid(),
            name: args.name || 'T',
            position: args.position,
            labelPosition: args.labelPosition,
            gui: args.gui
        };
        this._transitions.push(transition);
        return transition;
    };
    PetriNet.prototype.addArc = function (src, dest, args) {
        var srcObject = this.identifyPTObject(src);
        var destObject = this.identifyPTObject(dest);

        var arc = {
            id: (args && args.id) || StringUtils.uuid(),
            srcMagnetic: (args && args.srcMagnetic) || false,
            destMagnetic: (args && args.destMagnetic) || false,
            multiplicity: (args && args.multiplicity) || 1,
            labelPosition: (args && args.labelPosition),
            points: (args && args.points) || [],
            gui: (args && args.gui) || undefined
        };
        this._arcs.put(srcObject.id, destObject.id, arc);
        return arc;
    };

    PetriNet.prototype.findPlace = function (place) {
        var placeId = place ? typeof place === 'string' ? place : place.id : undefined;

        var netPlace;
        for (var placeIndex = 0; placeIndex < this._places.length; placeIndex++) {
            var curPlace = this._places[placeIndex];
            if (curPlace.id === placeId) {
                netPlace = curPlace;
                break;
            }
        }

        if (!netPlace) {
            throw new Error('PetriNet does not contain place: ' + place);
        }
        return netPlace;
    };
    PetriNet.prototype.findTransition = function (transition) {
        var transitionId = transition ? typeof transition === 'string' ? transition : transition.id : undefined;

        var netTransition;
        for (var transIndex = 0; transIndex < this._transitions.length; transIndex++) {
            var curTransition = this._transitions[transIndex];
            if (curTransition.id === transitionId) {
                netTransition = curTransition;
                break;
            }
        }

        if (!netTransition) {
            throw new Error('PetriNet does not contain transition: ' + transition);
        }
        return netTransition;
    };
    PetriNet.prototype.findArc = function (src, dest) {
        var srcObject = this.identifyPTObject(src);
        var destObject = this.identifyPTObject(dest);
        return this._arcs.get(srcObject.id, destObject.id);
    };
    PetriNet.prototype.findInputArcs = function (ptObj) {
        var netObject = this.identifyPTObject(ptObj);
        return this._arcs.column(netObject.id);
    };
    PetriNet.prototype.findOutputArcs = function (ptObj) {
        var netObject = this.identifyPTObject(ptObj);
        return this._arcs.row(netObject.id);
    };

    PetriNet.prototype.removePlace = function (place) {
        var netPlace = this.findPlace(place);
        var index = this._places.indexOf(netPlace);
        this._places.splice(index, 1);

        this._arcs.removeByKey(netPlace.id);
    };
    PetriNet.prototype.removeTransition = function (transition) {
        var netTransition = this.findTransition(transition);
        var index = this._transitions.indexOf(netTransition);
        this._transitions.splice(index, 1);

        this._arcs.removeByKey(netTransition.id);
    };
    PetriNet.prototype.removeArc = function (src, dest) {
        var srcObject = this.identifyPTObject(src);
        var destObject = this.identifyPTObject(dest);
        return this._arcs.remove(srcObject.id, destObject.id);
    };

    PetriNet.prototype.identifyPTObject = function (ptObj) {
        var netObj;
        try {
            netObj = this.findPlace(ptObj);
        } catch (err) {
            netObj = this.findTransition(ptObj);
        }

        return netObj;
    };
    PetriNet.prototype.isEmpty = function () {
        return this._places.length === 0 && this._transitions.length === 0 && this._arcs.isEmpty();
    };

    PetriNet.prototype.places = function () {
        return this._places;
    };
    PetriNet.prototype.transitions = function () {
        return this._transitions;
    };
    PetriNet.prototype.arcs = function () {
        return this._arcs && this._arcs.cellSet();
    };

    PNBusiness.PetriNet = PetriNet;
}());