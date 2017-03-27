function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider,$translateProvider,RestangularProvider,toastrConfig,BE_BASE_URL,USER_ROLES) {

    $urlRouterProvider.otherwise(function ($injector) {
        var $state = $injector.get("$state");
        $state.go("index.dashboard");
    });

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

        .state('index', {
            abstract: true,
            url: "/index",
            templateUrl: "views/common/content.html",
            resolve : {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['js/plugins/sweetalert/sweetalert.min.js', 'css/plugins/sweetalert/sweetalert.css']
                        },
                        {
                            name: 'oitozero.ngSweetAlert',
                            files: ['js/plugins/sweetalert/angular-sweetalert.min.js']
                        },
                        {
                            files: ['js/plugins/jasny/jasny-bootstrap.min.js']
                        },
                        {
                            insertBefore: '#loadBefore',
                            name: 'localytics.directives',
                            files: ['css/plugins/chosen/bootstrap-chosen.css','js/plugins/chosen/chosen.jquery.js','js/plugins/chosen/chosen.js']
                        },
                        {
                            serie: true,
                            files: ['js/plugins/dataTables/datatables.min.js', 'css/plugins/dataTables/datatables.min.css']
                        },
                        {
                            serie: true,
                            name: 'datatables',
                            files: ['js/plugins/dataTables/angular-datatables.min.js']
                        },
                        {
                            serie: true,
                            name: 'datatables.buttons',
                            files: ['js/plugins/dataTables/angular-datatables.buttons.min.js','js/plugins/dataTables/buttons.colvis.js']
                        },
                        {
                            serie: true,
                            name: 'datatables.light-columnfilter',
                            files: ['js/plugins/dataTables/dataTables.lightColumnFilter.min.js','js/plugins/dataTables/angular-datatables.light-columnfilter.min.js']
                        },
                        {
                            name: 'datePicker',
                            files: ['css/plugins/datapicker/angular-datapicker.css', 'js/plugins/datapicker/angular-datepicker.js', 'js/plugins/moment/moment.min.js']
                        },
                        {
                            files: ['css/plugins/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css']
                        }
                    ]);
                }
            }
        })
        .state('index.dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard/dashboard.html",
            data: { pageTitle: 'Dashboard' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            name: 'angles',
                            files: ['js/plugins/chartJs/angles.js', 'js/plugins/chartJs/Chart.min.js']
                        },
                        {
                            name: 'angular-peity',
                            files: ['js/plugins/peity/jquery.peity.min.js', 'js/plugins/peity/angular-peity.js']
                        },
                        {
                            serie: true,
                            name: 'angular-flot',
                            files: [ 'js/plugins/flot/jquery.flot.js', 'js/plugins/flot/jquery.flot.time.js', 'js/plugins/flot/jquery.flot.tooltip.min.js', 'js/plugins/flot/jquery.flot.spline.js', 'js/plugins/flot/jquery.flot.resize.js', 'js/plugins/flot/jquery.flot.pie.js', 'js/plugins/flot/curvedLines.js', 'js/plugins/flot/angular-flot.js', ]
                        },
                        {
                              serie: true,
                            files: ['css/plugins/c3/c3.min.css', 'js/plugins/d3/d3.min.js', 'js/plugins/c3/c3.min.js']
                        },
                        {
                            serie: true,
                            name: 'gridshore.c3js.chart',
                            files: ['js/plugins/c3/c3-angular.min.js']
                        }
                    ]);
                }
            }
        })
        .state('index.environments', {
            url: "/environments",
            templateUrl: "views/environments/environments.html",
            data: { pageTitle: 'Environments' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            name: 'angles',
                            files: ['js/plugins/chartJs/angles.js', 'js/plugins/chartJs/Chart.min.js']
                        }
                    ]);
                }
            }
        })
        .state('index.products', {
            url: "/products",
            templateUrl: "views/products/products.html",
            data: { pageTitle: 'Products' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                    ]);
                }
            }
        })
        .state('index.businessEntities', {
            url: "/businessEntities",
            templateUrl: "views/businessEntities/businessEntities.html",
            data: { pageTitle: 'Business Entities' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                    ]);
                }
            }
        })
        .state('index.tasks', {
            url: "/tasks",
            templateUrl: "views/tasks/tasks.html",
            data: { pageTitle: 'Tasks' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['css/plugins/steps/jquery.steps.css']
                        },
                        {
                            name: 'angular-cron-jobs',
                            files: ['js/plugins/angular-cron-jobs/dist/angular-cron-jobs.css', 'js/plugins/angular-cron-jobs/dist/angular-cron-jobs.js']
                        }
                    ]);
                }
            }
        })
        .state('index.dataCenters', {
            url: "/dataCenters",
            templateUrl: "views/dataCenters/dataCenters.html",
            data: { pageTitle: 'Data Centers' , authorizedRoles: [USER_ROLES.admin,USER_ROLES.user]},
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                    ]);
                }
            }
        })
        .state('login', {
            url: "/login",
            templateUrl: "views/login.html",
            data: { pageTitle: 'Login', specialClass: 'gray-bg' }
        });

    RestangularProvider.setResponseExtractor(function (response, operation) {
        //should we add cache support for better peroformance ??
        return response;
    });

    RestangularProvider.setBaseUrl(BE_BASE_URL.url);

    $translateProvider
        .useStaticFilesLoader({
            prefix: 'langs/',
            suffix: '.json'
        })
        .preferredLanguage('eng');

    angular.extend(toastrConfig, {
        allowHtml: false,
        closeButton: false,
        closeHtml: '<button>&times;</button>',
        extendedTimeOut: 1000,
        iconClasses: {
            error: 'toast-error',
            info: 'toast-info',
            success: 'toast-success',
            warning: 'toast-warning'
        },
        messageClass: 'toast-message',
        onHidden: null,
        onShown: null,
        onTap: null,
        progressBar: false,
        tapToDismiss: true,
        templates: {
            toast: 'directives/toast/toast.html',
            progressbar: 'directives/progressbar/progressbar.html'
        },
        timeOut: 5000,
        titleClass: 'toast-title',
        toastClass: 'toast'
    });

}

function AuthRoute($rootScope, AUTH_EVENTS, AuthService) {
    $rootScope.$on('$stateChangeStart', function (event, next,y) {
        $(".ColVis_collection").remove();
        $(".ColVis_collectionBackground").remove();
        var authorizedRoles = next.data.authorizedRoles;
        if (next.data.pageTitle !== "Login" && !AuthService.isAuthorized(authorizedRoles)) {
            event.preventDefault();
            $rootScope.$state.go('login');
            if (AuthService.isAuthenticated()) {
                // user is not allowed
                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
            } else {
                // user is not logged in
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            }
        }
    });
}


angular
    .module('TDM-FE')
    .config(config)
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push([
            '$injector',
            function ($injector) {
                return $injector.get('AuthInterceptor');
            }
        ]);
    })
    .factory('AuthInterceptor', function ($rootScope, $q,
                                          AUTH_EVENTS,SweetAlert) {
        return {
            responseError: function (response) {
                $rootScope.$broadcast({
                    401: AUTH_EVENTS.notAuthenticated,
                    403: AUTH_EVENTS.notAuthorized,
                    419: AUTH_EVENTS.sessionTimeout,
                    440: AUTH_EVENTS.sessionTimeout
                }[response.status], response);
                return $q.reject(response);
            }
        };
    })
    .run(function ($rootScope, $state, AUTH_EVENTS, AuthService) {
        $rootScope.$state = $state;
        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            $rootScope.$state.go('login');
        });
        AuthRoute($rootScope, AUTH_EVENTS, AuthService);
    });