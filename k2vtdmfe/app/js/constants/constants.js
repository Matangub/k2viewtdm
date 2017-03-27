    angular
    .module('TDM-FE')
    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .constant('USER_ROLES', {
        admin : 0,
        user : 1
    })
    .constant('BE_BASE_URL', {
        url : 'https://k2vtdmbe.herokuapp.com/api'
        //url : 'http://163.172.176.227:3000/api'
        //url : 'http://localhost:3000/api'
    })
    .constant('FE_VERSION', {
        version : '2.4b'
    });