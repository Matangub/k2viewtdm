function newDataCenterDirective() {

    var template = "views/dataCenters/newDataCenter.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, $timeout) {
        var newDataCenterCtrl = this;

        newDataCenterCtrl.dataCenterData = {};
        newDataCenterCtrl.dataCenters = $scope.content.dataCenters;

        newDataCenterCtrl.addDataCenter = function () {
            if ($scope.newDataCenterForm.$invalid == true){
                return;
            }
            if (_.find(newDataCenterCtrl.dataCenters, {data_center_name: newDataCenterCtrl.dataCenterData.data_center_name,data_center_status : 'Active'})) {
                return toastr.error("Data Center # " + newDataCenterCtrl.dataCenterData.data_center_name + " Already Exists");
            }
            TDMService.createDataCenter(newDataCenterCtrl.dataCenterData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Data Center # " + newDataCenterCtrl.dataCenterData.data_center_name, "Created Successfully");
                    $timeout(function () {
                        $scope.content.openDataCenters();
                    }, 300);
                }
                else {
                    toastr.error("Data Center # " + newDataCenterCtrl.dataCenterData.data_center_name, "Unable to Create : " + response.message);
                }
            });
        };

        BreadCrumbsService.push({}, 'NEW_DATA_CENTER', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'newDataCenterCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newDataCenterDirective', newDataCenterDirective);