function newBusinessEntityDirective (){

    var template = "views/businessEntities/newBusinessEntity.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var newBusinessEntityCtrl = this;

        newBusinessEntityCtrl.businessEntityData = {};
        newBusinessEntityCtrl.businessEntities = $scope.content.businessEntities;


        newBusinessEntityCtrl.addBusinessEntity = function(){
            if (_.find(newBusinessEntityCtrl.businessEntities, {be_name: newBusinessEntityCtrl.businessEntityData.be_name,be_status : 'Active'})) {
                return  toastr.error("Business Entity # " + newBusinessEntityCtrl.businessEntityData.be_name + " Already Exists");
            }
            TDMService.createBusinessEntity(newBusinessEntityCtrl.businessEntityData).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Business Entity # " + newBusinessEntityCtrl.businessEntityData.be_name,"Created Successfully");
                    $timeout(function(){
                        $scope.content.openBusinessEntities();
                    },300);
                }
                else{
                    toastr.error("Business Entity # " + newBusinessEntityCtrl.businessEntityData.be_name,"Unable to Create : " + response.message);
                }
            });
        };

        BreadCrumbsService.push({},'NEW_BUSINESS_ENTITY',function(){

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'newBusinessEntityCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newBusinessEntityDirective', newBusinessEntityDirective);