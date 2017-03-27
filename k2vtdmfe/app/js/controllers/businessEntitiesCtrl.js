function businessEntitiesCtrl ($scope,BreadCrumbsService){
    var businessEntitiesCtrl = this;
    businessEntitiesCtrl.pageDisplay = 'businessEntitiesTable';

    businessEntitiesCtrl.openBusinessEntities = function(){
        businessEntitiesCtrl.businessEntitiesData = {
            openBusinessEntity : businessEntitiesCtrl.openBusinessEntity,
            openNewBusinessEntity : businessEntitiesCtrl.openNewBusinessEntity
        };
        businessEntitiesCtrl.pageDisplay = 'businessEntitiesTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    businessEntitiesCtrl.openBusinessEntity = function(businessEntity){
        businessEntitiesCtrl.businessEntityData = {
            businessEntity : businessEntity,
            openBusinessEntities : businessEntitiesCtrl.openBusinessEntities

        };
        businessEntitiesCtrl.pageDisplay = 'businessEntity';
    };

    businessEntitiesCtrl.openNewBusinessEntity = function(businessEntities){
        businessEntitiesCtrl.newBusinessEntityData = {
            businessEntities: businessEntities,
            openBusinessEntities : businessEntitiesCtrl.openBusinessEntities
        };
        businessEntitiesCtrl.pageDisplay = 'newBusinessEntity';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'BUSINESS_ENTITIES',function(){
        businessEntitiesCtrl.openBusinessEntities();
    });

    businessEntitiesCtrl.businessEntitiesData = {
        openBusinessEntity : businessEntitiesCtrl.openBusinessEntity,
        openNewBusinessEntity : businessEntitiesCtrl.openNewBusinessEntity
    };
    businessEntitiesCtrl.pageDisplay = 'businessEntitiesTable';
}

angular
    .module('TDM-FE')
    .controller('businessEntitiesCtrl' , businessEntitiesCtrl);