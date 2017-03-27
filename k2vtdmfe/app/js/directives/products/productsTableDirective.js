function productsTableDirective(){

    var template = "views/products/productsTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q) {
        var productsTableCtrl = this;

        productsTableCtrl.loadingTable = true;

        TDMService.getProducts().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }
            productsTableCtrl.productsData =_.sortBy(response.result, function(value) {
                return new Date(value.product_creation_date);
            });
            productsTableCtrl.productsData.reverse();
            productsTableCtrl.dtInstance = {};
            productsTableCtrl.dtColumns = [];
            productsTableCtrl.dtColumnDefs = [];
            productsTableCtrl.headers = [
                {
                    column : 'product_name',
                    name : 'Name',
                    clickAble : true
                },
                {
                    column : 'product_vendor',
                    name : 'Product vendor',
                    clickAble : false
                },
                {
                    column : 'product_versions',
                    name : 'Product versions',
                    clickAble : false
                },
                {
                    column : 'product_creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'product_created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'product_last_updated_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'product_last_updated_by',
                    name : 'Updated By',
                    clickAble : false
                },
                {
                    column : 'product_status',
                    name : 'Status',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="productsTableCtrl.openProduct(' + full.product_id + ')">' + data + '</a>';
            };

            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };


            for (var i = 0; i <  productsTableCtrl.headers.length ; i++) {
                if (productsTableCtrl.headers[i].clickAble == true) {
                    productsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(productsTableCtrl.headers[i].column).withTitle(productsTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (productsTableCtrl.headers[i].type == 'date'){
                    productsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(productsTableCtrl.headers[i].column).withTitle(productsTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    productsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(productsTableCtrl.headers[i].column).withTitle(productsTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(productsTableCtrl.productsData);
                return deferred.promise;
            };

            productsTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [7, 'asc'])
                .withButtons([
                ])
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
                            type: 'text'
                        },
                        4 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(productsTableCtrl.productsData, 'product_created_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        5 : {
                            type: 'text'
                        },
                        6 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(productsTableCtrl.productsData, 'product_last_updated_by')),function(el){
                                return {value : el,label :el}
                            })
                        },
                        7 : {
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

            productsTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(productsTableCtrl.dtInstance)) {
                    productsTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(productsTableCtrl.dtInstance)) {
                    productsTableCtrl.dtInstance = dtInstance;
                }
            };
            if (productsTableCtrl.dtInstance.changeData != null)
                productsTableCtrl.dtInstance.changeData(getTableData());

            productsTableCtrl.loadingTable = false;
        });


        productsTableCtrl.openProduct = function(productID){
            if ($scope.content.openProduct) {
                var productData = _.find(productsTableCtrl.productsData, {product_id: productID});
                if (productData) {
                    $scope.content.openProduct(productData);
                    return;
                }
            }
            //TODO show error ??
        };

        productsTableCtrl.openNewProduct = function(){
            if ($scope.content.openNewProduct) {
                $scope.content.openNewProduct(productsTableCtrl.productsData);
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
        controllerAs :'productsTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('productsTableDirective', productsTableDirective);