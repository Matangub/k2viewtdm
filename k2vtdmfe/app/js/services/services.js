angular.module('TDM-FE')
    .service('Session', function () {
        this.create = function (userAuthenticated) {
            this.userAuthenticated = userAuthenticated;
        };
        this.destroy = function () {
            this.userAuthenticated = null;
        };
    });

angular.module('TDM-FE')


    .factory('TDMService', function (Restangular, $sessionStorage) {

        var getSupportedDbTypes = function () {
            return Restangular.all('supportedDbTypes').get('');
        };

        var saveDBTypes = function (DBTypes) {
            $sessionStorage.supportedDbTypes = DBTypes;
        };

        var getDBTypes = function () {
            return $sessionStorage.supportedDbTypes;
        };

        var getEnvironments = function () {
            return Restangular.all('environments').get('');
        };

        var getEnvironment = function (id) {
            return Restangular.one('environment', id).get('');
        };

        var getProducts = function () {
            return Restangular.all('products').get('');
        };

        var getProductsWithLUs = function () {
            return Restangular.all('productsWithLUs').get('');
        };

        var getProduct = function (productId) {
            return Restangular.one('product', productId).get('');
        };

        var updateEnvironment = function (environmentId, data) {
            return Restangular.one('environment', environmentId).customPUT(data);
        };

        var addEnvironment = function (data) {
            return Restangular.all('environment').post(data);
        };

        var deleteEnvironment = function (environmentID, environmentName) {
            return Restangular.one('environment', environmentID).one('envname', environmentName).customDELETE('');
        };

        var updateProduct = function (productId, data) {
            return Restangular.one('product', productId).customPUT(data);
        };

        var createProduct = function (data) {
            return Restangular.all('product').post(data);
        };

        var deleteProduct = function (productId) {
            return Restangular.one('product', productId).customDELETE('');
        };

        var createDataCenter = function (data) {
            return Restangular.all('datacenter').post(data);
        };

        var getDataCenters = function () {
            return Restangular.all('datacenters').get('');
        };

        var updateDataCenter = function (data_center_id, data) {
            return Restangular.one('datacenter', data_center_id).customPUT(data);
        };

        var deleteDataCenter = function (data_center_id) {
            return Restangular.one('datacenter', data_center_id).customDELETE('');
        };

        var getProductInterfaces = function (productId) {
            return Restangular.one('product', productId).all('interfaces').get('');
        };

        var postProductInterface = function (productId, productName, data) {
            return Restangular.one('product', productId).one('productname', productName).all('interface').post(data);
        };

        var putProductInterface = function (productId, productName, interface_id, data) {
            return Restangular.one('product', productId).one('productname', productName).one('interface', interface_id).customPUT(data);
        };

        var deleteProductInterface = function (productId, productName, interface_id, interface_name,interfacesCount,envCount) {
            return Restangular.one('product', productId).one('productname', productName).one('interface', interface_id).one('interfacename', interface_name)
                .one('interfacecount',interfacesCount).one('envcount',envCount).customDELETE('');
        };

        var getLogicalUnits = function (productId) {
            return Restangular.all('logicalunits').get('');
        };

        var getProductLogicalUnits = function (productId) {
            return Restangular.one('product', productId).all('logicalunits').get('');
        };

        var getBELogicalUnits = function (beId) {
            return Restangular.one('businessentity', beId).all('logicalunits').get('');
        };

        var getLogicalUnitsWithoutProduct = function (beId) {
            return Restangular.all('logicalunitswithoutproduct').get('');
        };

        var postLogicalUnit = function (beId, beName, data) {
            data.be_id = beId;
            return Restangular.one('businessentity', beId).one('bename', beName).all('logicalunit').post(data);
        };

        var putLogicalUnit = function (data) {
            return Restangular.one('businessentity', data.be_id).one('logicalunit', data.lu_id).customPUT(data);
        };

        var deleteLogicalUnit = function (beId, beName, luId, luName) {
            return Restangular.one('businessentity', beId).one('bename', beName).one('logicalunit', luId).one('luname', luName).customDELETE('');
        };

        var getBusinessEntities = function (productId, lu_name) {
            return Restangular.all('businessentities').get('');
        };

        var createBusinessEntity = function (data) {
            return Restangular.all('businessentity').post(data);
        };

        var updateBusinessEntity = function (beId, data) {
            return Restangular.one('businessentity', beId).customPUT(data);
        };

        var deleteBusinessEntity = function (beId, beName) {
            return Restangular.one('businessentity', beId).customDELETE('');
        };

        var getTasks = function () {
            return Restangular.all('tasks').get('');
        };

        var createTask = function (data) {
            return Restangular.all('task').post(data);
        };

        var updateTask = function (data) {
            return Restangular.one('task', data.task_id).customPUT(data);
        };

        var deleteTask = function (data) {
            return Restangular.one('task', data.task_id).one('taskname', data.task_title).customDELETE('');
        };

        var getEnvironmentRoles = function (environmentID) {
            return Restangular.one('environment', environmentID).all('roles').get('');
        };

        var postEnvironmentRole = function (environmentID, environmentName, data) {
            return Restangular.one('environment', environmentID).one('envname', environmentName).all('role').post(data);
        };

        var updateEnvironmentRole = function (environmentID, environmentName, roleID, data) {
            return Restangular.one('environment', environmentID).one('envname', environmentName).one('role', roleID).customPUT(data);
        };

        var deleteEnvironmentRole = function (environmentID, environmentName, roleID, roleName) {
            return Restangular.one('environment', environmentID).one('envname', environmentName).one('role', roleID).one('rolename', roleName).customDELETE('');
        };

        var getTesters = function (envId) {
            return Restangular.one('environment', envId).all('testers').get('');
        };

        var getOwners = function () {
            return Restangular.all('owners').get('');
        };

        var getProductsForBusinessEntityAndEnv = function (be_id, environment_id) {
            return Restangular.one('businessentity', be_id).one('environment', environment_id).all('products').get('');
        };

        var getTaskProducts = function (task_id) {
            return Restangular.one('task', task_id).all('products').get('');
        };

        var postTaskProducts = function (taskId, taskName, data) {
            return Restangular.one('task', taskId).one('taskname', taskName).all('products').post(data);
        };

        var getRoleForUserInEnv = function (envId) {
            return Restangular.one('environment', envId).all('userRole').get('');
        };

        var getEnvProducts = function (envId) {
            return Restangular.one('environment', envId).all('products').get('');
        };

        var postEnvProduct = function (envId, envName, data) {
            return Restangular.one('environment', envId).one('envname', envName).all('product').post(data);
        };

        var putEnvProduct = function (envId, envName, data) {
            return Restangular.one('environment', envId).one('envname', envName).all('product').customPUT(data);
        };

        var deleteEnvProduct = function (envId, envName, productId) {
            return Restangular.one('environment', envId).one('envname', envName).one('product', productId).customDELETE('');
        };

        var getEnvironmentRoleTesters = function (environmentID, roleID) {
            return Restangular.one('environment', environmentID).one('role', roleID).all('users').get('');
        };

        var postEnvironmentRoleTesters = function (environmentID, environmentName, roleID, roleName, data) {
            return Restangular.one('environment', environmentID).one('envname', environmentName).one('role', roleID).one('rolename', roleName).all('users').post(data);
        };

        var getEnvironmentOwners = function (environmentID) {
            return Restangular.one('environment', environmentID).all('owners').get('');
        };

        var getEnvironmentsForUser = function () {
            return Restangular.all('environmentsbyuser').get('');
        };

        var getBusinessEntityParameters = function (beID) {
            return Restangular.one('businessentity', beID).all('parameters').get('');
        };

        var getAnalysisCount = function (beID, data) {
            return Restangular.one('businessentity', beID).all('analysiscount').post(data);
        };

        var getTaskHistory = function (taskId) {
            return Restangular.one('task', taskId).all('history').get('');
        };

        var getActivities = function (interval) {
            return Restangular.one('activities',interval).get('');
        };

        var getNumOfTasksPerMonth = function () {
            return Restangular.all('numoftaskspermonth').get('');
        };

        var getNumOfCopiedEntitiesPerMonth = function () {
            return Restangular.all('numofcopiedentitiespermonth').get('');
        };

        var getNumOfTaskExecutionsPerMonth = function () {
            return Restangular.all('numoftaskexecutionspermonth').get('');
        };

        var getNumOfProcessedEntitiesPerEnv = function () {
            return Restangular.all('numofprocessedentitiesperenv').get('');
        };

        var getNumOfTasksPerEnv = function () {
            return Restangular.all('numoftasksperenv').get('');
        };

        var getBusinessEntitiesForEnvProducts = function (envId) {
            return Restangular.one('environment', envId).all('businessEntitiesForEnvProducts').get('');
        };

        var executeTask = function(taskID){
            return Restangular.one('task',taskID).all('startTask').get('');
        };

        var getProductEnvCount = function(productId){
            return Restangular.one('product',productId).all('envcount').get('');
        };

        var getEnvTaskCount = function(envId){
            return Restangular.one('environment', envId).all('taskCount').get('');
        };

        var getTasksStatus = function(interval){
            return Restangular.one('tasksStatus',interval).get('');
        };

        var getTasksExecutionsStatus = function(interval){
            return Restangular.one('tasksExecutionsStatus',interval).get('');
        };

        var getTasksPerBE = function(interval){
            return Restangular.one('tasksPerBE',interval).get('');
        };

        var getDataCenterEnvironmentCount = function(data_center_id){
            return Restangular.one('datacenter',data_center_id).all('envcount').get('');
        };

        var holdTask = function(task_id){
            return Restangular.one('task',task_id).all('holdTask').customPUT('');
        };
        var activateTask = function(task_id){
            return Restangular.one('task',task_id).all('activateTask').customPUT('');
        };

        var getBEProductCount = function(be_id){
            return Restangular.one('businessentity', be_id).all('productCount').get('');
        };

        var getEnvironmentSummary = function(envId){
            return Restangular.one('environment',envId).all('summary').all('Month').get('');
        };

        var getTaskMonitor = function(data){
            return Restangular.all('task').all('monitor').post(data);
        };

        var stopExecution = function(execution){
            return Restangular.all('taskexecution').all('stopexecution').post(execution);
        };

        var getTimeZone = function(){
            return Restangular.all('dbtimezone').get('');
        };

        var getNumProcessedCopiedFailedEntities = function(interval){
            return Restangular.one('numofprocessedcopiedfailedentities',interval).get('');
        };

        var getNumCopiedFailedEntitiesPerLU = function(interval){
            return Restangular.one('numofcopiedfailedentitiesperlu',interval).get('');
        };

        var deleteTaskForBE = function(be_id){
            return Restangular.one('businessentity', be_id).all('task').customDELETE('');
        };

        return {
            getSupportedDbTypes: getSupportedDbTypes,
            saveDBTypes: saveDBTypes,
            getDBTypes: getDBTypes,
            getEnvironments: getEnvironments,
            getEnvironment: getEnvironment,
            getProducts: getProducts,
            getProductsWithLUs : getProductsWithLUs,
            getProduct: getProduct,
            updateEnvironment: updateEnvironment,
            addEnvironment: addEnvironment,
            deleteEnvironment: deleteEnvironment,
            updateProduct: updateProduct,
            createProduct: createProduct,
            deleteProduct: deleteProduct,
            createDataCenter: createDataCenter,
            getDataCenters: getDataCenters,
            updateDataCenter: updateDataCenter,
            deleteDataCenter: deleteDataCenter,
            getProductInterfaces: getProductInterfaces,
            postProductInterface: postProductInterface,
            putProductInterface: putProductInterface,
            deleteProductInterface: deleteProductInterface,
            getLogicalUnits: getLogicalUnits,
            getProductLogicalUnits: getProductLogicalUnits,
            getBELogicalUnits: getBELogicalUnits,
            getLogicalUnitsWithoutProduct: getLogicalUnitsWithoutProduct,
            postLogicalUnit: postLogicalUnit,
            putLogicalUnit: putLogicalUnit,
            deleteLogicalUnit: deleteLogicalUnit,
            getBusinessEntities: getBusinessEntities,
            createBusinessEntity: createBusinessEntity,
            updateBusinessEntity: updateBusinessEntity,
            deleteBusinessEntity: deleteBusinessEntity,
            getTasks: getTasks,
            createTask: createTask,
            updateTask: updateTask,
            deleteTask: deleteTask,
            getEnvironmentRoles: getEnvironmentRoles,
            postEnvironmentRole: postEnvironmentRole,
            updateEnvironmentRole: updateEnvironmentRole,
            deleteEnvironmentRole: deleteEnvironmentRole,
            getTesters: getTesters,
            getOwners: getOwners,
            getEnvironmentRoleTesters: getEnvironmentRoleTesters,
            postEnvironmentRoleTesters: postEnvironmentRoleTesters,
            getProductsForBusinessEntityAndEnv: getProductsForBusinessEntityAndEnv,
            getTaskProducts: getTaskProducts,
            postTaskProducts: postTaskProducts,
            getRoleForUserInEnv: getRoleForUserInEnv,
            getEnvProducts: getEnvProducts,
            postEnvProduct: postEnvProduct,
            putEnvProduct: putEnvProduct,
            deleteEnvProduct: deleteEnvProduct,
            getEnvironmentOwners: getEnvironmentOwners,
            getEnvironmentsForUser: getEnvironmentsForUser,
            getBusinessEntityParameters: getBusinessEntityParameters,
            getAnalysisCount: getAnalysisCount,
            getTaskHistory: getTaskHistory,
            getActivities: getActivities,
            getNumOfTasksPerMonth: getNumOfTasksPerMonth,
            getNumOfCopiedEntitiesPerMonth: getNumOfCopiedEntitiesPerMonth,
            getNumOfTaskExecutionsPerMonth: getNumOfTaskExecutionsPerMonth,
            getNumOfProcessedEntitiesPerEnv: getNumOfProcessedEntitiesPerEnv,
            getNumOfTasksPerEnv: getNumOfTasksPerEnv,
            getBusinessEntitiesForEnvProducts: getBusinessEntitiesForEnvProducts,
            executeTask : executeTask,
            getProductEnvCount : getProductEnvCount,
            getEnvTaskCount : getEnvTaskCount,
            getTasksStatus : getTasksStatus,
            getTasksExecutionsStatus : getTasksExecutionsStatus,
            getTasksPerBE : getTasksPerBE,
            getDataCenterEnvironmentCount : getDataCenterEnvironmentCount,
            holdTask : holdTask,
            activateTask : activateTask,
            getBEProductCount : getBEProductCount,
            getEnvironmentSummary : getEnvironmentSummary,
            getTaskMonitor : getTaskMonitor,
            stopExecution : stopExecution,
            getTimeZone : getTimeZone,
            getNumProcessedCopiedFailedEntities : getNumProcessedCopiedFailedEntities,
            getNumCopiedFailedEntitiesPerLU : getNumCopiedFailedEntitiesPerLU,
            deleteTaskForBE : deleteTaskForBE
        }
    })

    .factory('AuthService', function (Restangular, $localStorage, $sessionStorage, $translate, USER_ROLES, Session) {
        var accessToken = {};
        var userAuth = $sessionStorage.userAuthenticated;
        if (userAuth) {
            Session.create(userAuth);
            accessToken = {"x-access-token": userAuth.accessToken};
            Restangular.setDefaultHeaders(accessToken);
        }

        var getDisplayName = function () {
            if (userAuth && userAuth.displayName)
                return userAuth.displayName;
            return "Unknown User";
        };

        var getUsername = function () {
            if (userAuth && userAuth.userName)
                return userAuth.userName;
            return "Unknown User";
        };

        var clearSession = function () {
            $sessionStorage.userAuthenticated = null;
            $sessionStorage.mainMenu = null;
            $sessionStorage.localLanguage = null;
            Restangular.setDefaultHeaders({});
            Session.destroy();
        };

        var login = function (credentials, callback) {
            return Restangular.all('login').post(credentials).then(function (res) {
                if (res.errorCode == "SUCCESS") {
                    var userAuthenticated = {
                        accessToken: res.result.token,
                        userName: credentials.username,
                        displayName : res.result.username,
                        userRole: res.result.role,
                        userID: res.result.user_id
                    };
                    Session.create(userAuthenticated);
                    accessToken = {"x-access-token": userAuthenticated.accessToken};
                    Restangular.setDefaultHeaders(accessToken);
                    $sessionStorage.userAuthenticated = userAuthenticated;
                    userAuth = userAuthenticated;
                }
                return res;
            });
        };

        var isAuthenticated = function () {
            if (Session && Session.userAuthenticated)
                return !!Session.userAuthenticated;
            return false;
        };

        var isAuthorized = function (authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (isAuthenticated() &&
            authorizedRoles.indexOf(USER_ROLES[Session.userAuthenticated.userRole.type]) !== -1);
        };

        var getRole = function () {
            return userAuth.userRole;
        };

        var getUserId = function () {
            return userAuth.userID;
        };

        var authorizedToEdit = function (role) {
            if (USER_ROLES[userAuth.userRole.type] <= role) {
                return true;
            }
        };

        return {
            login: login,
            isAuthenticated: isAuthenticated,
            isAuthorized: isAuthorized,
            clearSession: clearSession,
            getUsername: getUsername,
            getRole: getRole,
            authorizedToEdit: authorizedToEdit,
            getUserId: getUserId,
            getDisplayName : getDisplayName
        }
    })
    .factory('BreadCrumbsService', function () {
        var data = [];
        var currentID = 0;
        return {
            push: function (translationData, name, callback) {
                data.push({
                    click: currentID,
                    translationData: translationData,
                    name: name,
                    callback: callback
                });
                currentID++;
            },
            getAll: function () {
                return data;
            },
            init: function () {
                data = [];
                currentID = 0;
            },
            breadCrumbChange: function (click) {
                _.remove(data, function (n) {
                    if (n.click > click) {
                        currentID--;
                        return true;
                    }
                    return false;
                });
            }
        };
    });
