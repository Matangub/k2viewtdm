function businessEntitiesTableDirective(){

    var template = "views/businessEntities/businessEntitiesTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q) {
        var businessEntitiesTableCtrl = this;

        businessEntitiesTableCtrl.loadingTable = true;

        TDMService.getBusinessEntities().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }

            businessEntitiesTableCtrl.businessEntitiesData =_.sortBy(response.result, function(value) {
                return new Date(value.be_creation_date);
            });
            businessEntitiesTableCtrl.businessEntitiesData.reverse();
            businessEntitiesTableCtrl.dtInstance = {};
            businessEntitiesTableCtrl.dtColumns = [];
            businessEntitiesTableCtrl.dtColumnDefs = [];
            businessEntitiesTableCtrl.headers = [
                {
                    column : 'be_name',
                    name : 'Name',
                    clickAble : true
                },
                {
                    column : 'be_description',
                    name : 'Description',
                    clickAble : false
                },
                {
                    column : 'be_creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'be_created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'be_last_updated_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'be_last_updated_by',
                    name : 'Updated By',
                    clickAble : false
                },
                {
                    column : 'be_status',
                    name : 'Status',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="businessEntitiesTableCtrl.openBusinessEntity(' + full.be_id + ')">' + data + '</a>';
            };


            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };

            for (var i = 0; i <  businessEntitiesTableCtrl.headers.length ; i++) {
                if (businessEntitiesTableCtrl.headers[i].clickAble == true) {
                    businessEntitiesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntitiesTableCtrl.headers[i].column).withTitle(businessEntitiesTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (businessEntitiesTableCtrl.headers[i].type == 'date'){
                    businessEntitiesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntitiesTableCtrl.headers[i].column).withTitle(businessEntitiesTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    businessEntitiesTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntitiesTableCtrl.headers[i].column).withTitle(businessEntitiesTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(businessEntitiesTableCtrl.businessEntitiesData);
                return deferred.promise;
            };

            businessEntitiesTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('aaSorting', [6, 'asc'])
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
                        3 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(businessEntitiesTableCtrl.businessEntitiesData, 'be_created_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        4 : {
                            type: 'text'
                        },
                        5 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(businessEntitiesTableCtrl.businessEntitiesData, 'be_last_updated_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        6 : {
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

            businessEntitiesTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(businessEntitiesTableCtrl.dtInstance)) {
                    businessEntitiesTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(businessEntitiesTableCtrl.dtInstance)) {
                    businessEntitiesTableCtrl.dtInstance = dtInstance;
                }
            };
            if (businessEntitiesTableCtrl.dtInstance.changeData != null)
                businessEntitiesTableCtrl.dtInstance.changeData(getTableData());

            businessEntitiesTableCtrl.loadingTable = false;
        });


        businessEntitiesTableCtrl.openBusinessEntity = function(businessEntityId){
            if ($scope.content.openBusinessEntity) {
                var businessEntityData = _.find(businessEntitiesTableCtrl.businessEntitiesData, {be_id: businessEntityId});
                if (businessEntityData) {
                    $scope.content.openBusinessEntity(businessEntityData);
                    return;
                }
            }
            //TODO show error ??
        };

        businessEntitiesTableCtrl.openNewBusinessEntity = function(){
            if ($scope.content.openNewBusinessEntity) {
                $scope.content.openNewBusinessEntity(businessEntitiesTableCtrl.businessEntitiesData);
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
        controllerAs :'businessEntitiesTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('businessEntitiesTableDirective', businessEntitiesTableDirective);