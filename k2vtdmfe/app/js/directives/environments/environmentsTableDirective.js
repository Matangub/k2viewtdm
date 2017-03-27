function environmentsTableDirective(){

    var template = "views/environments/environmentsTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q) {
        var environmentsTableCtrl = this;

        environmentsTableCtrl.loadingTable = true;

        TDMService.getEnvironments().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }

            environmentsTableCtrl.environmentsData =_.sortBy(response.result, function(value) {
                return new Date(value.environment_creation_date);
            });
            environmentsTableCtrl.environmentsData.reverse();
            environmentsTableCtrl.dtInstance = {};
            environmentsTableCtrl.dtColumns = [];
            environmentsTableCtrl.dtColumnDefs = [];
            environmentsTableCtrl.headers = [
                {
                    column : 'environment_name',
                    name : 'Name',
                    clickAble : true
                },
                {
                    column : 'environment_point_of_contact_first_name',
                    name : 'Contact First Name',
                    clickAble : false
                },
                {
                    column : 'environment_point_of_contact_last_name',
                    name : 'Contact Last Name',
                    clickAble : false
                },
                {
                    column : 'environment_point_of_contact_email',
                    name : 'Contact Email',
                    clickAble : false
                },
                {
                    column : 'owners',
                    name : 'Owners',
                    clickAble : false
                },
                {
                    column : 'environment_creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'environment_created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'environment_last_updated_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'environment_last_updated_by',
                    name : 'Updated By',
                    clickAble : false
                },
                {
                    column : 'environment_status',
                    name : 'Status',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="environmentsTableCtrl.openEnvironment(' + full.environment_id + ')">' + data + '</a>';
            };

            var changeToLocalDate = function(data, type, full, meta){
                if (data)
                    return moment(data).format('DD MMM YYYY, HH:mm');
                return '';
            };

            for (var i = 0; i <  environmentsTableCtrl.headers.length ; i++) {
                if (environmentsTableCtrl.headers[i].clickAble == true) {
                    environmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentsTableCtrl.headers[i].column).withTitle(environmentsTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (environmentsTableCtrl.headers[i].type == 'date'){
                    environmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentsTableCtrl.headers[i].column).withTitle(environmentsTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    environmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentsTableCtrl.headers[i].column).withTitle(environmentsTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(environmentsTableCtrl.environmentsData);
                return deferred.promise;
            };

            environmentsTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withOption('aaSorting', [9, 'asc'])
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
                            type: 'text'
                        },
                        3 :{
                            type: 'text'
                        },
                        4 : {
                            type: 'text'
                        },
                        5 : {
                            type: 'text'
                        },
                        6 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(environmentsTableCtrl.environmentsData, 'environment_created_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        7 : {
                            type: 'text'
                        },
                        8 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(environmentsTableCtrl.environmentsData, 'environment_last_updated_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        9 : {
                            type: 'select',
                            values: [
                                {
                                    value : "Inactive",
                                    label : "Inactive"
                                },
                                {
                                    value : "Active",
                                    label : "Active"
                                }
                            ]
                        }
                });

            environmentsTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(environmentsTableCtrl.dtInstance)) {
                    environmentsTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(environmentsTableCtrl.dtInstance)) {
                    environmentsTableCtrl.dtInstance = dtInstance;
                }
            };
            if (environmentsTableCtrl.dtInstance.changeData != null)
                environmentsTableCtrl.dtInstance.changeData(getTableData());

            environmentsTableCtrl.loadingTable = false;
        });


        environmentsTableCtrl.openEnvironment = function(environmentID){
            if ($scope.content.openEnvironment) {
                var environmentData = _.find(environmentsTableCtrl.environmentsData, {environment_id: environmentID});
                if (environmentData) {
                    $scope.content.openEnvironment(environmentData);
                    return;
                }
            }
            //TODO show error ??
        };

        environmentsTableCtrl.openNewEnvironment = function(){
            if ($scope.content.openNewEnvironment) {
                    $scope.content.openNewEnvironment(environmentsTableCtrl.environmentsData);
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
        controllerAs :'environmentsTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('environmentsTableDirective', environmentsTableDirective);