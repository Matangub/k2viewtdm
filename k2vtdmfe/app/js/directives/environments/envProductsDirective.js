function environmentProductsDirective() {

    var template = "views/environments/products/products.html";

    var controller = function ($scope, $compile, TDMService, DTColumnBuilder, DTOptionsBuilder, $q, BreadCrumbsService) {
        var environmentProductsCtrl = this;

        environmentProductsCtrl.environmentID = $scope.content.environmentData.environment_id;

        environmentProductsCtrl.pageDisplay = 'productsTable';

        environmentProductsCtrl.openProducts = function () {
            environmentProductsCtrl.productsData = {
                openProduct: environmentProductsCtrl.openProduct,
                openNewProduct: environmentProductsCtrl.openNewProduct,
                environmentID: environmentProductsCtrl.environmentID,
                isOwner : $scope.content.environmentData.isOwner
            };
            environmentProductsCtrl.pageDisplay = 'productsTable';
            BreadCrumbsService.breadCrumbChange(2);
        };

        environmentProductsCtrl.openProduct = function (productData) {
            environmentProductsCtrl.productData = {
                productData: productData,
                environmentID: environmentProductsCtrl.environmentID,
                environmentName: $scope.content.environmentData.environment_name,
                openProducts: environmentProductsCtrl.openProducts,
                openProduct: environmentProductsCtrl.openProduct,
                isOwner : $scope.content.environmentData.isOwner
            };
            environmentProductsCtrl.pageDisplay = 'product';
        };

        environmentProductsCtrl.openNewProduct = function () {
            environmentProductsCtrl.newProductData = {
                openProducts: environmentProductsCtrl.openProducts,
                environmentID: environmentProductsCtrl.environmentID,
                environmentName: $scope.content.environmentData.environment_name,
                isOwner : $scope.content.environmentData.isOwner
            };
            environmentProductsCtrl.pageDisplay = 'newProduct';
        };

        BreadCrumbsService.push({}, 'PRODUCTS', function () {
            environmentProductsCtrl.openProducts();
        });

        environmentProductsCtrl.openProducts();
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'envProductsCtrl'
    };
}


