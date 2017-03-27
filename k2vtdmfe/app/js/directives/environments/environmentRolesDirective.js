function environmentRolesDirective() {

    var template = "views/environments/roles/roles.html";

    var controller = function ($scope, $compile, TDMService, DTColumnBuilder, DTOptionsBuilder, $q, BreadCrumbsService) {
        var environmentRolesCtrl = this;

        environmentRolesCtrl.environmentID = $scope.content.environmentData.environment_id;

        environmentRolesCtrl.pageDisplay = 'rolesTable';

        environmentRolesCtrl.openRoles = function () {
            environmentRolesCtrl.rolesData = {
                openRole: environmentRolesCtrl.openRole,
                openNewRole: environmentRolesCtrl.openNewRole,
                environmentID: environmentRolesCtrl.environmentID,
                isOwner: $scope.content.environmentData.isOwner
            };
            environmentRolesCtrl.pageDisplay = 'rolesTable';
            BreadCrumbsService.breadCrumbChange(2);
        };

        environmentRolesCtrl.openRole = function (roleData) {
            environmentRolesCtrl.roleData = {
                roleData: roleData,
                environment_id: environmentRolesCtrl.environmentID,
                environment_name: $scope.content.environmentData.environment_name,
                openRoles: environmentRolesCtrl.openRoles,
                openRole: environmentRolesCtrl.openRole,
                isOwner: $scope.content.environmentData.isOwner
            };
            environmentRolesCtrl.pageDisplay = 'role';
        };

        environmentRolesCtrl.openNewRole = function (roles) {
            environmentRolesCtrl.newRoleData = {
                roles: roles,
                openRoles: environmentRolesCtrl.openRoles,
                environmentID: environmentRolesCtrl.environmentID,
                environmentName: $scope.content.environmentData.environment_name,
                isOwner: $scope.content.environmentData.isOwner
            };
            environmentRolesCtrl.pageDisplay = 'newRole';
        };

        BreadCrumbsService.push({}, 'ROLES', function () {
            environmentRolesCtrl.openRoles();
        });

        environmentRolesCtrl.openRoles();
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'rolesCtrl'
    };
}


function environmentNewRoleDirective() {

    var template = "views/environments/roles/newRole.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, $timeout) {
        var environmentNewRoleCtrl = this;
        environmentNewRoleCtrl.environmentID = $scope.content.environmentID;
        environmentNewRoleCtrl.roles = $scope.content.roles;
        environmentNewRoleCtrl.roleData = {
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

        environmentNewRoleCtrl.addRole = function () {
            if (_.find(environmentNewRoleCtrl.roles, {role_name: environmentNewRoleCtrl.roleData.role_name})) {
                return toastr.error("Role # " + environmentNewRoleCtrl.roleData.role_name + " Already Exists");
            }
            TDMService.postEnvironmentRole(environmentNewRoleCtrl.environmentID, $scope.content.environmentName, environmentNewRoleCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentNewRoleCtrl.roleData.role_name, "Created Successfully");
                    $timeout(function () {
                        $scope.content.openRoles();
                    }, 300);
                }
                else {
                    toastr.error("Role # " + environmentNewRoleCtrl.roleData.role_name, "Unable to Create : " + response.message);
                }
            });
        };


        BreadCrumbsService.push({}, 'NEW_ROLE', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'environmentNewRoleCtrl'
    };
}

function environmentRolesTableDirective() {

    var template = "views/environments/roles/rolesTable.html";

    var controller = function ($scope, $compile, TDMService, DTColumnBuilder, DTOptionsBuilder, $q, AuthService) {
        var rolesTableCtrl = this;
        rolesTableCtrl.environmentID = $scope.content.environmentID;
        rolesTableCtrl.disableChange = (!AuthService.authorizedToEdit(0) && (!AuthService.authorizedToEdit(1) || !$scope.content.isOwner));
        TDMService.getEnvironmentRoles(rolesTableCtrl.environmentID).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                //TODO SUCCESS
                rolesTableCtrl.roles = response.result;
                rolesTableCtrl.dtInstance = {};
                rolesTableCtrl.dtColumns = [];
                rolesTableCtrl.dtColumnDefs = [];
                rolesTableCtrl.headers = [
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
                    return '<a ng-click="rolesTableCtrl.openRole(' + full.role_id + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    return moment(data).format('D MMM YYYY, h:mm')
                };


                for (var i = 0; i < rolesTableCtrl.headers.length; i++) {
                    if (rolesTableCtrl.headers[i].clickAble == true) {
                        rolesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(rolesTableCtrl.headers[i].column).withTitle(rolesTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                    }
                    else if (rolesTableCtrl.headers[i].type == 'date') {
                        rolesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(rolesTableCtrl.headers[i].column).withTitle(rolesTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        rolesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(rolesTableCtrl.headers[i].column).withTitle(rolesTableCtrl.headers[i].name));
                    }
                }

                var getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(rolesTableCtrl.roles);
                    return deferred.promise;
                };

                rolesTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                    .withDOM('<"html5buttons"B>lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withButtons([]).withColumnFilter({
                        aoColumns: [
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            },
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            },
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            },
                            {
                                type: 'select',
                                bRegex: false,
                                values: _.unique(_.map(rolesTableCtrl.roles, 'role_created_by'))

                            },
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            },
                            {
                                type: 'select',
                                bRegex: false,
                                values: _.unique(_.map(rolesTableCtrl.roles, 'role_last_updated_by'))
                            }
                        ]
                    });

                rolesTableCtrl.dtInstanceCallback = function (dtInstance) {
                    if (angular.isFunction(rolesTableCtrl.dtInstance)) {
                        rolesTableCtrl.dtInstance(dtInstance);
                    } else if (angular.isDefined(rolesTableCtrl.dtInstance)) {
                        rolesTableCtrl.dtInstance = dtInstance;
                    }
                };
                if (rolesTableCtrl.dtInstance.changeData != null)
                    rolesTableCtrl.dtInstance.changeData(getTableData());

                rolesTableCtrl.loadingTable = false;
            }
            else {
                //TODO ERROR
            }
        });

        rolesTableCtrl.openRole = function (roleID) {
            if ($scope.content.openRole) {
                var roleData = _.find(rolesTableCtrl.roles, {role_id: roleID});
                if (roleData) {
                    $scope.content.openRole(roleData);
                    return;
                }
            }
            //TODO show error ??
        };

        rolesTableCtrl.openNewRole = function () {
            if ($scope.content.openNewRole) {
                $scope.content.openNewRole(rolesTableCtrl.roles);
                return;
            }
            //TODO show error ??
        }

    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'rolesTableCtrl'
    };
}

