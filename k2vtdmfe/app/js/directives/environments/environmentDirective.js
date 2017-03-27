function environmentDirective() {

    var template = "views/environments/environment.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, SweetAlert, $timeout, AuthService,DTColumnBuilder, DTOptionsBuilder, $q,$compile,$uibModal) {
        var environmentCtrl = this;
        environmentCtrl.environmentData = $scope.content.environmentData;
        environmentCtrl.pageDisplay = 'environment';
        var userRole = AuthService.getRole();
        environmentCtrl.showEnvironment = true;
        environmentCtrl.disableOwnersChange = (environmentCtrl.environmentData.environment_status == 'Inactive' || !AuthService.authorizedToEdit(0));


        environmentCtrl.barOptions = {
            scaleBeginAtZero : true,
            scaleShowGridLines : true,
            scaleGridLineColor : "rgba(0,0,0,.05)",
            scaleGridLineWidth : 1,
            barShowStroke : false,
            barStrokeWidth : 0
        };

        environmentCtrl.getSummaryData = function(){
            environmentCtrl.loadingSummary = true;
            TDMService.getEnvironmentSummary(environmentCtrl.environmentData.environment_id).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.summaryData = response.result;
                    environmentCtrl.summaryData.tasks.active = parseInt(environmentCtrl.summaryData.tasks.active);
                    environmentCtrl.summaryData.tasks.onHold = parseInt(environmentCtrl.summaryData.tasks.onhold);
                    if (environmentCtrl.summaryData.processedEntities.processedentities != null){
                        environmentCtrl.summaryData.processedEntities.processedentities = parseInt(environmentCtrl.summaryData.processedEntities.processedentities);
                    }
                    else{
                        environmentCtrl.summaryData.processedEntities.processedentities = 0;
                    }
                    environmentCtrl.taskExecutionsBarData = {
                        labels: ['Failed', 'Pending', 'Paused', 'Stopped', 'Running', 'Completed'],
                        datasets: [
                            {
                                label: "Exection status",
                                fillColor: "rgba(26,179,148,0.5)",
                                strokeColor: "rgba(26,179,148,0.8)",
                                highlightFill: "rgba(26,179,148,0.75)",
                                highlightStroke: "rgba(26,179,148,1)",
                                data: [environmentCtrl.summaryData.taskExecutionStatus.failed,
                                    environmentCtrl.summaryData.taskExecutionStatus.pending,
                                    environmentCtrl.summaryData.taskExecutionStatus.paused,
                                    environmentCtrl.summaryData.taskExecutionStatus.stopped,
                                    environmentCtrl.summaryData.taskExecutionStatus.running,
                                    environmentCtrl.summaryData.taskExecutionStatus.completed]
                            }
                        ]
                    };
                    environmentCtrl.loadingSummary = false;
                    environmentCtrl.activityPanel = 'Summary';
                }
                else{
                    //error
                    environmentCtrl.loadingSummary = false;
                    environmentCtrl.activityPanel = 'Summary';
                }
            });

        };

        environmentCtrl.getSummaryData();

        TDMService.getEnvTaskCount(environmentCtrl.environmentData.environment_id).then(function(response){
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.tasksCount = response.result;
            }
            else{
                environmentCtrl.tasksCount = true;
            }
        });

        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.dataCenters = response.result;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "failed to get data centers");
            }
        });

        TDMService.getEnvironmentOwners(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.environmentData.owners = response.result;

                if (userRole.type == 'admin') {
                    environmentCtrl.environmentData.isOwner = true;
                }
                else {
                    var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                    environmentCtrl.environmentData.isOwner = ownerFound ? true : false;
                }

                environmentCtrl.disableChange = (environmentCtrl.environmentData.environment_status === 'Inactive' || !environmentCtrl.environmentData.isOwner);
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get owners : " + response.message);
                environmentCtrl.environmentData.owners = [];
            }
        });

        TDMService.getOwners().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.allOwners = response.result;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get owners: " + response.message);
                environmentCtrl.allOwners = [];
            }
        });

        environmentCtrl.saveChanges = function () {
            TDMService.updateEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "Updated Successfully");
                    $scope.content.openEnvironments();
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to Update : " + response.message);
                }
            });
        };

        environmentCtrl.deleteEnvironment = function () {
            if (environmentCtrl.tasksCount == true){
                SweetAlert.swal({
                        title: "Environment will be deleted from all releated tasks. Are you sure?" ,
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
                            TDMService.deleteEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "deleted Successfully");
                                    $timeout(function () {
                                        $scope.content.openEnvironments();
                                    }, 400)
                                }
                                else {
                                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to delete");
                                }
                            });
                        }
                    });
            }
            else{
                TDMService.deleteEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "deleted Successfully");
                        $timeout(function () {
                            $scope.content.openEnvironments();
                        }, 400)
                    }
                    else {
                        toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to delete");
                    }
                });
            }
        };

        BreadCrumbsService.breadCrumbChange(1);
        BreadCrumbsService.push({environmentID: environmentCtrl.environmentData.environment_name}, 'ENVIRONMENT_BREADCRUMB', function () {
            $scope.content.openEnvironment(environmentCtrl.environmentData);
        });

        environmentCtrl.openRolesManagement = function () {
            $scope.content.openRoles(environmentCtrl.environmentData);
        };

        environmentCtrl.openProducts = function () {
            $scope.content.openProducts(environmentCtrl.environmentData);
        };

        environmentCtrl.loadingTableRoles = true;
        TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                //TODO SUCCESS

                environmentCtrl.roles =_.sortBy(response.result, function(value) {
                    return new Date(value.role_creation_date);
                });
                environmentCtrl.roles.reverse();
                environmentCtrl.dtInstanceRoles = {};
                environmentCtrl.dtColumnsRoles = [];
                environmentCtrl.dtColumnDefsRoles = [];
                environmentCtrl.headersRoles = [
                    {
                        column: 'role_name',
                        name: 'Name',
                        clickAble: true
                    },
                    {
                        column: 'role_description',
                        name: 'Description',
                        clickAble: false
                    },
                    {
                        column: 'role_creation_date',
                        name: 'Creation Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'role_created_by',
                        name: 'Created By',
                        clickAble: false
                    },
                    {
                        column: 'role_last_updated_date',
                        name: 'Last Update Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'role_last_updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                    {
                        column: 'role_status',
                        name: 'Status',
                        clickAble: false
                    }
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    return '<a ng-click="environmentCtrl.openRole(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    return moment(data).format('D MMM YYYY, HH:mm')
                };


                for (var i = 0; i < environmentCtrl.headersRoles.length; i++) {
                    if (environmentCtrl.headersRoles[i].clickAble == true) {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersRoles[i].type == 'date') {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name));
                    }
                }

                var getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.roles);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsRoles = DTOptionsBuilder.fromFnPromise(function () {
                        return getTableData();
                    })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [6, 'asc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false)
                    .withOption("caseInsensitive",true)
                    .withOption('search',{
                        "caseInsensitive": false
                    });

                environmentCtrl.dtInstanceCallbackRoles = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceRoles)) {
                        environmentCtrl.dtInstanceRoles(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceRoles)) {
                        environmentCtrl.dtInstanceRoles = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceRoles.changeData != null)
                    environmentCtrl.dtInstanceRoles.changeData(getTableData());

                environmentCtrl.loadingTableRoles = false;
            }
            else {
                //TODO ERROR
            }
        });


        TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {

                environmentCtrl.products =_.sortBy(response.result, function(value) {
                    return new Date(value.creation_date);
                });
                environmentCtrl.products.reverse();
                environmentCtrl.dtInstanceProducts = {};
                environmentCtrl.dtColumnsProducts = [];
                environmentCtrl.dtColumnDefsProducts = [];
                environmentCtrl.headersProducts = [
                    {
                        column: 'product_name',
                        name: 'Name',
                        clickAble: true
                    },
                    {
                        column: 'data_center_name',
                        name: 'Data Center',
                        clickAble: false
                    },
                    {
                        column: 'product_version',
                        name: 'Version',
                        clickAble: false
                    },
                    {
                        column: 'created_by',
                        name: 'Created By',
                        clickAble: false
                    },
                    {
                        column: 'creation_date',
                        name: 'Creation Date',
                        clickAble: false,
                        type : 'date'
                    },
                    {
                        column: 'last_updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                    {
                        column: 'last_updated_date',
                        name: 'Update Date',
                        clickAble: false,
                        type : 'date'
                    },
                    {
                        column: 'status',
                        name: 'Status',
                        clickAble: false
                    }
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    return '<a ng-click="environmentCtrl.openProduct(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function(data, type, full, meta){
                    if (data)
                        return moment(data).format('D MMM YYYY, HH:mm');
                    return '';
                };

                for (var i = 0; i < environmentCtrl.headersProducts.length; i++) {
                    if (environmentCtrl.headersProducts[i].clickAble == true) {
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersProducts[i].type == 'date'){
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name));
                    }
                }

                var getTableDataProducts = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.products);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsProducts = DTOptionsBuilder.fromFnPromise(function () {
                        return getTableDataProducts();
                    })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [7, 'asc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false);

                environmentCtrl.dtInstanceCallbackProducts = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceProducts)) {
                        environmentCtrl.dtInstanceProducts(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceProducts)) {
                        environmentCtrl.dtInstanceProducts = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceProducts.changeData != null)
                    environmentCtrl.dtInstanceProducts.changeData(getTableDataProducts());

                environmentCtrl.loadingTableProducts = false;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get products");
            }
        });

        TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.allTesters = response.result;
            }
            else {
                environmentCtrl.hideUsersInput = true;
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
            }
        });

        environmentCtrl.openRole = function(index){
            environmentCtrl.roleData = environmentCtrl.roles[index];
            environmentCtrl.disableChangeRole = (environmentCtrl.disableChange ||
            (environmentCtrl.roleData.role_status == 'Inactive' || !AuthService.authorizedToEdit(1) || !environmentCtrl.environmentData.isOwner));
            TDMService.getEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.roleData.role_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.testers = response.result;
                    if (!environmentCtrl.allTesters){
                        environmentCtrl.allTesters = [];
                    }
                    environmentCtrl.allTestersRole = environmentCtrl.allTesters.concat(environmentCtrl.testers);
                }
                else {
                    environmentCtrl.hideUsersInput = true;
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to get Role Users : " + response.message);
                }
            });
            environmentCtrl.activityPanel = 'empty';
            $timeout(function(){
                environmentCtrl.activityPanel = 'Role';
            },200);
        };



        environmentCtrl.deleteRole = function(){
            TDMService.deleteEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData.role_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "deleted Successfully");
                    environmentCtrl.roleData.role_status = 'Inactive';
                    environmentCtrl.dtInstanceRoles.reloadData(function(data){}, true);
                    TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.allTesters = response.result;
                        }
                        else {
                            environmentCtrl.hideUsersInput = true;
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to delete");
                }
            });
        };

        environmentCtrl.saveRoleChanges = function(){
            TDMService.postEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData.role_name, environmentCtrl.testers).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role Users # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.allTesters = response.result;
                        }
                        else {
                            environmentCtrl.hideUsersInput = true;
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role Users # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });

            TDMService.updateEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.roles = response.result;
                            environmentCtrl.dtInstanceRoles.reloadData(function(data){}, true);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });
        };

        environmentCtrl.openNewRole = function(){
            environmentCtrl.roleData = {
                allowed_creation_of_synthetic_data: false,
                allowed_delete_before_load: false,
                allowed_random_entity_selection: false,
                allowed_request_of_fresh_data: false,
                allowed_task_scheduling: false,
                allowed_replace_sequences: false,
                allowed_refresh_reference_data: false,
                allowed_number_of_entities_to_copy: 0,
                role_description: "",
                role_name: ""
            };
            environmentCtrl.activityPanel = 'newRole';
            environmentCtrl.testers = [];
            if (!environmentCtrl.allTesters){
                environmentCtrl.allTesters = [];
            }
        };

        environmentCtrl.addNewRole = function(){
            if (_.find(environmentCtrl.roles, {role_name: environmentCtrl.roleData.role_name,role_status : 'Active'})) {
                return toastr.error("Role # " + environmentCtrl.roleData.role_name + " Already Exists");
            }
            TDMService.postEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.roles = response.result;
                            environmentCtrl.dtInstanceRoles.reloadData(function(data){}, true);
                        }
                    });
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "Created Successfully");
                    environmentCtrl.getSummaryData();
                    TDMService.postEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                        response.result.id, environmentCtrl.roleData.role_name, environmentCtrl.testers).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Role Users # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                            TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    environmentCtrl.allTesters = response.result;
                                }
                                else {
                                    environmentCtrl.hideUsersInput = true;
                                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                                }
                            });
                        }
                        else {
                            toastr.error("Role Users # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "Unable to Create : " + response.message);
                }
            });
        };


        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.dataCenters = _.filter(response.result,function(dc){
                    if (dc.data_center_status == 'Active'){
                        return true;
                    }
                    return false;
                });
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "Failed to get data centers");
            }
        });


        var dbTypes = TDMService.getDBTypes();


        environmentCtrl.openProduct = function(index){
            environmentCtrl.productData = environmentCtrl.products[index];
            TDMService.getProductInterfaces(environmentCtrl.productData.product_id).then(function(response){
                if (response.errorCode == "SUCCESS"){
                    if (environmentCtrl.productData.status == 'Active') {
                        for (var i = 0; i < response.result.length; i++) {
                            if (response.result[i].interface_status == 'Active' && !_.find(environmentCtrl.productData.interfaces, {interface_id: response.result[i].interface_id})) {
                                response.result[i].status = false;
                                environmentCtrl.productData.interfaces.push(response.result[i]);
                            }
                        }
                    }
                }
                _.each(environmentCtrl.productData.interfaces, function (interface) {
                    var db_type = _.find(dbTypes, {db_type_id: interface.interface_type_id});
                    interface.interface_type_name = db_type.db_type_name;
                    interface.status = (interface.db_connection_string != null || interface.db_host != null);
                    interface.update = true;
                });
            });
            environmentCtrl.disableChangeProduct = (environmentCtrl.disableChange ||
            (environmentCtrl.productData.status == 'Inactive' || !AuthService.authorizedToEdit(1) || !environmentCtrl.environmentData.isOwner));
            environmentCtrl.activityPanel = 'empty';
            $timeout(function(){
                environmentCtrl.activityPanel = 'Product';
            },200);
        };


        environmentCtrl.deleteProduct = function(){
            TDMService.deleteEnvProduct(environmentCtrl.environmentData.environment_id,environmentCtrl.environmentData.environment_name,
                environmentCtrl.productData.product_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_name, "deleted Successfully");
                    environmentCtrl.productData.status = 'Inactive';
                    environmentCtrl.dtInstanceProducts.reloadData(function(data){}, true);
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Product # " + environmentCtrl.productData.product_name, "failed to delete");
                }
            });
        };

        environmentCtrl.saveProductChanges = function(){

            /*environmentCtrl.productData.interfaces = _.filter(environmentCtrl.productData.interfaces,function(interface){
                return (interface.env_product_interface_status == 'Active');
            });*/
            TDMService.putEnvProduct(environmentCtrl.environmentData.environment_id,environmentCtrl.environmentData.environment_name, environmentCtrl.productData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_name, "Updated Successfully");
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.products = response.result;
                            environmentCtrl.dtInstanceProducts.reloadData(function(data){}, true);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Product # " + environmentCtrl.productData.product_name, "failed to update");
                }
            });
        };


        environmentCtrl.openEnvProductInterfaceEdit = function(db_interface_id){
            var interfaceIndex = _.findIndex(environmentCtrl.productData.interfaces,{interface_id : db_interface_id});
            if (interfaceIndex < 0){
                return;
            }

            var dbInterfaceModalInstance = $uibModal.open({

                templateUrl: 'views/environments/environmentProductInterfaceModal.html',
                resolve : {
                    dbInterface : environmentCtrl.productData.interfaces[interfaceIndex],
                    disableChange : environmentCtrl.disableChangeProduct || environmentCtrl.productData.interfaces[interfaceIndex].env_product_interface_status == 'Inactive'
                },
                controller: function ($scope, $uibModalInstance,dbInterface,disableChange) {
                    var dbInterfaceCtrl = this;
                    dbInterfaceCtrl.dbInterfaceData = dbInterface;
                    dbInterfaceCtrl.interfaceType = "1";
                    if (dbInterfaceCtrl.dbInterfaceData.db_connection_string != null){
                        dbInterfaceCtrl.interfaceType = "0"
                    }
                    dbInterfaceCtrl.disableChange = disableChange;
                    dbInterfaceCtrl.saveDBInterface = function(){
                        if (dbInterfaceCtrl.interfaceType == "1"){
                            dbInterfaceCtrl.dbInterfaceData.db_connection_string = null;
                        }
                        else {
                            dbInterfaceCtrl.dbInterfaceData.db_host = null;
                            dbInterfaceCtrl.dbInterfaceData.db_port = null;
                            dbInterfaceCtrl.dbInterfaceData.db_schema = null;
                        }
                        if (dbInterfaceCtrl.dbInterfaceData.status == false){
                            dbInterfaceCtrl.dbInterfaceData.newInterface = true;
                        }
                        dbInterfaceCtrl.dbInterfaceData.status = true;
                        $uibModalInstance.close(dbInterfaceCtrl.dbInterfaceData);
                    };

                    dbInterfaceCtrl.close = function (){
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'dbInterfaceCtrl'
            });
        };

        environmentCtrl.openNewProduct = function(){
            environmentCtrl.disableChangeProduct = false;
            TDMService.getProductsWithLUs().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    var allProducts = response.result;
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        var envProducts = response.result;
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.newEnvProducts = _.reject(allProducts, function (product) {
                                for (var i = 0; i < envProducts.length; i++) {
                                    if (envProducts[i].product_id === product.product_id && envProducts[i].status === 'Active') {
                                        return true;
                                    }
                                }
                                return false;
                            });
                        }
                        else {
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                        }
                    })
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                }
            });

            environmentCtrl.productData = {};
            environmentCtrl.activityPanel = 'newProduct';
        };

        environmentCtrl.productChanged = function(){
            if (environmentCtrl.productData.product_id) {
                var product = _.find(environmentCtrl.newEnvProducts,{product_id : environmentCtrl.productData.product_id});
                if (product){
                    environmentCtrl.productData.product_versions = product.product_versions;
                }
                environmentCtrl.productData.lus = parseInt(product.lus);
                TDMService.getProductInterfaces(environmentCtrl.productData.product_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        environmentCtrl.productData.interfaces = _.filter(response.result,function(interface){
                            if (interface.interface_status == 'Active'){
                                return true;
                            }
                            return false;
                        });
                        _.each(environmentCtrl.productData.interfaces, function (interface) {
                            var db_type = _.find(dbTypes, {db_type_id: interface.interface_type_id});
                            interface.interface_type_name = db_type.db_type_name;
                            interface.status = (interface.db_connection_string != null || interface.db_host != null);
                        });
                    }
                    else {
                        toastr.error("Product # " + environmentCtrl.productData.product_id, "failed to get interfaces");
                    }
                });
            }
        };

        environmentCtrl.addProduct = function(){
            if (environmentCtrl.addProductInProgress == true){
                return;
            }
            environmentCtrl.addProductInProgress = true;
            TDMService.postEnvProduct(environmentCtrl.environmentData.environment_id,environmentCtrl.environmentData.environment_name, environmentCtrl.productData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_id, "Created Successfully");
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.products = response.result;
                            environmentCtrl.dtInstanceProducts.reloadData(function(data){}, true);
                        }
                    });
                    environmentCtrl.addProductInProgress = false;
                    environmentCtrl.getSummaryData();
                }
                else {
                    environmentCtrl.addProductInProgress = false;
                    toastr.error("Product # " + environmentCtrl.productData.product_id, "Unable to Create : " + response.message);
                }
            });
        };

        environmentCtrl.openProductFullView = function(){
            environmentCtrl.productDataFullView = {
                product_id : environmentCtrl.productData.product_id,
                product_name : environmentCtrl.productData.product_name,
                product_status : environmentCtrl.productData.product_status,
                product_vendor : environmentCtrl.productData.product_vendor,
                product_versions : environmentCtrl.productData.product_versions,
                product_description : environmentCtrl.productData.product_description
            };
            $scope.content.openProduct(environmentCtrl.productDataFullView);
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'environmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('environmentDirective', environmentDirective);