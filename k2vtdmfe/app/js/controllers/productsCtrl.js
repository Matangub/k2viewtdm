function productsCtrl ($scope,BreadCrumbsService){
    var productsCtrl = this;
    productsCtrl.pageDisplay = 'productsTable';

    productsCtrl.openProducts = function(){
        productsCtrl.productsData = {
            openProduct : productsCtrl.openProduct,
            openNewProduct : productsCtrl.openNewProduct
        };
        productsCtrl.pageDisplay = 'productsTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    productsCtrl.openProduct = function(productData){
        BreadCrumbsService.breadCrumbChange(1);
        productsCtrl.productData = {
            productData : productData,
            openProducts : productsCtrl.openProducts
        };
        productsCtrl.pageDisplay = 'product';
    };

    productsCtrl.openNewProduct = function(productData){
        productsCtrl.newProductData = {
            openProduct : productsCtrl.openProduct,
            productData : productData
        };
        productsCtrl.pageDisplay = 'newProduct';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'PRODUCTS',function(){
        productsCtrl.openProducts();
    });

    productsCtrl.productsData = {
        openProduct : productsCtrl.openProduct,
        openNewProduct : productsCtrl.openNewProduct
    };
    productsCtrl.pageDisplay = 'productsTable';
}

angular
    .module('TDM-FE')
    .controller('productsCtrl' , productsCtrl);