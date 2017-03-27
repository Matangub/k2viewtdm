function productsDirective (){

    var template = "views/products.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder, DTOptionsBuilder, DTColumnDefBuilder, $q,BreadCrumbsService,$state) {
        var productsCtrl = this;

        productsCtrl.showPage = "products";
        productsCtrl.loadingTable = true;
        productsCtrl.environmentID = $scope.content;

        var buildProductsTable = function(products){

            productsCtrl.products = products;
            productsCtrl.dtInstance = {};
            productsCtrl.dtColumns = [];
            productsCtrl.dtColumnDefs = [];
            productsCtrl.headers = [
                {
                    column : 'product_id',
                    name : 'ID',
                    clickAble : true
                },
                {
                    column : 'product_description',
                    name : 'Description',
                    clickAble : false
                },
                {
                    column : 'product_name',
                    name : 'Name',
                    clickAble : false
                },
                {
                    column : 'product_vendor',
                    name : 'Vendor',
                    clickAble : false
                },
                {
                    column : 'product_version',
                    name : 'Version',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="productsDirectiveCtrl.rowClick(' + data + ')">' + data + '</a>';
            };

            for (var i = 0; i <  productsCtrl.headers.length ; i++) {
                if (productsCtrl.headers[i].clickAble == true) {
                    productsCtrl.dtColumns.push(DTColumnBuilder.newColumn(productsCtrl.headers[i].column).withTitle(productsCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else {
                    productsCtrl.dtColumns.push(DTColumnBuilder.newColumn(productsCtrl.headers[i].column).withTitle(productsCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(productsCtrl.products);
                return deferred.promise;
            };

            productsCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withButtons([
                ]);

            productsCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(productsCtrl.dtInstance)) {
                    productsCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(productsCtrl.dtInstance)) {
                    productsCtrl.dtInstance = dtInstance;
                }
            };
            if (productsCtrl.dtInstance.changeData != null)
                productsCtrl.dtInstance.changeData(getTableData());

            productsCtrl.rowClick = function(ID){
                productsCtrl.productData = {
                    environmentID : productsCtrl.environmentID,
                    productID : ID
                };
                productsCtrl.showPage = "product";
            };
            productsCtrl.loadingTable = false;
        };

        productsCtrl.openNewProduct = function(){
            productsCtrl.showPage = "new_product";
            productsCtrl.newProductData = {};
            BreadCrumbsService.push({},'NEW_PRODUCT',function(){
            });
        };

        productsCtrl.addProduct = function(){
            TDMService.addProduct(productsCtrl.environmentID,productsCtrl.newProductData).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    productsCtrl.showPage = "products";
                    productsCtrl.getProducts();
                    //TODO SUCCESS

                }
                else{
                    //TODO show error
                }
            });
        };

        productsCtrl.getProducts = function() {
            TDMService.getProducts(productsCtrl.environmentID).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    buildProductsTable(response.result);
                }
                else {
                    //TODO show error
                }
            });
        };

        productsCtrl.getProducts();

        BreadCrumbsService.breadCrumbChange(0);
        BreadCrumbsService.push({},'PRODUCTS',function(){
            productsCtrl.showPage = "products";
        });


    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'productsDirectiveCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('productsDirective', productsDirective);