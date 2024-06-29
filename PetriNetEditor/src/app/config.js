'use strict';

(function () {
    angular.module('AppConfig', [])
        .constant('StorageConfig', {
            serverAddress: 'http://localhost:8080/',
            resourceURI: 'projectStorage/projectStorage/',
            timeout: 10000,
            resources: {
                projectList: 'getProjectList',
                project: 'getProject',
                save: 'saveProject',
                delete: 'deleteProject'
            }
        })
        .constant('AnalysisConfig', {
            serverAddress: 'http://localhost:8080/',
            resourceURI: 'analysis/',
            timeout: 20000,
            resources: {
                analyzeNet: 'netAnalysis/analyzeNet',
                blindLayout: 'blindLayoutGenerator/blindLayout'
            }
        });
})();
