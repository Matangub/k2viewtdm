function environmentsCtrl ($scope,BreadCrumbsService){
    var environmentsCtrl = this;
    environmentsCtrl.pageDisplay = 'environmentsTable';

    environmentsCtrl.openEnvironments = function(){
        environmentsCtrl.environmentsData = {
            openEnvironment : environmentsCtrl.openEnvironment,
            openNewEnvironment : environmentsCtrl.openNewEnvironment
        };
        environmentsCtrl.pageDisplay = 'environmentsTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    environmentsCtrl.openEnvironment = function(environmentData){
        environmentsCtrl.environmentData = {
            environmentData : environmentData,
            openEnvironments : environmentsCtrl.openEnvironments,
            openProduct : environmentsCtrl.openProduct,
            openEnvironment : environmentsCtrl.openEnvironment
        };
        environmentsCtrl.pageDisplay = 'environment';
    };

    environmentsCtrl.openNewEnvironment = function(environments){
        environmentsCtrl.newEnvironmentData = {
            environments: environments,
            openEnvironments : environmentsCtrl.openEnvironments
        };
        environmentsCtrl.pageDisplay = 'newEnvironment';
    };

    environmentsCtrl.openProduct = function(productData){
        environmentsCtrl.productData = {
            productData : productData
        };
        environmentsCtrl.pageDisplay = 'environmentProduct';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'ENVIRONMENTS',function(){
        environmentsCtrl.openEnvironments();
    });

    environmentsCtrl.environmentsData = {
        openEnvironment : environmentsCtrl.openEnvironment,
        openNewEnvironment : environmentsCtrl.openNewEnvironment
    };
    environmentsCtrl.pageDisplay = 'environmentsTable';
}

angular
    .module('TDM-FE')
    .controller('environmentsCtrl' , environmentsCtrl);