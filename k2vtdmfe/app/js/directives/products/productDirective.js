function productDirective() {

    var template = "views/products/product.html";

    var controller = function ($scope,$compile, TDMService, BreadCrumbsService, $uibModal, toastr, $timeout, SweetAlert, AuthService,DTColumnBuilder,DTOptionsBuilder,$q) {
        var productCtrl = this;
        productCtrl.productData = $scope.content.productData;

        productCtrl.productData.product_versions = productCtrl.productData.product_versions.split(',');

        productCtrl.supportedDBTypes = TDMService.getDBTypes();
        productCtrl.disableChange = (productCtrl.productData.product_status == 'Inactive' || !AuthService.authorizedToEdit(0) || !$scope.content.openProducts);

        productCtrl.addInterface = function (update, index) {
            if (update == true) {
                var productInterface = angular.copy(productCtrl.interfacesData[index]);
            }
            var productInterfacesModalInstance = $uibModal.open({

                templateUrl: 'views/products/productDBInterfaceModal.html',
                resolve: {
                    productID: productCtrl.productData.product_id,
                    productName: function () {
                        return productCtrl.productData.product_name
                    }
                },
                controller: function ($scope, $uibModalInstance, TDMService, productID, productName) {

                    var productInterfacesCtrl = this;
                    productInterfacesCtrl.productDBInterface = {};
                    productInterfacesCtrl.saveButton = "ADD";
                    if (update == true) {
                        productInterfacesCtrl.productDBInterface = productInterface;
                        productInterfacesCtrl.productDBInterface.general_interface_type_id = productInterfacesCtrl.productDBInterface.interface_type_id;
                        productInterfacesCtrl.saveButton = "SAVE";
                    }
                    productInterfacesCtrl.supportedDBTypes = TDMService.getDBTypes();
                    productInterfacesCtrl.title = "ADD_DB_INTERFACE";
                    productInterfacesCtrl.addProductDBInterface = function () {
                        if (productInterfacesCtrl.productDBInterface.interface_name && productInterfacesCtrl.productDBInterface.interface_type_id) {
                            if (update == true) {
                                if (_.find(productCtrl.interfacesData, {
                                        interface_name: productInterfacesCtrl.productDBInterface.interface_name,
                                        interface_type_id: productInterfacesCtrl.productDBInterface.interface_type_id
                                    })) {
                                    return toastr.error("No Changes Made Or Interface With The Same Name And Type Already Exists");
                                }
                                TDMService.putProductInterface(productID, productName, productInterface.interface_id, productInterfacesCtrl.productDBInterface).then(function (response) {
                                    if (response.errorCode == "SUCCESS") {
                                        if (productInterfacesCtrl.productDBInterface.general_interface_type_id == productInterfacesCtrl.productDBInterface.interface_type_id){
                                            $uibModalInstance.close(productInterfacesCtrl.productDBInterface);
                                            return;
                                        }
                                        if (productCtrl.hasActiveEnvironment.length > 0){
                                            var envMessage = "";
                                            for(var i = 0;i < productCtrl.hasActiveEnvironment.length ; i++){
                                                envMessage = envMessage + productCtrl.hasActiveEnvironment[i].environment_name;
                                                if (i < productCtrl.hasActiveEnvironment.length - 1){
                                                    envMessage = envMessage + ",";
                                                }
                                            }
                                            SweetAlert.swal({
                                                title: "Warning",
                                                type : "warning",
                                                text: "Please Update the interface details for related environments [" + envMessage + "]"
                                            });
                                        }
                                        $uibModalInstance.close(productInterfacesCtrl.productDBInterface);
                                    }
                                    else {
                                        productInterfacesCtrl.interfacesAlert = {
                                            type: 'danger',
                                            msg: 'failed to Update DB Interface [' + response.message + ']'
                                        }
                                    }
                                });
                            }
                            else {
                                if (_.find(productCtrl.interfacesData, {
                                        interface_name: productInterfacesCtrl.productDBInterface.interface_name,
                                        interface_type_id: productInterfacesCtrl.productDBInterface.interface_type_id
                                    })) {
                                    return toastr.error("Interface With The Same Name And Type Already Exists");
                                }
                                TDMService.postProductInterface(productID, productName, productInterfacesCtrl.productDBInterface).then(function (response) {
                                    if (response.errorCode == "SUCCESS") {
                                        if (productCtrl.hasActiveEnvironment.length > 0){
                                            var envMessage = "";
                                            for(var i = 0;i < productCtrl.hasActiveEnvironment.length ; i++){
                                                envMessage = envMessage + productCtrl.hasActiveEnvironment[i].environment_name;
                                                if (i < productCtrl.hasActiveEnvironment.length - 1){
                                                    envMessage = envMessage + ",";
                                                }
                                            }
                                            SweetAlert.swal({
                                                title: "Warning",
                                                type : "warning",
                                                text: "Please add the interface details for related environments [" + envMessage + "]"
                                            });
                                        }
                                        productInterfacesCtrl.productDBInterface.interface_id = response.result;
                                        $uibModalInstance.close(productInterfacesCtrl.productDBInterface);
                                    }
                                    else {
                                        productInterfacesCtrl.interfacesAlert = {
                                            type: 'danger',
                                            msg: 'failed to Add DB Interface [' + response.message + ']'
                                        }
                                    }
                                });
                            }
                        }
                    };

                    productInterfacesCtrl.close = function () {
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'productInterfacesCtrl'
            }).result.then(function (productInterface) {
                if (productInterface) {
                    if (update == true) {
                        productCtrl.interfacesData[index] = productInterface;
                    }
                    else {
                        productCtrl.interfacesData.push(productInterface);
                    }
                    productCtrl.dtInstanceInterfaces.reloadData(function(data){}, true);
                }
            });
        };

        productCtrl.removeInterface = function (index) {
            if (productCtrl.hasActiveEnvironment.length > 0){
                SweetAlert.swal({
                        title: (productCtrl.interfacesData.length == 1 ?
                            "Product may be deleted from environments. Related tasks may also be deleted" : "Interface may be also deleted from environments having this product." ) +
                            "Are you sure ?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "No",
                        cancelButtonText: "Yes",
                        closeOnConfirm: true,
                        closeOnCancel: true,
                        animation: "false",
                        customClass : "animated fadeInUp"
                    },
                    function (isConfirm) {
                        if (!isConfirm) {
                            TDMService.deleteProductInterface(productCtrl.productData.product_id, productCtrl.productData.product_name, productCtrl.interfacesData[index].interface_id, productCtrl.interfacesData[index].interface_name,productCtrl.interfacesData.length,productCtrl.hasActiveEnvironment.length).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    productCtrl.interfacesData.splice(index, 1);
                                    productCtrl.dtInstanceInterfaces.reloadData(function(data){}, true);
                                }
                                else {
                                    toastr.error("Interface # " + productCtrl.interfacesData[index].interface_name, "Failed to delete : " + response.message);
                                }
                            })
                        }
                    });
            }
            else {
                TDMService.deleteProductInterface(productCtrl.productData.product_id, productCtrl.productData.product_name, productCtrl.interfacesData[index].interface_id, productCtrl.interfacesData[index].interface_name,productCtrl.interfacesData.length,productCtrl.hasActiveEnvironment.length).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        productCtrl.interfacesData.splice(index, 1);
                        productCtrl.dtInstanceInterfaces.reloadData(function(data){}, true);
                    }
                    else {
                        toastr.error("Interface # " + productCtrl.interfacesData[index].interface_name, "Failed to delete : " + response.message);
                    }
                })
            }
        };

        productCtrl.addLogicalUnit = function () {
            var productLogicalUnitModalInstance = $uibModal.open({
                templateUrl: 'views/products/productLogicalUnitModal.html',
                resolve: {
                    productID: function () {
                        return productCtrl.productData.product_id
                    },
                    productName: function () {
                        return productCtrl.productData.product_name
                    }
                },
                controller: function ($scope, $uibModalInstance, TDMService, productID, productName) {

                    var productLogicalUnitCtrl = this;
                    productLogicalUnitCtrl.title = "ADD_LOGICAL_UNIT";


                    TDMService.getLogicalUnitsWithoutProduct().then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            productLogicalUnitCtrl.logicalUnitsWithoutProductData = _.map(response.result,function(lu){
                                lu.be_id = parseInt(lu.be_id);
                                return lu;
                            });
                            TDMService.getBusinessEntities().then(function(response){
                                if (response.errorCode == "SUCCESS") {
                                    productLogicalUnitCtrl.businessEntities = _.filter(response.result,function(be){
                                        if (be.be_status == 'Active' && _.find(productLogicalUnitCtrl.logicalUnitsWithoutProductData,{be_id : be.be_id})){
                                            return true;
                                        }
                                        return false;
                                    });
                                }
                                else {
                                    productLogicalUnitCtrl.businessEntitiesAlert = {
                                        type: 'danger', msg: 'failed to get logical units without product'
                                    }
                                }
                            });
                        }
                        else {
                            productLogicalUnitCtrl.logicalUnitAlert = {
                                type: 'danger', msg: 'failed to get logical units without product'
                            }
                        }
                    });

                    productLogicalUnitCtrl.addLogicalUnit = function () {
                        productLogicalUnitCtrl.newProductLogicalUnit.product_id = productID;
                        productLogicalUnitCtrl.newProductLogicalUnit.product_name = productName;
                        TDMService.putLogicalUnit(productLogicalUnitCtrl.newProductLogicalUnit).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                $uibModalInstance.close(productLogicalUnitCtrl.newProductLogicalUnit);
                            }
                            else {
                                productLogicalUnitCtrl.logicalUnitAlert = {
                                    type: 'danger', msg: 'failed to Add Logical Unit [' + response.message + ']'
                                }
                            }
                        });
                    };

                    productLogicalUnitCtrl.closeAlert = function () {
                        delete productLogicalUnitCtrl.logicalUnitAlert;
                    };

                    productLogicalUnitCtrl.close = function () {
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'productLogicalUnitCtrl'
            }).result.then(function (newProductLogicalUnit) {
                if (newProductLogicalUnit) {
                    productCtrl.logicalUnitsData.push(newProductLogicalUnit);
                }
                productCtrl.dtInstanceLUs.reloadData(function(data){}, true);
            });
        };

        productCtrl.removeLogicalUnit = function (index) {
            var tmpArr = angular.copy(productCtrl.logicalUnitsData);
            var el = tmpArr.splice(index, 1);
            el[0].product_id = -1;
            el[0].product_name = '';
            TDMService.putLogicalUnit(el[0]).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    productCtrl.logicalUnitsData.splice(index, 1);
                    if (productCtrl.logicalUnitsData.length == 0){
                        for (var i = 0;i <  productCtrl.hasActiveEnvironment.length; i++){
                            TDMService.deleteEnvProduct(productCtrl.hasActiveEnvironment[i].environment_id,
                                productCtrl.hasActiveEnvironment[i].environment_name,
                                productCtrl.productData.product_id).then(function(response){

                            });
                        }
                    }
                    productCtrl.dtInstanceLUs.reloadData(function(data){}, true);
                }
                else {
                    toastr.error("Logical Unit " + productCtrl.logicalUnitsData[index].lu_name, "Failed to delete : " + response.message);
                }
            })
        };

        productCtrl.loadingTableInterfaces = true;
        TDMService.getProductEnvCount(productCtrl.productData.product_id).then(function(response){
            if (response.errorCode == 'SUCCESS'){
                productCtrl.hasActiveEnvironment = response.result;
                productCtrl.loadingTableLUs = true;

                TDMService.getProductLogicalUnits(productCtrl.productData.product_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        productCtrl.logicalUnitsData = response.result;
                        productCtrl.dtInstanceLUs = {};
                        productCtrl.dtColumnsLUs = [];
                        productCtrl.dtColumnDefsLUs = [];
                        productCtrl.headersLUs = [
                            {
                                column : 'lu_name',
                                name : 'Name',
                                clickAble : true
                            },
                            {
                                column : 'lu_description',
                                name : 'Description',
                                clickAble : false
                            },
                            {
                                column : 'lu_parent_name',
                                name : 'Parent LU',
                                clickAble : false
                            },
                            {
                                column : 'be_name',
                                name : 'Business Entitiy',
                                clickAble : false
                            },
                            {
                                column : 'actions',
                                name : '',
                                clickAble : false
                            }
                        ];

                        var renderLUActions = function(data, type, full, meta){
                            var message = "";

                            if (productCtrl.hasActiveEnvironment.length > 0){
                                if (productCtrl.logicalUnitsData.length == 1){
                                    message = 'Logical Unit ' + full.lu_name +' is attached to testing environments. If you remove this Logical Unit, product may be removed from environments. Tasks for this product may be also deleted. Are you sure you want to delete it ?'
                                }
                                else{
                                    message  = 'Logical Unit ' + full.lu_name +' is attached to testing environments. Are you sure you want to delete it ?' ;
                                }

                            }
                            else {
                                message = "Are you sure you want to delete this Logical Unit?";
                            }

                            return '<div class="row">' +
                                '<div class="col-lg-6"><button type="button" uib-tooltip="Delete Logical Unit" tooltip-placement="top" ' +
                                'class="btn btn-circle btn-danger" mwl-confirm message="' + message + '" ' +
                                'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="" ' +
                                'on-confirm="productCtrl.removeLogicalUnit('+meta.row+')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                                'role-handler="" role="0" ng-if="!productCtrl.disableChange" ><i class="fa fa-trash" aria-hidden="true"></i></button></div>' +
                                '</div>';
                        };


                        for (var i = 0; i <  productCtrl.headersLUs.length ; i++) {
                            if (productCtrl.headersLUs[i].column == 'actions'){
                                productCtrl.dtColumnsLUs.push(DTColumnBuilder.newColumn(productCtrl.headersLUs[i].column).withTitle(productCtrl.headersLUs[i].name).renderWith(renderLUActions));

                            }
                            else{
                                productCtrl.dtColumnsLUs.push(DTColumnBuilder.newColumn(productCtrl.headersLUs[i].column).withTitle(productCtrl.headersLUs[i].name));
                            }
                        }

                        var getTableDataLUs = function () {
                            var deferred = $q.defer();
                            deferred.resolve(productCtrl.logicalUnitsData);
                            return deferred.promise;
                        };

                        productCtrl.dtOptionsLUs = DTOptionsBuilder.fromFnPromise(function () {
                                return getTableDataLUs();
                            })
                            .withDOM('<"html5buttons"B>lTfgitp')
                            .withOption('createdRow', function (row) {
                                // Recompiling so we can bind Angular directive to the DT
                                $compile(angular.element(row).contents())($scope);
                            })
                            .withOption('scrollX', false)
                            .withOption('lengthChange', false)
                            .withOption('paging', false)
                            .withOption('searching', false)
                            .withOption('info', false)
                            .withButtons([])
                            .withButtons([
                            ])
                            .withOption('search',{
                                "caseInsensitive": false
                            });


                        productCtrl.dtInstanceCallbackLUs = function (dtInstance) {
                            if (angular.isFunction(productCtrl.dtInstanceLUs)) {
                                productCtrl.dtInstance(dtInstance);
                            } else if (angular.isDefined(productCtrl.dtInstanceLUs)) {
                                productCtrl.dtInstanceLUs = dtInstance;
                            }
                        };
                        if (productCtrl.dtInstanceLUs.changeData != null)
                            productCtrl.dtInstanceLUs.changeData(getTableDataLUs());

                        productCtrl.loadingTableLUs = false;
                    }
                    else {
                        toastr.error("Product # " + productCtrl.productData.product_name, "failed to get Logical Units");
                    }
                });
                TDMService.getProductInterfaces(productCtrl.productData.product_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        productCtrl.interfacesData = _.filter(response.result,function(el){
                            return (el.interface_status == 'Active');
                        });
                        productCtrl.dtInstanceInterfaces = {};
                        productCtrl.dtColumnsInterfaces = [];
                        productCtrl.dtColumnDefsInterfaces = [];
                        productCtrl.headersInterfaces = [
                            {
                                column : 'interface_name',
                                name : 'Interface name',
                                clickAble : true
                            },
                            {
                                column : 'interface_type_id',
                                name : 'Interface type',
                                clickAble : false
                            },
                            {
                                column : 'actions',
                                name : '',
                                clickAble : false
                            }
                        ];

                        var renderInterfaceType = function(data, type, full, meta){
                            if (data){
                                var interface_type = _.find(productCtrl.supportedDBTypes,{db_type_id : data });
                                if (interface_type){
                                    return interface_type.db_type_name;
                                }
                            }
                            return '';
                        };

                        var renderInterfaceActions = function(data, type, full, meta){
                            var message = "";

                            if (productCtrl.hasActiveEnvironment.length > 0){
                                if (productCtrl.interfacesData.length == 1){
                                    message = 'Interface ' + full.interface_name +' is attached to testing environments. If you remove this interface, product may be removed from environments. Tasks for this product may be also deleted. Are you sure you want to delete it ?'
                                }
                                else{
                                    message  = 'Interface ' + full.interface_name +' is attached to testing environments. Are you sure you want to delete it ?' ;
                                }

                            }
                            else {
                                message = "Are you sure you want to delete this interface?";
                            }

                            return '' +
                                '<div style="text-align: center;"><button style="margin-left: 10px" type="button" uib-tooltip="Edit DB Interface" tooltip-placement="top" ' +
                                'class="btn btn-circle btn-primary" role-handler="" role="0" ng-if="!productCtrl.disableChange" ' +
                                'ng-click="productCtrl.addInterface(true, '+meta.row+')"><i class="fa fa-pencil" aria-hidden="true"></i></button>' +
                                '<button style="margin-left: 10px" type="button" uib-tooltip="Delete DB Interface" tooltip-placement="top" ' +
                                'role-handler="" role="0" ng-if="!productCtrl.disableChange" class="btn btn-circle btn-danger" mwl-confirm message="' + message + '" ' +
                                'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="Delete Interface" ' +
                                'on-confirm="productCtrl.removeInterface('+meta.row+')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                                'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ><i class="fa fa-trash" aria-hidden="true"></i></button></div>' +
                                '';
                        };

                        for (var i = 0; i <  productCtrl.headersInterfaces.length ; i++) {
                            if (productCtrl.headersInterfaces[i].column == 'interface_type_id'){
                                productCtrl.dtColumnsInterfaces.push(DTColumnBuilder.newColumn(productCtrl.headersInterfaces[i].column).withTitle(productCtrl.headersInterfaces[i].name).renderWith(renderInterfaceType));
                            }
                            else if (productCtrl.headersInterfaces[i].column == 'actions'){
                                productCtrl.dtColumnsInterfaces.push(DTColumnBuilder.newColumn(productCtrl.headersInterfaces[i].column).withTitle(productCtrl.headersInterfaces[i].name).renderWith(renderInterfaceActions));

                            }
                            else {
                                productCtrl.dtColumnsInterfaces.push(DTColumnBuilder.newColumn(productCtrl.headersInterfaces[i].column).withTitle(productCtrl.headersInterfaces[i].name));
                            }
                        }

                        var getTableDataInterfaces = function () {
                            var deferred = $q.defer();
                            deferred.resolve(productCtrl.interfacesData);
                            return deferred.promise;
                        };

                        productCtrl.dtOptionsInterfaces = DTOptionsBuilder.fromFnPromise(function () {
                                return getTableDataInterfaces();
                            })
                            .withDOM('<"html5buttons"B>lTfgitp')
                            .withOption('createdRow', function (row) {
                                // Recompiling so we can bind Angular directive to the DT
                                $compile(angular.element(row).contents())($scope);
                            })
                            .withOption('scrollX', false)
                            .withOption('lengthChange', false)
                            .withOption('paging', false)
                            .withOption('searching', false)
                            .withOption('info', false)
                            .withButtons([])
                            .withButtons([
                            ])
                            .withOption('search',{
                                "caseInsensitive": false
                            });

                        productCtrl.dtInstanceCallbackInterfaces = function (dtInstance) {
                            if (angular.isFunction(productCtrl.dtInstanceInterfaces)) {
                                productCtrl.dtInstance(dtInstance);
                            } else if (angular.isDefined(productCtrl.dtInstanceInterfaces)) {
                                productCtrl.dtInstanceInterfaces = dtInstance;
                            }
                        };
                        if (productCtrl.dtInstanceInterfaces.changeData != null)
                            productCtrl.dtInstanceInterfaces.changeData(getTableDataInterfaces());

                        productCtrl.loadingTableInterfaces = false;

                    }
                    else {
                        toastr.error("Product # " + productCtrl.productData.product_name, "failed to get DB Interfaces");
                    }
                });
            }
            else {
                productCtrl.hasActiveEnvironment = [];
            }
        });

        productCtrl.saveChanges = function () {
            var productToUpdate = angular.copy(productCtrl.productData);
            productToUpdate.product_versions = productToUpdate.product_versions.join(',');
            TDMService.updateProduct(productCtrl.productData.product_id, productToUpdate).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + productCtrl.productData.product_name, "Updated Successfully");
                    $timeout(function () {
                        $scope.content.openProducts();
                    }, 400)
                }
                else {
                    toastr.error("Product # " + productCtrl.productData.product_name, "failed to Update : " + response.message);
                }
            });
        };

        productCtrl.deleteProduct = function () {
            if (productCtrl.hasActiveEnvironment.length > 0) {
                SweetAlert.swal({
                        title: "Product may be deleted from environments. Related tasks may also be deleted,Are you sure ?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "No",
                        cancelButtonText: "Yes",
                        closeOnConfirm: true,
                        closeOnCancel: true,
                        animation: "false",
                        customClass: "animated fadeInUp"
                    },
                    function (isConfirm) {
                        if (!isConfirm) {
                            TDMService.deleteProduct(productCtrl.productData.product_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    toastr.success("Product # " + productCtrl.productData.product_id, "deleted Successfully");
                                    $timeout(function () {
                                        $scope.content.openProducts();
                                    }, 400)
                                }
                                else {
                                    toastr.error("Product # " + productCtrl.productData.product_id, "failed to delete");
                                }
                            });
                        }
                    });
            }
            else{
                TDMService.deleteProduct(productCtrl.productData.product_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Product # " + productCtrl.productData.product_id, "deleted Successfully");
                        $timeout(function () {
                            $scope.content.openProducts();
                        }, 400)
                    }
                    else {
                        toastr.error("Product # " + productCtrl.productData.product_id, "failed to delete");
                    }
                });
            }
        };

        productCtrl.addVersion = function(newVersion){
            if (newVersion){
                if (!productCtrl.productData.product_versions){
                    productCtrl.productData.product_versions = [];
                }
                if (productCtrl.productData.product_versions.indexOf(newVersion) >= 0){
                    productCtrl.addVersionError = true;
                }
                else{
                    productCtrl.productData.product_versions.push(newVersion);
                    productCtrl.isOpen = false;
                }
            }
        };

        productCtrl.initAddVersionPopup = function(){
            productCtrl.addVersionError = false;
            productCtrl.versionToAdd = '';
            productCtrl.isOpen = true;
        };

        BreadCrumbsService.push({productID: productCtrl.productData.product_name}, 'PRODUCT_BREADCRUMB', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'productCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('productDirective', productDirective);