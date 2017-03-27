function newEnvironmentDirective (){

    var template = "views/environments/newEnvironment.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var newEnvironmentCtrl = this;

        newEnvironmentCtrl.environmentData = {};
        newEnvironmentCtrl.environments = $scope.content.environments;

        newEnvironmentCtrl.addEnvironment = function(){
            if (_.find(newEnvironmentCtrl.environments, {environment_name: newEnvironmentCtrl.environmentData.environment_name,environment_status : 'Active'})) {
                return toastr.error("Environment # " + newEnvironmentCtrl.environmentData.environment_name + " Already Exists");
            }
            TDMService.addEnvironment(newEnvironmentCtrl.environmentData).then(function(response){
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Environment # " + newEnvironmentCtrl.environmentData.environment_name,"Created Successfully");
                        $timeout(function(){
                            $scope.content.openEnvironments();
                        },300);
                    }
                    else{
                        toastr.error("Environment # " + newEnvironmentCtrl.environmentData.environment_name,"Unable to Create : " + response.message);
                    }
            });
        };

        BreadCrumbsService.push({},'NEW_ENVIRONMENT',function(){

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'newEnvironmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newEnvironmentDirective', newEnvironmentDirective);