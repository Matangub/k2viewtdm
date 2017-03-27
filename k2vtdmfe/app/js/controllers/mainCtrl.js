function MainCtrl($scope,$rootScope, $state, TDMService, BreadCrumbsService, $timeout, AuthService,FE_VERSION) {
    var mainCtrl = this;
    mainCtrl.helloText = 'Welcome To TDM';
    mainCtrl.descriptionText = '';

    mainCtrl.environmentID = null;
    mainCtrl.version = FE_VERSION.version;
    mainCtrl.currentYear =  new Date().getFullYear();
    mainCtrl.username = AuthService.getDisplayName();

    mainCtrl.showTooltip = false;

    mainCtrl.stateGo = function (state) {
        $state.go(state);
    };
    $rootScope.interval = 'Month';
    mainCtrl.changeInterval = function(){
        $scope.$broadcast('intervalChanged',{interval : mainCtrl.interval});
    };

    mainCtrl.refreshPage = function(){
        $scope.$broadcast('refreshPage',true);
    };

    mainCtrl.openEnvironments = function () {
        $timeout(function () {
            $state.go("index.environments");
        });
    };

    mainCtrl.openCreateProduct = function () {
        $timeout(function () {
            $state.go("index.newProduct");
        });
    };

    mainCtrl.openCreateDataCenter = function () {
        $timeout(function () {
            $state.go("index.newDataCenter");
        });
    };

    mainCtrl.openMain = function () {
        $state.go("index.dashboard")
    };

    mainCtrl.updateBreadCrumb = function (breadCrumb) {
        BreadCrumbsService.breadCrumbChange(breadCrumb.click);
        breadCrumb.callback(breadCrumb);
    };

    BreadCrumbsService.init();
    mainCtrl.BreadCrumbs = BreadCrumbsService.getAll();

    BreadCrumbsService.push({},'HOME',function(){
        mainCtrl.openMain()
    });

    TDMService.getSupportedDbTypes().then(function (response) {
        if (response.errorCode == "SUCCESS") {
            //TODO Success
            TDMService.saveDBTypes(response.result);
        }
        else {
            //TODO error message
        }
    });
}

angular
    .module('TDM-FE')
    .controller('MainCtrl', MainCtrl);