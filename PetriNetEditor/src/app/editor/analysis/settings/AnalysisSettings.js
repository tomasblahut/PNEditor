'use strict';

(function () {
    angular.module('AnalysisSettings', [])
        .service('AnalysisSettings', function ($mdDialog, CurrentNet) {
            var service = this;

            this.showSettingsDialog = function () {
                
                if (changeInPlaces()) {
                	service._settings.propertiesToCheck[7].preferences.placeIds = createDictId();
                	service._settings.propertiesToCheck[7].preferences.placeNames = createDictName();
                }
            
                var promise = $mdDialog.show({
                    clickOutsideToClose: false,
                    templateUrl: 'editor/analysis/settings/analysisSettings.tmpl.html',
                    controller: function ($scope) {
                        $scope.propertiesToCheck = _.cloneDeep(service._settings.propertiesToCheck);
                        $scope.analysisMethods = _.cloneDeep(service._settings.analysisMethods);

                        $scope.saveSettings = function () {
                            $mdDialog.hide({
                                analysisMethods: $scope.analysisMethods,
                                propertiesToCheck: $scope.propertiesToCheck
                            });
                        };

                        $scope.close = function () {
                            $mdDialog.cancel();
                        };
                    }
                });

                promise.then(function (updatedSettings) {
                    if (updatedSettings) {
                        _.merge(service._settings, updatedSettings);
                    }
                });
            };

            this.getSettings = function () {
                return this._settings;
            };
            this.getSelectedProperties = function () {
                return _.map(_.filter(this._settings.propertiesToCheck, 'enabled', true), function (prop) {
                    return prop.type;
                });
            };
            this.getSelectedAnalysisMethods = function () {
                return _.map(_.filter(this._settings.analysisMethods, 'enabled', true), function (method) {
                    return _.pick(method, ['type', 'preferences']);
                });
            };
            this.getReachabilityPreferences = function () {
            	return service._settings.propertiesToCheck[7].preferences.placeIds;
            };
            this.initReachabilityPreferences = function () {
            	service._settings.propertiesToCheck[7].preferences.placeIds = createDictId();
                service._settings.propertiesToCheck[7].preferences.placeNames = createDictName();
            };
            
            function changeInPlaces () {
            	var storedPlaces = service._settings.propertiesToCheck[7].preferences.placeIds;
            	var placesKeys = Object.keys(storedPlaces);
            	var places = CurrentNet.getCurrentNet().places();
            	
            	if (placesKeys.length != places.length) {
            		return true;
            	}
            	for (var place in places) {
            		if (!storedPlaces.hasOwnProperty(places[place].id)) {
            			return true;
            		}
            	}
            	
            	var storedPlacesNames = service._settings.propertiesToCheck[7].preferences.placeNames;
            	var names = _.values(storedPlacesNames);
            	for (place in places) {
            		if (!_.contains(names, places[place].name)) {
            			return true;
            		}
            	}
            	return false;
            }
            
            function createDictId() {
			  	var placesDict = {};
			  	CurrentNet.getCurrentNet().places().forEach(function(place) {
			    	placesDict[place.id] = 0; 
			  	}); 
			  	return placesDict;
			}
			
			function createDictName() {
			  	var placesDict = {};
			  	CurrentNet.getCurrentNet().places().forEach(function(place) {
			    	placesDict[place.id] = place.name; 
			  	}); 
			  	return placesDict;
			}

            function initSettings() {
                service._settings = {
                    analysisMethods: [
                        {
                            name: 'State space',
                            type: 'stateSpace',
                            templateUrl: 'editor/analysis/settings/analysisMethodTemplates/stateSpaceMethod.tmpl.html',
                            preferences: {
                                lazyCoveringLevel: 1,
                                expandWholeTree: false,
                                graphNodeLimit: 250
                            },
                            enabled: true
                        },
                        {
                            name: 'Invariants',
                            type: 'invariant',
                            preferences: {},
                            enabled: true
                        },
                        {
                            name: 'Net classification',
                            type: 'classification',
                            preferences: {},
                            enabled: true
                        },
                        {
                            name: 'Traps & Cotraps',
                            type: 'trapCotrap',
                            preferences: {},
                            enabled: true
                        },
                        {
                            name: 'Cycles',
                            type: 'cycles',
                            preferences: {},
                            enabled: true
                        },
                        {
                        	name: 'New Modified Reachability Tree',
                        	type: 'nmrt',
                        	preferences: {},
                        	enabled: true
                        }
                    ],
                    propertiesToCheck: [
                        {name: 'Boundedness', type: 'boundedness', enabled: true},
                        {name: 'Safety', type: 'safety', enabled: true},
                        {name: 'Reversibility', type: 'reversibility', enabled: true},
                        {name: 'Liveness', type: 'liveness', enabled: true},
                        {name: 'Repetitiveness', type: 'repetitiveness', enabled: true},
                        {name: 'Conservativeness', type: 'conservativeness', enabled: true},
                        {name: 'Deadlock free', type: 'deadlockFree', enabled: true},
                        {
                        	name: 'Reachability',
                        	type: 'reachability',
                        	templateUrl: 'editor/analysis/settings/analysisMethodTemplates/reachability.tmpl.html',
                        	preferences: {
                        		placeIds: [],
                        		placeNames: []
                        	},
                        	enabled: true
                        }
                    ]
                };
                
            }

            initSettings();
        });
}());