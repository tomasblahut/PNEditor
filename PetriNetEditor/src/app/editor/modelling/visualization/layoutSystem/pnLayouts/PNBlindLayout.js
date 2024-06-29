'use strict';

(function () {
    angular.module('PNLayouts', [
        'CanvasLayouts'
    ])
        .factory('PNBlindLayout', function ($http, CanvasLayout, Notification, AnalysisConfig, CurrentNet) {

            function PNBlindLayout() {
            }

            var layoutPrototype = createjs.extend(PNBlindLayout, CanvasLayout);

            layoutPrototype.performLayout = function (petriNet, options, defered) {
            
            	var currentNet = CurrentNet.getCurrentNet();
            	var arcs = currentNet.arcs();
        		
                if (petriNet) {
                    var address = AnalysisConfig.serverAddress + AnalysisConfig.resourceURI + AnalysisConfig.resources.blindLayout;
                    $http.post(address, JSON.stringify(petriNet), {timeout: AnalysisConfig.timeout})
                    	.then(function (response) {
                    		var data = response.data;
                    		
                    		var placeIdMap = CollectionUtils.indexBy(currentNet.places(), 'id');
        					var transIdMap = CollectionUtils.indexBy(currentNet.transitions(), 'id');
                    		
                            // Changes the x and y coordinations of Petri net objects
                    		for (var object in data) {
                    			var objects = data[object];
                    			for (var id in objects){
                    				var netObject = placeIdMap[id];
                    				if (!netObject){
                    					netObject = transIdMap[id];
                    				}
                    				var newX = objects[id].position.x;
                    				var newY = objects[id].position.y;
                    				netObject.position = { x: newX, y: newY };
                    			}
                    		}
                    		
                            // Changes the arc points according to the new position of places and transitions.
                    		for (var cellIndex = 0; cellIndex < arcs.length; cellIndex++) {
			            		var arcCell = arcs[cellIndex];
			            		
			            		var sourceObj = placeIdMap[arcCell.rowKey];
			            		if (!sourceObj) {
			            			sourceObj = transIdMap[arcCell.rowKey];
			            		}
			            		
			            		var destObj = placeIdMap[arcCell.colKey];
			            		if (!destObj) {
			            			destObj = transIdMap[arcCell.colKey];
			            		}
			            		
			            		var srcPoint = new createjs.Point(sourceObj.position.x, sourceObj.position.y);
			            		var destPoint = new createjs.Point(destObj.position.x, destObj.position.y);
			            		
			            		var arcPoints = [];
			            		
			            		var srcObjShape = layoutPrototype._prepareConnectedObj(arcCell.rowKey, placeIdMap, transIdMap);
			                    arcPoints.push(CanvasUtils.shapeCenterIntersect(srcObjShape, destPoint));
			                    
			                    var destObjShape = layoutPrototype._prepareConnectedObj(arcCell.colKey, placeIdMap, transIdMap);
			                    arcPoints.push(CanvasUtils.shapeCenterIntersect(destObjShape, srcPoint));
			                    
			                    var arc = currentNet.findArc(arcCell.rowKey, arcCell.colKey);
			                    arc.points = arcPoints;
			            		arc.labelPosition = undefined;
			            		
			        		}
                    		defered.resolve();
                        },
                        function (response) {
                            Notification.error({
                                title: 'Communication error',
                                message: 'Error while contacting analysis server. ' +
                                (response.data ? '. ' + response.data : 'Unknown error') + '.<br/> Response status: ' + response.status,
                                positionY: 'bottom', positionX: 'right',
                                delay: 3000
                            });
                        });      
                }
            };

            layoutPrototype.getDefaultOptions = function () {
                return {
                    nodeSep: 100,
                    rankSep: 125,
                    leftMargin: 125,
                    topMargin: 125,
                };
            };
            
            layoutPrototype.interrupt = function () {
            };
            layoutPrototype.dispose = function () {
            };
            
            layoutPrototype._prepareConnectedObj = function (id, placeIdMap, transIdMap) {
		        var place = placeIdMap[id];
		        if (place) {
		            return {center: place.position, radius: 20, type: 'place'};
		        }
		        else {
		            var transition = transIdMap[id];
		            return {center: transition.position, width: 15, height: 40, rotation: 0, type: 'transition'};
		        }
		    };

            return PNBlindLayout;
        });
})();

