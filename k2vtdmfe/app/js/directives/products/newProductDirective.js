function newProductDirective (){

    var template = "views/products/newProduct.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var newProductCtrl = this;

        newProductCtrl.productData = {
            product_versions : []
        };

        newProductCtrl.addProduct = function(){
            if (_.find($scope.content.productData, {product_name: newProductCtrl.productData.product_name,product_status : 'Active'})) {
                return toastr.error("Product # " + newProductCtrl.productData.product_name + " Already Exists");
            }
            newProductCtrl.productData.product_versions = newProductCtrl.productData.product_versions.join(',');
            TDMService.createProduct(newProductCtrl.productData).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + newProductCtrl.productData.product_name,"Created Successfully");
                    newProductCtrl.productData.product_id = response.result.id;
                    $timeout(function(){
                        $scope.content.openProduct(newProductCtrl.productData);
                    },300)
                }
                else{
                    toastr.error("Product # " + newProductCtrl.productData.product_name,"Unable to Create : " + response.message);
                }
            });
        };

        newProductCtrl.addVersion = function(newVersion){
            if (newVersion){
                if (!newProductCtrl.productData.product_versions){
                    newProductCtrl.productData.product_versions = [];
                }
                if (newProductCtrl.productData.product_versions.indexOf(newVersion) >= 0){
                    newProductCtrl.addVersionError = true;
                }
                else{
                    newProductCtrl.productData.product_versions.push(newVersion);
                    newProductCtrl.isOpen = false;
                }
            }
        };

        newProductCtrl.initAddVersionPopup = function(){
            newProductCtrl.addVersionError = false;
            newProductCtrl.versionToAdd = '';
            newProductCtrl.isOpen = true;
        };

        BreadCrumbsService.push({},'NEW_PRODUCT',function(){

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'newProductCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newProductDirective', newProductDirective);