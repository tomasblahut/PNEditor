'use strict';

(function () {
    angular.module('SharedEditorAssets', [])
        .service('CurrentNet', function () {
            this._currentNet = undefined;

            this.initNewNet = function () {
                this._currentNet = new PNBusiness.PetriNet();
                return this._currentNet;
            };

            this.setCurrentNet = function (net) {
                this._currentNet = net instanceof PNBusiness.PetriNet ? net : new PNBusiness.PetriNet(net);
                this._currentNet.persistenceData = net.persistenceData;
                return this._currentNet;
            };

            this.getCurrentNet = function () {
                if (!this._currentNet) {
                    this._currentNet = new PNBusiness.PetriNet();
                }
                return this._currentNet;
            };
        });
})();