function environmentRoleDirective() {

    var template = "views/environments/roles/role.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, $timeout, toastr, SweetAlert, AuthService) {
        var environmentRoleCtrl = this;
        environmentRoleCtrl.roleData = $scope.content.roleData;
        environmentRoleCtrl.environment_id = $scope.content.environment_id;
        environmentRoleCtrl.disableChange = (environmentRoleCtrl.roleData.role_status == 'Inactive' || !AuthService.authorizedToEdit(1) || !$scope.content.isOwner);

        TDMService.getTesters(environmentRoleCtrl.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentRoleCtrl.allTesters = response.result;

                TDMService.getEnvironmentRoleTesters(environmentRoleCtrl.environment_id, environmentRoleCtrl.roleData.role_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        environmentRoleCtrl.testers = response.result;
                        environmentRoleCtrl.allTesters = environmentRoleCtrl.allTesters.concat(environmentRoleCtrl.testers);
                    }
                    else {
                        environmentRoleCtrl.hideUsersInput = true;
                        toastr.error("Role # " + environmentRoleCtrl.roleData.role_name, "failed to get Role Users : " + response.message);
                    }
                });
            }
            else {
                environmentRoleCtrl.hideUsersInput = true;
                toastr.error("Role # " + environmentRoleCtrl.roleData.role_name, "failed to get All Testers : " + response.message);
            }
        });

        environmentRoleCtrl.saveChanges = function () {
            TDMService.postEnvironmentRoleTesters(environmentRoleCtrl.environment_id, $scope.content.environment_name,
                environmentRoleCtrl.roleData.role_id, environmentRoleCtrl.roleData.role_name, environmentRoleCtrl.testers).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role Users # " + environmentRoleCtrl.roleData.role_name, "Updated Successfully");
                }
                else {
                    toastr.error("Role Users # " + environmentRoleCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });

            TDMService.updateEnvironmentRole(environmentRoleCtrl.environment_id, $scope.content.environment_name, environmentRoleCtrl.roleData.role_id, environmentRoleCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentRoleCtrl.roleData.role_name, "Updated Successfully");
                }
                else {
                    toastr.error("Role # " + environmentRoleCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });
        };

        environmentRoleCtrl.deleteEnvironmentRole = function () {
            SweetAlert.swal({
                    title: "Are you sure you want to remove Role " + environmentRoleCtrl.roleData.role_name,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    cancelButtonText: "No",
                    closeOnConfirm: true,
                    closeOnCancel: true,
                    animation: "false",
                    customClass: "animated fadeInUp"
                },
                function (isConfirm) {
                    if (isConfirm) {
                        TDMService.deleteEnvironmentRole(environmentRoleCtrl.environment_id, $scope.content.environment_name, environmentRoleCtrl.roleData.role_id, environmentRoleCtrl.roleData.role_name).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                toastr.success("Role # " + environmentRoleCtrl.roleData.role_name, "deleted Successfully");
                                $timeout(function () {
                                    $scope.content.openRoles();
                                }, 400)
                            }
                            else {
                                toastr.error("Role # " + environmentRoleCtrl.roleData.role_name, "failed to delete");
                            }
                        });
                    }
                });
        };

        BreadCrumbsService.push({role_name: environmentRoleCtrl.roleData.role_name}, 'ROLE_BREADCRUMB', function () {
            $scope.content.openRole(environmentRoleCtrl.roleData);
        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'environmentRoleCtrl'
    };
}

angular
    .module('TDM-FE')
    .directive('environmentRolesDirective', environmentRolesDirective)
    .directive('environmentRolesTableDirective', environmentRolesTableDirective)
    .directive('environmentNewRoleDirective', environmentNewRoleDirective)
    .directive('environmentRoleDirective', environmentRoleDirective);