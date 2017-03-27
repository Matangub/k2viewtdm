function dataCentersCtrl ($scope,BreadCrumbsService){
    var dataCentersCtrl = this;
    dataCentersCtrl.pageDisplay = 'dataCentersTable';

    dataCentersCtrl.openDataCenters = function(){
        dataCentersCtrl.dataCentersData = {
            openDataCenter : dataCentersCtrl.openDataCenter,
            openNewDataCenter : dataCentersCtrl.openNewDataCenter
        };
        dataCentersCtrl.pageDisplay = 'dataCentersTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    dataCentersCtrl.openDataCenter = function(dataCenter){
        dataCentersCtrl.dataCenterData = {
            dataCenter : dataCenter,
            openDataCenters : dataCentersCtrl.openDataCenters

        };
        dataCentersCtrl.pageDisplay = 'dataCenter';
    };

    dataCentersCtrl.openNewDataCenter = function(dataCenters){
        dataCentersCtrl.newDataCenterData = {
            dataCenters: dataCenters,
            openDataCenters : dataCentersCtrl.openDataCenters
        };
        dataCentersCtrl.pageDisplay = 'newDataCenter';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'DATA_CENTERS',function(){
        dataCentersCtrl.openDataCenters();
    });

    dataCentersCtrl.dataCentersData = {
        openDataCenter : dataCentersCtrl.openDataCenter,
        openNewDataCenter : dataCentersCtrl.openNewDataCenter
    };
    dataCentersCtrl.pageDisplay = 'dataCentersTable';
}

angular
    .module('TDM-FE')
    .controller('dataCentersCtrl' , dataCentersCtrl);