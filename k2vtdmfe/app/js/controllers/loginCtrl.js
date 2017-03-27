function LoginCtrl ($rootScope,$state,AuthService,AUTH_EVENTS,FE_VERSION,$sessionStorage){
    var loginCtrl = this;

    loginCtrl.version = FE_VERSION.version;
    loginCtrl.currentYear =  new Date().getFullYear();
    loginCtrl.init = function(){
        AuthService.clearSession();
    };

    $sessionStorage.taskTableHideColumns = null;
    $sessionStorage.taskHistoryTableHideColumns = null;

    loginCtrl.login = function(){
        var request ={
            username : loginCtrl.username,
            password : loginCtrl.password
        };
        AuthService.login(request).then(function(response){
            if (response.errorCode == "SUCCESS"){
                // only if the login succeeded then go to main
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                $state.go('index.dashboard');
            }
            else {
                loginCtrl.errorMessage = response.message;
            }
        });
    };

    loginCtrl.init();
}

angular
    .module('TDM-FE')
    .controller('LoginCtrl' , LoginCtrl);