function environmentNewProductDirective() {

    var template = "views/environments/products/newProduct.html";

    var controller = function ($scope,$compile, TDMService,SweetAlert, BreadCrumbsService, toastr, $timeout,DTColumnBuilder, DTOptionsBuilder, $q,$uibModal) {
        var environmentNewProductCtrl = this;
        environmentNewProductCtrl.environmentID = $scope.content.environmentID;

        TDMService.getProducts().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                var allProducts = response.result;
                TDMService.getEnvProducts(environmentNewProductCtrl.environmentID).then(function (response) {
                    var envProducts = response.result;
                    if (response.errorCode == "SUCCESS") {
                        environmentNewProductCtrl.newEnvProducts = _.reject(allProducts, function (product) {
                            if (product.product_status === 'Inactive') {
                                return true;
                            }
                            for (var i = 0; i < envProducts.length; i++) {
                                if (envProducts[i].product_id === product.product_id && envProducts[i].status === 'Active') {
                                    return true;
                                }
                            }
                            return false;
                        });
                    }
                    else {
                        toastr.error("Environment # " + environmentNewProductCtrl.environmentID, "Faild to get new products");
                    }
                })
            }
            else {
                toastr.error("Environment # " + environmentNewProductCtrl.environmentID, "Faild to get new products");
            }
        });

        environmentNewProductCtrl.addProduct = function () {
            var result = true;
            if (environmentNewProductCtrl.envProduct.interfaces) {
                for (var i = 0; i < environmentNewProductCtrl.envProduct.interfaces.length; i++) {
                    var dbInterfaceData = environmentNewProductCtrl.envProduct.interfaces[i];
                    if (!(dbInterfaceData.db_connection_string) && !(dbInterfaceData.db_schema && dbInterfaceData.db_port && dbInterfaceData.db_password && dbInterfaceData.db_host)) {
                        result = false;
                        break;
                    }
                }

                if (!result) {
                    SweetAlert.swal({
                        title: "Please Update All DB Interfaces Data"
                    });
                    return;
                }
            }
            TDMService.postEnvProduct(environmentNewProductCtrl.environmentID,$scope.content.environmentName, environmentNewProductCtrl.envProduct).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentNewProductCtrl.envProduct.product_id, "Created Successfully");
                    $timeout(function () {
                        $scope.content.openProducts();
                    }, 300);
                }
                else {
                    toastr.error("Product # " + environmentNewProductCtrl.envProduct.product_id, "Unable to Create : " + response.message);
                }
            });
        };

        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentNewProductCtrl.dataCenters = response.result;
            }
            else {
                toastr.error("Product # " + environmentNewProductCtrl.newEnvProduct.product_id, "failed to get data centers");
            }
        });

        environmentNewProductCtrl.productChanged = function () {
            if (environmentNewProductCtrl.envProduct.product_id) {
                TDMService.getProductInterfaces(environmentNewProductCtrl.envProduct.product_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        environmentNewProductCtrl.envProduct.interfaces = response.result;
                        var dbTypes = TDMService.getDBTypes();
                        _.each(environmentNewProductCtrl.envProduct.interfaces, function (interface) {
                            var db_type = _.find(dbTypes, {db_type_id: interface.interface_type_id});
                            interface.interface_type_name = db_type.db_type_name;
                        });
                        if (environmentNewProductCtrl.getTableData){
                            environmentNewProductCtrl.dtInstance.changeData(environmentNewProductCtrl.getTableData())
                        }
                        else {
                            environmentNewProductCtrl.DBInterfacesTable();
                        }
                    }
                    else {
                        toastr.error("Product # " + environmentNewProductCtrl.envProduct.product_id, "failed to get interfaces");
                    }
                });
                var product = _.find(environmentNewProductCtrl.newEnvProducts,{product_id: environmentNewProductCtrl.envProduct.product_id});
                if (product){
                    environmentNewProductCtrl.versions = product.product_versions.split(',');
                }
            }
        };

        environmentNewProductCtrl.DBInterfacesTable = function(){
            environmentNewProductCtrl.loadingTable = true;
            environmentNewProductCtrl.dtInstance = {};
            environmentNewProductCtrl.dtColumns = [];
            environmentNewProductCtrl.dtColumnDefs = [];
            environmentNewProductCtrl.headers = [
                {
                    column: 'interface_name',
                    name: 'Name',
                    clickAble: false
                },
                {
                    column: 'interface_type_name',
                    name: 'Interface Type',
                    clickAble: false
                },
                {
                    column: 'db_schema',
                    name: 'Schema',
                    clickAble: false
                },
                {
                    column : 'db_port',
                    name : 'Port',
                    clickAble : false
                },
                {
                    column : 'db_user',
                    name : 'User',
                    clickAble : false
                },
                {
                    column : 'db_password',
                    name : 'Password',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'db_host',
                    name : 'Host',
                    clickAble : false
                },
                {
                    column : 'db_connection_string',
                    name : 'Connection String',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'update_db_interface',
                    name : 'Update',
                    clickAble : true
                }
            ];

            var updateCell = function (data, type, full, meta) {
                return '<button class="btn btn-primary btn-circle" type="button" ng-click="envNewProductCtrl.openDBInterfaceModal(\'' + full.interface_id + '\')"><i class="fa fa-pencil"></i></button>';
            };

            for (var i = 0; i < environmentNewProductCtrl.headers.length; i++) {
                if (environmentNewProductCtrl.headers[i].column == 'update_db_interface'){
                    environmentNewProductCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentNewProductCtrl.headers[i].column).withTitle(environmentNewProductCtrl.headers[i].name).renderWith(updateCell).notSortable().withOption('defaultContent', ' '));
                }
                else {
                    environmentNewProductCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentNewProductCtrl.headers[i].column).withTitle(environmentNewProductCtrl.headers[i].name).withOption('defaultContent', ' '));
                }
            }

            environmentNewProductCtrl.getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(environmentNewProductCtrl.envProduct.interfaces);
                return deferred.promise;
            };

            environmentNewProductCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return environmentNewProductCtrl.getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withButtons([]);

            environmentNewProductCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(environmentNewProductCtrl.dtInstance)) {
                    environmentNewProductCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(environmentNewProductCtrl.dtInstance)) {
                    environmentNewProductCtrl.dtInstance = dtInstance;
                }
            };
            if (environmentNewProductCtrl.dtInstance.changeData != null)
                environmentNewProductCtrl.dtInstance.changeData(environmentNewProductCtrl.getTableData());

            environmentNewProductCtrl.loadingTable = false;


            environmentNewProductCtrl.openDBInterfaceModal = function(db_interface_id){

                var interfaceIndex = _.findIndex(environmentNewProductCtrl.envProduct.interfaces,{interface_id : db_interface_id});
                if (interfaceIndex < 0){
                    return;
                }

                var dbInterfaceModalInstance = $uibModal.open({

                    templateUrl: 'views/environments/products/dbInterfaceModal.html',
                    resolve : {
                        dbInterface : environmentNewProductCtrl.envProduct.interfaces[interfaceIndex]
                    },
                    controller: function ($scope, $uibModalInstance,dbInterface) {
                        var dbInterfaceCtrl = this;
                        dbInterfaceCtrl.dbInterfaceData = dbInterface;
                        dbInterfaceCtrl.connectionType = true;



                        dbInterfaceCtrl.saveDBInterface = function(){
                            $uibModalInstance.close(dbInterfaceCtrl.dbInterfaceData);
                        };

                        dbInterfaceCtrl.close = function (){
                            $uibModalInstance.close();
                        };
                    },
                    controllerAs: 'dbInterfaceCtrl'
                }).result.then(function (interfaceData) {
                    if (interfaceData) {
                        environmentNewProductCtrl.envProduct.interfaces[interfaceIndex] = interfaceData;
                        environmentNewProductCtrl.dtInstance.changeData(environmentNewProductCtrl.getTableData())
                    }
                });
            };
        };



        BreadCrumbsService.push({}, 'NEW_PRODUCT', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'envNewProductCtrl'
    };
}

