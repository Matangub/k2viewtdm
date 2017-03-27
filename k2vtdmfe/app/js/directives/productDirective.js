function productDirective (){

    var template = "views/product.html";

    var controller = function ($scope,TDMService,BreadCrumbsService) {
        var productCtrl = this;
        productCtrl.environmentID = $scope.content.environmentID;
        productCtrl.productID = $scope.content.productID;
        TDMService.getProduct(productCtrl.environmentID,productCtrl.productID).then(function(response){
            if (response.errorCode == "SUCCESS") {
                productCtrl.productData = response.result;
            }
            else{
                //TODO error message
            }
        });

        BreadCrumbsService.push({productID : $scope.content.productID},'PRODUCT_BREADCRUMB',function(){

        });

        productCtrl.saveChanges = function(){
            TDMService.updateProduct(productCtrl.environmentID,productCtrl.productID,productCtrl.productData).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    //TODO SUCCESS
                }
                else{
                    //TODO error message
                }
            });
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'productDirectiveCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('productDirective', productDirective);