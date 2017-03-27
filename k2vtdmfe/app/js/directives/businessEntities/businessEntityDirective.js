function businessEntityDirective() {

    var template = "views/businessEntities/businessEntity.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, SweetAlert, $uibModal, toastr, $timeout, AuthService,DTColumnBuilder,DTOptionsBuilder,$q,$compile) {
        var businessEntityCtrl = this;
        businessEntityCtrl.businessEntityData = $scope.content.businessEntity;

        businessEntityCtrl.disableChange = (businessEntityCtrl.businessEntityData.be_status == 'Inactive' || !AuthService.authorizedToEdit(0));

        TDMService.getBEProductCount(businessEntityCtrl.businessEntityData.be_id).then(function(response){
            if (response.errorCode == "SUCCESS") {
                businessEntityCtrl.productCount = response.result;
            }
            else {
                businessEntityCtrl.productCount = 0;
            }
        });

        businessEntityCtrl.saveChanges = function () {
            TDMService.updateBusinessEntity(businessEntityCtrl.businessEntityData.be_id, businessEntityCtrl.businessEntityData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "Updated Successfully");
                    $timeout(function () {
                        $scope.content.openBusinessEntities();
                    }, 400)
                }
                else {
                    toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to Update : " + response.message);
                }
            });
        };

        businessEntityCtrl.deleteBusinessEntity = function () {
            if (businessEntityCtrl.productCount > 0) {
                SweetAlert.swal({
                        title: "Business Entity " + businessEntityCtrl.businessEntityData.be_name +" will be removed from related products. Active tasks which associated to " +
                        " " + businessEntityCtrl.businessEntityData.be_name + " will be set to Inactive. Are you sure to want to delete the BE?",
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
                            TDMService.deleteBusinessEntity(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "deleted Successfully");
                                    $timeout(function () {
                                        $scope.content.openBusinessEntities();
                                    }, 400)
                                }
                                else {
                                    toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to delete");
                                }
                            });
                        }
                    });
            }
            else{
                TDMService.deleteBusinessEntity(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "deleted Successfully");
                        $timeout(function () {
                            $scope.content.openBusinessEntities();
                        }, 400)
                    }
                    else {
                        toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to delete");
                    }
                });
            }
        };

        businessEntityCtrl.addLogicalUnit = function (update, index) {
            if (update == true) {
                var logicalUnit = angular.copy(businessEntityCtrl.logicalUnitsData[index]);
            }
            var logicalUnitModalInstance = $uibModal.open({

                templateUrl: 'views/businessEntities/logicalUnitModal.html',
                resolve: {
                    beId: businessEntityCtrl.businessEntityData.be_id,
                    beName: function () {
                        return businessEntityCtrl.businessEntityData.be_name;
                    }
                },
                controller: function ($scope, $uibModalInstance, TDMService, beId, beName) {

                    var logicalUnitCtrl = this;
                    logicalUnitCtrl.logicalUnit = {
                        product_id : -1
                    };
                    logicalUnitCtrl.saveButton = "ADD";
                    logicalUnitCtrl.title = "ADD_LOGICAL_UNIT";
                    if (update == true) {
                        logicalUnitCtrl.lu_name = logicalUnit.lu_name;
                        logicalUnitCtrl.logicalUnit = logicalUnit;
                        logicalUnitCtrl.saveButton = "Save";
                        logicalUnitCtrl.title = "EDIT_LOGICAL_UNIT";
                    }


                    logicalUnitCtrl.trueFalseOptions = [true, false];

                    TDMService.getLogicalUnits().then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            logicalUnitCtrl.logicalUnitsData = response.result;
                            logicalUnitCtrl.parentLogicalUnitsData = response.result;
                            if (update == true) {
                                logicalUnitCtrl.parentLogicalUnitsData = _.filter(logicalUnitCtrl.parentLogicalUnitsData, function (lu) {
                                    return lu.lu_id !== logicalUnit.lu_id;
                                });
                            }
                            logicalUnitCtrl.parentLogicalUnitsData.unshift({lu_id: null, lu_name: ''});
                            logicalUnitCtrl.logicalUnit.lu_parent = _.find(logicalUnitCtrl.parentLogicalUnitsData, {lu_id: logicalUnitCtrl.logicalUnit.lu_parent_id});
                        }
                        else {
                            logicalUnitCtrl.logicalUnitAlert = {
                                type: 'danger', msg: 'failed to get logical units without product'
                            }
                        }
                    });

                    logicalUnitCtrl.addLogicalUnit = function () {
                        if (logicalUnitCtrl.logicalUnit.lu_name && logicalUnitCtrl.logicalUnit.lu_description) {
                            if ((update == true && logicalUnitCtrl.logicalUnit.lu_name != logicalUnitCtrl.lu_name) ||
                                !update){
                                var lu_found = _.find(logicalUnitCtrl.logicalUnitsData, {lu_name: logicalUnitCtrl.logicalUnit.lu_name});
                                if (lu_found) {
                                    return logicalUnitCtrl.logicalUnitAlert = {
                                        type: 'danger',
                                        msg: 'Logical Unit Name Already Exists for ' + lu_found.be_name
                                    }
                                }
                            }

                            if (logicalUnitCtrl.logicalUnit.lu_parent) {
                                logicalUnitCtrl.logicalUnit.lu_parent_id = logicalUnitCtrl.logicalUnit.lu_parent.lu_id;
                                logicalUnitCtrl.logicalUnit.lu_parent_name = logicalUnitCtrl.logicalUnit.lu_parent.lu_name;
                            }
                            else{
                                logicalUnitCtrl.logicalUnit.lu_parent_name = ""
                            }
                            delete logicalUnitCtrl.logicalUnit.lu_parent;

                            if (update == true) {
                                TDMService.putLogicalUnit(logicalUnitCtrl.logicalUnit).then(function (response) {
                                    if (response.errorCode == "SUCCESS") {
                                        toastr.success("Logical unit saved successfully");
                                        $uibModalInstance.close(logicalUnitCtrl.logicalUnit);
                                    }
                                    else {
                                        logicalUnitCtrl.logicalUnitAlert = {
                                            type: 'danger',
                                            msg: 'failed to Update Logical Unit [' + response.message + ']'
                                        }
                                    }
                                });
                            }
                            else {
                                TDMService.postLogicalUnit(beId, beName, logicalUnitCtrl.logicalUnit).then(function (response) {
                                    if (response.errorCode == "SUCCESS") {
                                        toastr.success("Logical unit added successfully");
                                        logicalUnitCtrl.logicalUnit.lu_id = response.result.id;
                                        logicalUnitCtrl.logicalUnit.product_name = "";
                                        $uibModalInstance.close(logicalUnitCtrl.logicalUnit);
                                    }
                                    else {
                                        logicalUnitCtrl.logicalUnitAlert = {
                                            type: 'danger', msg: 'failed to Add Logical Unit [' + response.message + ']'
                                        }
                                    }
                                });
                            }
                        }
                    };

                    logicalUnitCtrl.closeAlert = function () {
                        delete logicalUnitCtrl.logicalUnitAlert;
                    };

                    logicalUnitCtrl.close = function () {
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'logicalUnitCtrl'
            }).result.then(function (logicalUnit) {
                if (logicalUnit) {
                    if (update == true) {
                        businessEntityCtrl.logicalUnitsData[index] = logicalUnit;
                    }
                    else {
                        businessEntityCtrl.logicalUnitsData.push(logicalUnit);
                    }
                    businessEntityCtrl.dtInstance.reloadData(function(data){}, true);
                }
            });
        };

        businessEntityCtrl.removeLogicalUnit = function (index) {
            TDMService.getLogicalUnits().then(function (response) {
                var luToRemove = businessEntityCtrl.logicalUnitsData[index];
                if (response.errorCode == "SUCCESS") {
                    var childLU = _.find(response.result, {lu_parent_id: luToRemove.lu_id});
                    if (!childLU) {
                        childLU = _.find(businessEntityCtrl.logicalUnitsData, {lu_parent_id: luToRemove.lu_id});
                    }
                    if (!childLU) {
                        TDMService.deleteLogicalUnit(businessEntityCtrl.businessEntityData.be_id, businessEntityCtrl.businessEntityData.be_name, luToRemove.lu_id, luToRemove.lu_name).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                businessEntityCtrl.logicalUnitsData.splice(index, 1);
                                businessEntityCtrl.dtInstance.reloadData(function(data){}, true);
                                if (businessEntityCtrl.logicalUnitsData.length == 0){
                                    TDMService.deleteTaskForBE(businessEntityCtrl.businessEntityData.be_id).then(function(response){

                                    });
                                }
                            }
                            else {
                                toastr.error("Logical Unit " + businessEntityCtrl.logicalUnitsData[index].lu_name, "Failed to delete : " + response.message);
                            }
                        })
                    } else {
                        toastr.error("Logical Unit " + businessEntityCtrl.logicalUnitsData[index].lu_name + " is a parent for lu " + childLU.lu_name);
                    }
                }
                else {
                    toastr.error("Failed to delete logical Unit  " + luToRemove.lu_name);
                }
            });
        };

        businessEntityCtrl.loadingTable = true;
        TDMService.getBELogicalUnits(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                businessEntityCtrl.logicalUnitsData = response.result;
                if (response.errorCode != 'SUCCESS'){
                    //TODO show Error
                    return;
                }
                businessEntityCtrl.dtInstance = {};
                businessEntityCtrl.dtColumns = [];
                businessEntityCtrl.dtColumnDefs = [];
                businessEntityCtrl.headers = [
                    {
                        column : 'lu_name',
                        name : 'Name'
                    },
                    {
                        column : 'lu_description',
                        name : 'Description'
                    },
                    {
                        column : 'lu_parent_name',
                        name : 'Parent LU'
                    },
                    {
                        column : 'product_name',
                        name : 'Product Name',
                        clickAble : false
                    }
                ];

                if (!businessEntityCtrl.disableChange){
                    businessEntityCtrl.headers.push({
                        column : 'actions',
                        name : ''
                    })
                }

                var actionsColumn = function(data, type, full, meta){
                    return '' +
                        '<div class="col-lg-6"><button type="button" uib-tooltip="Edit Logical Unit" tooltip-placement="top"' +
                        'class="btn btn-circle btn-primary" role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ng-click="businessEntityCtrl.addLogicalUnit(true, '+meta.row+')"><i class="fa fa-pencil" aria-hidden="true"></i></button></div>' +
                        '<div class="col-lg-6"><button type="button" uib-tooltip="Delete Logical Unit" tooltip-placement="top"' +
                        'class="btn btn-circle btn-danger" mwl-confirm ' +
                        'message="{{businessEntityCtrl.logicalUnitsData['+meta.row+'].product_id == \'-1\' ? \'Are you sure you want to delete Logical unit ?\' : ' +
                        '\'Logical unit '+ businessEntityCtrl.logicalUnitsData[meta.row].lu_name+ ' will be removed from related products. Active tasks which associated to '+ businessEntityCtrl.logicalUnitsData[meta.row].lu_name+ ' may be set to Inactive. Are you sure you want to delete the LU?\'}}" ' +
                        'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="" ' +
                        'on-confirm="businessEntityCtrl.removeLogicalUnit('+meta.row+')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                        'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ><i class="fa fa-trash" aria-hidden="true"></i></button></div>' +
                        '';
                };

                for (var i = 0; i <  businessEntityCtrl.headers.length ; i++) {
                    if (businessEntityCtrl.headers[i].column == 'actions') {
                        businessEntityCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntityCtrl.headers[i].column).withTitle(businessEntityCtrl.headers[i].name).renderWith(actionsColumn));
                    }
                    else {
                        businessEntityCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntityCtrl.headers[i].column).withTitle(businessEntityCtrl.headers[i].name));
                    }
                }

                businessEntityCtrl.getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(businessEntityCtrl.logicalUnitsData);
                    return deferred.promise;
                };

                businessEntityCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                        return businessEntityCtrl.getTableData();
                    })
                    .withDOM('<"html5buttons"B>lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withButtons([
                    ])
                    .withOption("caseInsensitive",true)
                    .withOption('search',{
                        "caseInsensitive": false
                    })
                    .withLightColumnFilter({
                        0 : {
                            type: 'text'
                        },
                        1 : {
                            type: 'text'
                        },
                        2 : {
                            type: 'select',
                            values: _.map(_.filter(_.unique(_.map(businessEntityCtrl.logicalUnitsData, 'lu_parent_name')),function(el2){
                                if (el2 && el2 != null && el2 != ""){
                                    return true;
                                }
                                return false;
                            }),function(el){
                                return {value : el,label :el}
                            })
                        },
                        3 : {
                            type: 'select',
                            values: _.map(_.filter(_.unique(_.map(businessEntityCtrl.logicalUnitsData, 'product_name')),function(el2){
                                if (el2 && el2 != null && el2 != ""){
                                    return true;
                                }
                                return false;
                            }),function(el){
                                return {value : el,label :el}
                            })
                        }
                    });

                businessEntityCtrl.dtInstanceCallback = function (dtInstance) {
                    if (angular.isFunction(businessEntityCtrl.dtInstance)) {
                        businessEntityCtrl.dtInstance(dtInstance);
                    } else if (angular.isDefined(businessEntityCtrl.dtInstance)) {
                        businessEntityCtrl.dtInstance = dtInstance;
                    }
                };
                if (businessEntityCtrl.dtInstance.changeData != null)
                    businessEntityCtrl.dtInstance.changeData(businessEntityCtrl.getTableData());

                businessEntityCtrl.loadingTable = false;
            }
            else {
                toastr.error("Business entity # " + businessEntityCtrl.businessEntityData.be_name, "Failed to get Logical Units");
            }
        });

        BreadCrumbsService.push({be_name: businessEntityCtrl.businessEntityData.be_name}, 'BUSINESS_ENTITY_BREADCRUMB', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'businessEntityCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('businessEntityDirective', businessEntityDirective);