function environmentProductsTableDirective() {

    var template = "views/environments/products/productsTable.html";

    var controller = function ($scope, $compile, TDMService, DTColumnBuilder, DTOptionsBuilder, $q,AuthService, toastr) {
        var productsTableCtrl = this;

        productsTableCtrl.environmentID = $scope.content.environmentID;
        productsTableCtrl.disableChange = (!AuthService.authorizedToEdit(1) || !$scope.content.isOwner);

        TDMService.getEnvProducts(productsTableCtrl.environmentID).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                productsTableCtrl.products = response.result;
                productsTableCtrl.dtInstance = {};
                productsTableCtrl.dtColumns = [];
                productsTableCtrl.dtColumnDefs = [];
                productsTableCtrl.headers = [
                    {
                        column: 'product_name',
                        name: 'Name',
                        clickAble: true
                    },
                    {
                        column: 'data_center_name',
                        name: 'Data Center Name',
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
                    return '<a ng-click="envProductsTableCtrl.openProduct(' + full.product_id + ')">' + data + '</a>';
                };

                var changeToLocalDate = function(data, type, full, meta){
                    if (data)
                        return moment(data).format('D MMM YYYY, h:mm');
                    return '';
                };

                for (var i = 0; i < productsTableCtrl.headers.length; i++) {
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
                    deferred.resolve(productsTableCtrl.products);
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
                    .withButtons([])
                    .withColumnFilter({
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
                                values: _.unique(_.map(productsTableCtrl.products, 'created_by'))
                            },
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            },
                            {
                                type: 'select',
                                bRegex: false,
                                values: _.unique(_.map(productsTableCtrl.products, 'last_updated_by'))
                            },
                            {
                                type: 'text',
                                bRegex: true,
                                bSmart: true
                            }
                        ]
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
            }
            else {
                toastr.error("Environment # " + productsTableCtrl.environmentID, "Faild to get products");
            }
        });

        productsTableCtrl.openProduct = function (productID) {
            if ($scope.content.openProduct) {
                var productData = _.find(productsTableCtrl.products, {product_id: productID});
                if (productData) {
                    $scope.content.openProduct(productData);
                    return;
                }
            }
            //TODO show error ??
        };

        productsTableCtrl.openNewProduct = function () {
            if ($scope.content.openNewProduct) {
                $scope.content.openNewProduct();
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
        controllerAs: 'envProductsTableCtrl'
    };
}

function environmentProductDirective() {

    var template = "views/environments/products/product.html";

    var controller = function ($scope, $compile,TDMService, BreadCrumbsService, $timeout, toastr, SweetAlert,AuthService,DTColumnBuilder, DTOptionsBuilder, $q,$uibModal) {
        var environmentProductCtrl = this;
        environmentProductCtrl.envProduct = $scope.content.productData;

        var dbTypes = TDMService.getDBTypes();
        _.each(environmentProductCtrl.envProduct.interfaces, function (interface) {
            var db_type = _.find(dbTypes, {db_type_id: interface.interface_type_id});
            interface.interface_type_name = db_type.db_type_name;
        });

        environmentProductCtrl.environmentID = $scope.content.environmentID;

        environmentProductCtrl.disableChange = (environmentProductCtrl.envProduct.status == 'Inactive' || !AuthService.authorizedToEdit(1) || !$scope.content.isOwner);

        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentProductCtrl.dataCenters = response.result;
            }
            else {
                toastr.error("Product # " + environmentProductCtrl.envProduct.product_name, "failed to get data centers");
            }
        });

        environmentProductCtrl.versions = environmentProductCtrl.envProduct.product_versions.split(',');

        environmentProductCtrl.updateEnvProduct = function () {
            TDMService.putEnvProduct(environmentProductCtrl.environmentID,$scope.content.environmentName, environmentProductCtrl.envProduct).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentProductCtrl.envProduct.product_name, "Updated Successfully");
                    $timeout(function () {
                        $scope.content.openProducts();
                    }, 400)
                }
                else {
                    toastr.error("Product # " + environmentProductCtrl.envProduct.product_name, "failed to update");
                }
            });
        };

        environmentProductCtrl.deleteEnvProduct = function () {
            SweetAlert.swal({
                    title: "Are you sure you want to remove Product " + environmentProductCtrl.envProduct.product_name ,
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
                        TDMService.deleteEnvProduct(environmentProductCtrl.environmentID,$scope.content.environmentName,
                            environmentProductCtrl.envProduct.product_id).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                toastr.success("Product # " + environmentProductCtrl.envProduct.product_name, "deleted Successfully");
                                $timeout(function () {
                                    $scope.content.openProducts();
                                }, 400)
                            }
                            else {
                                toastr.error("Product # " + environmentProductCtrl.envProduct.product_name, "failed to delete");
                            }
                        });
                    }
                });
        };

        environmentProductCtrl.DBInterfacesTable = function(){
            environmentProductCtrl.loadingTable = true;
            environmentProductCtrl.dtInstance = {};
            environmentProductCtrl.dtColumns = [];
            environmentProductCtrl.dtColumnDefs = [];
            environmentProductCtrl.headers = [
                {
                    column: 'interface_name',
                    name: 'Name',
                    clickAble: false
                },
                {
                    column: 'interface_type_name',
                    name: 'Interface Type',
                    clickAble: false
                },
                {
                    column: 'db_schema',
                    name: 'Schema',
                    clickAble: false
                },
                {
                    column : 'db_port',
                    name : 'Port',
                    clickAble : false
                },
                {
                    column : 'db_user',
                    name : 'User',
                    clickAble : false
                },
                {
                    column : 'db_password',
                    name : 'Password',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'db_host',
                    name : 'Host',
                    clickAble : false
                },
                {
                    column : 'db_connection_string',
                    name : 'Connection String',
                    clickAble : false,
                    type: 'date'
                }
            ];

            if (!environmentProductCtrl.disableChange){
                environmentProductCtrl.headers.push({
                    column : 'update_db_interface',
                    name : 'Update',
                    clickAble : true
                });
            }

            var updateCell = function (data, type, full, meta) {
                return '<button class="btn btn-primary btn-circle" type="button" ng-click="envProductCtrl.openDBInterfaceModal(\'' + full.interface_id + '\')"><i class="fa fa-pencil"></i></button>';
            };


            for (var i = 0; i < environmentProductCtrl.headers.length; i++) {
                if (environmentProductCtrl.headers[i].column == 'update_db_interface'){
                    environmentProductCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentProductCtrl.headers[i].column).withTitle(environmentProductCtrl.headers[i].name).renderWith(updateCell).notSortable());
                }
                else {
                    environmentProductCtrl.dtColumns.push(DTColumnBuilder.newColumn(environmentProductCtrl.headers[i].column).withTitle(environmentProductCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(environmentProductCtrl.envProduct.interfaces);
                return deferred.promise;
            };

            environmentProductCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withButtons([]);

            environmentProductCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(environmentProductCtrl.dtInstance)) {
                    environmentProductCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(environmentProductCtrl.dtInstance)) {
                    environmentProductCtrl.dtInstance = dtInstance;
                }
            };
            if (environmentProductCtrl.dtInstance.changeData != null)
                environmentProductCtrl.dtInstance.changeData(getTableData());

            environmentProductCtrl.loadingTable = false;


            environmentProductCtrl.openDBInterfaceModal = function(db_interface_id){

                var interfaceIndex = _.findIndex(environmentProductCtrl.envProduct.interfaces,{interface_id : db_interface_id});
                if (interfaceIndex < 0){
                    return;
                }

                var dbInterfaceModalInstance = $uibModal.open({

                    templateUrl: 'views/environments/products/dbInterfaceModal.html',
                    resolve : {
                        dbInterface : environmentProductCtrl.envProduct.interfaces[interfaceIndex]
                    },
                    controller: function ($scope, $uibModalInstance,dbInterface) {
                        var dbInterfaceCtrl = this;
                        dbInterfaceCtrl.dbInterfaceData = dbInterface;
                        dbInterfaceCtrl.connectionType = true;

                        dbInterfaceCtrl.saveDBInterface = function(){
                            $uibModalInstance.close(dbInterfaceCtrl.dbInterfaceData);
                        };

                        dbInterfaceCtrl.close = function (){
                            $uibModalInstance.close();
                        };
                    },
                    controllerAs: 'dbInterfaceCtrl'
                }).result.then(function (interface) {
                    if (interface) {
                        environmentProductCtrl.envProduct.interfaces[interfaceIndex] = interface;
                        environmentProductCtrl.dtInstance.changeData(getTableData())
                    }
                });
            };
        };


        BreadCrumbsService.push({productID: environmentProductCtrl.envProduct.product_name}, 'PRODUCT_BREADCRUMB', function () {
            $scope.content.openProduct(environmentProductCtrl.envProduct);
        });
        environmentProductCtrl.DBInterfacesTable();
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'envProductCtrl'
    };
}

angular
    .module('TDM-FE')
    .directive('environmentProductsDirective', environmentProductsDirective)
    .directive('environmentProductsTableDirective', environmentProductsTableDirective)
    .directive('environmentNewProductDirective', environmentNewProductDirective)
    .directive('environmentProductDirective', environmentProductDirective);