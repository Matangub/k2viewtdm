function taskDirective() {

    var template = "views/tasks/task.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, SweetAlert, $uibModal, toastr, $timeout, AuthService,$state) {
        var taskCtrl = this;
        taskCtrl.taskData = $scope.content.task;

        taskCtrl.step = 1;

        taskCtrl.advancedSchedule = false;

        taskCtrl.parametersRandom = true;

        var userRole = AuthService.getRole();
        var username = AuthService.getUsername();

        taskCtrl.entitiesPattern = new RegExp("^(\\d+(?:,\\d+){"+(taskCtrl.taskData.number_of_entities_to_copy - 1)+"})?$");
        taskCtrl.excultionPattern = new RegExp("^(\\d+(?:,\\d+){0,})?$");
        taskCtrl.syntheticPattern = /^[^,\s]+$/g;

        taskCtrl.updateEntitiesPattern = function(){
            if (taskCtrl.taskData.number_of_entities_to_copy){
                taskCtrl.entitiesPattern = new RegExp("^(\\d+(?:,\\d+){"+ (taskCtrl.taskData.number_of_entities_to_copy - 1) +"})?$")
            }
        };


        TDMService.getTimeZone().then(function(response){
            if (response.errorCode == "SUCCESS") {
                taskCtrl.timeZoneMessage = 'Task execution time will be based on '+ response.result.current_setting  + ' time zone'
            }
            else {
                taskCtrl.timeZoneMessage = 'Task execution time will be based on DB time zone'
            }
        });

        taskCtrl.disableChange = (taskCtrl.taskData.task_status == 'Inactive' || username != taskCtrl.taskData.task_created_by);

        if (taskCtrl.taskData.task_status == 'Active' && (taskCtrl.taskData.owners.indexOf(username) >= 0 || userRole.type == 'admin' )){
            taskCtrl.disableChange = false;
        }

        if (userRole.type == 'admin' || taskCtrl.disableChange){
            TDMService.getEnvironments().then(function(response){
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.allEnvironments = response.result;
                }
                else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Environments for user");
                }
            });
        }
        else {
            TDMService.getEnvironmentsForUser().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.allEnvironments = response.result;
                }
                else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Environments for user");
                }
            });
        }

        taskCtrl.environmentChange = function(init){
            if (userRole.type == 'admin' || taskCtrl.disableChange){
                taskCtrl.userRole = {};
                taskCtrl.userRole.allowed_random_entity_selection = true;
                taskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                taskCtrl.userRole.allowed_refresh_reference_data = true;
                taskCtrl.userRole.allowed_request_of_fresh_data = true;
                taskCtrl.userRole.allowed_delete_before_load = true;
                taskCtrl.userRole.allowed_task_scheduling = true;
                taskCtrl.userRole.allowed_replace_sequences = true;
                taskCtrl.userRole.maxToCopy = null;
                taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.taskData.number_of_entities_to_copy);
            }
            else {
                TDMService.getEnvironmentOwners(taskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                        if (ownerFound){
                            taskCtrl.userRole = {};
                            taskCtrl.userRole.allowed_random_entity_selection = true;
                            taskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                            taskCtrl.userRole.allowed_refresh_reference_data = true;
                            taskCtrl.userRole.allowed_request_of_fresh_data = true;
                            taskCtrl.userRole.allowed_delete_before_load = true;
                            taskCtrl.userRole.allowed_task_scheduling = true;
                            taskCtrl.userRole.allowed_replace_sequences = true;
                            taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.taskData.number_of_entities_to_copy);
                        }
                        else{
                            TDMService.getRoleForUserInEnv(taskCtrl.taskData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    taskCtrl.userRole = response.result[0];
                                    if (taskCtrl.userRole.allowed_number_of_entities_to_copy) {
                                        if (!init) {
                                            taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.userRole.allowed_number_of_entities_to_copy);
                                            taskCtrl.userRole.maxToCopy = taskCtrl.taskData.number_of_entities_to_copy;
                                        }
                                        else{
                                            taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.taskData.number_of_entities_to_copy);
                                            taskCtrl.userRole.maxToCopy = parseInt(taskCtrl.userRole.allowed_number_of_entities_to_copy);
                                        }
                                    }
                                }
                                else {
                                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Role for user ");
                                }
                            });
                        }
                    }
                    else {
                        toastr.error("Environment # " + taskCtrl.taskData.environment_id, "failed to get owners : " + response.message);
                    }
                });
            }

            TDMService.getBusinessEntitiesForEnvProducts(taskCtrl.taskData.environment_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.businessEntities = response.result;
                }
                else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Business Entities");
                }
            });

            if (!init) {
                taskCtrl.taskData.be_id = undefined;
                taskCtrl.products = [];
            }
        };

        taskCtrl.businessEntityChange = function(init){
            var be = _.find(taskCtrl.businessEntities,{be_id : taskCtrl.taskData.be_id});
            if (be){
                taskCtrl.taskData.be_name = be.be_name;
            }
            if (taskCtrl.taskData.environment_id && taskCtrl.taskData.be_id) {
                TDMService.getProductsForBusinessEntityAndEnv(taskCtrl.taskData.be_id, taskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.allProducts = response.result;
                        if (!init) {
                            taskCtrl.products = [];
                        }
                    }
                    else {
                        toastr.error("Business entity # " + taskCtrl.taskData.be_id, "Failed to get products");
                    }
                });

                TDMService.getBusinessEntityParameters(taskCtrl.taskData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.parameters = response.result;
                    }
                    else {
                        toastr.error("Business entity # " + taskCtrl.taskData.be_id, "Failed to get business entity parametes");
                    }
                })
            }
        };

        TDMService.getTaskProducts(taskCtrl.taskData.task_id).then(function(response){
            if (response.errorCode == "SUCCESS") {
                taskCtrl.products = response.result;
            }
            else {
                toastr.error("Products # " + taskCtrl.taskData.task_id, "Failed to get Task Products");
            }
        });

        taskCtrl.environmentChange(true);
        taskCtrl.businessEntityChange(true);

        taskCtrl.requestedEntities = {};

        if (taskCtrl.taskData.selection_method == 'L'){
            taskCtrl.selectFieldType = 'given';
            taskCtrl.requestedEntities.entities_list = taskCtrl.taskData.selection_param_value;
        }

        else if (taskCtrl.taskData.selection_method == 'R'){
            taskCtrl.selectFieldType = 'random';
        }

        else if (taskCtrl.taskData.selection_method == 'S'){
            taskCtrl.selectFieldType = 'synthetic';
            taskCtrl.requestedEntities.synthetic = taskCtrl.taskData.selection_param_value;
        }
        else{
            taskCtrl.selectFieldType = 'parameters';
            taskCtrl.filter = JSON.parse(taskCtrl.taskData.parameters);
            taskCtrl.requestedEntities.query_parameters = taskCtrl.taskData.selection_param_value;
            taskCtrl.requestedEntities.parameters = taskCtrl.taskData.parameters;
            if (taskCtrl.taskData.selection_method == 'PR'){
                taskCtrl.parametersRandom = true;
            }
            else{
                taskCtrl.parametersRandom = false;
            }
        }

        if (!taskCtrl.filter){
            var data = '{"group": {"operator": "AND","rules": []}}';
            taskCtrl.filter = JSON.parse(data);
        }

        if (taskCtrl.taskData.scheduler == 'immediate'){
            taskCtrl.selectSchedule = 'immediate';
        }
        else {
            taskCtrl.selectSchedule = 'schedule';
            taskCtrl.scheduleData = taskCtrl.taskData.scheduler;
        }


        taskCtrl.saveTask = function () {
            if (taskCtrl.selectFieldType == 'given') {
                if (taskCtrl.requestedEntities && taskCtrl.taskData.entity_exclusion_list == taskCtrl.requestedEntities.entities_list){
                    taskCtrl.errorList = true;
                    taskCtrl.step = 2;
                    taskCtrl.createTaskInProgress = false;
                    return;
                }
                taskCtrl.taskData.selection_method = 'L';
                taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.entities_list;
            }
            else if (taskCtrl.selectFieldType == 'random') {
                taskCtrl.taskData.selection_method = 'R';
                taskCtrl.taskData.selection_param_value = null;
            }
            else if (taskCtrl.selectFieldType == 'synthetic') {
                taskCtrl.taskData.selection_method = 'S';
                taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.synthetic;
            }
            else {
                if (!taskCtrl.requestedEntities.query_parameters || taskCtrl.requestedEntities.query_parameters == '()'){
                    taskCtrl.parametersError = true;
                    taskCtrl.step = 2;
                    return;
                }
                if (taskCtrl.parametersRandom == true){
                    taskCtrl.taskData.selection_method = 'PR';
                }
                else{
                    taskCtrl.taskData.selection_method = 'P';
                }
                taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.query_parameters;
                taskCtrl.taskData.parameters = taskCtrl.requestedEntities.parameters;
            }

            if (taskCtrl.selectSchedule == 'immediate'){
                taskCtrl.taskData.scheduler = taskCtrl.selectSchedule;
            }
            else{
                taskCtrl.taskData.scheduler = taskCtrl.scheduleData;
            }

            TDMService.updateTask(taskCtrl.taskData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                TDMService.postTaskProducts(response.result.id,taskCtrl.taskData.task_title, taskCtrl.products).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Task # " + taskCtrl.taskData.task_title, " Is Updated Successfully");
                        $timeout(function () {
                            $state.go('index.tasks', {}, {reload: true})
                        }, 300);
                    }
                    else {
                        toastr.error("Task # " + taskCtrl.taskData.task_id, " Failed to Update : " + response.message);
                    }
                });
            }
                else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, " Failed to Update : " + response.message);
                }
            });
        };

        taskCtrl.deleteTask = function () {
            TDMService.deleteTask(taskCtrl.taskData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Task # " + taskCtrl.taskData.task_id, "deleted Successfully");
                    $timeout(function () {
                        $scope.content.openTasks();
                    }, 400)
                }
                else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "failed to delete");
                }
            });
        };

        function computed(group) {
            if (!group) return "";
            for (var str = "(", i = 0; i < group.rules.length; i++) {
                if (group.rules[i].group){
                    if (i == group.rules.length - 1){
                        str +=  computed(group.rules[i].group);
                    }
                    else{
                        str +=  computed(group.rules[i].group) + " " +  group.rules[i].group.operator + " ";
                    }
                }
                else{
                    var data;
                    if (group.rules[i].type == 'real'){
                        if (group.rules[i].data.toLocaleString().indexOf('.') <= 0){
                            data = group.rules[i].data.toFixed(1);
                        }
                        else{
                            data = group.rules[i].data;
                        }
                    }
                    else if (group.rules[i].type == 'integer'){
                        data = Math.floor(group.rules[i].data);
                    }
                    else{
                        data = group.rules[i].data;
                    }
                    if (data == undefined){
                        data = '';
                    }
                    if (i == group.rules.length - 1){
                        str += "( \'" + data + "\' " +  group.rules[i].condition + " ANY("+ group.rules[i].field +") )";
                    }
                    else{
                        str += "( \'" + data + "\' " +  group.rules[i].condition + " ANY("+ group.rules[i].field +") ) "  +  group.rules[i].operator + " ";
                    }
                }
            }
            return str + ")";
        }

        taskCtrl.parametersCount = 0;

        $scope.$watch('taskCtrl.filter', function (newValue) {
            if (taskCtrl.taskData.be_id) {
                var checkRule = function (rule) {
                    if (rule.group) {
                        return checkGroup(rule.group);
                    }
                    else {
                        if (rule.condition === "" || rule.data === "" || rule.field === "") {
                            return false;
                        }
                        return true;
                    }
                };
                var checkGroup = function (group) {
                    if (group.operator == "") {
                        return false;
                    }
                    for (var i = 0; i < group.rules.length; i++) {
                        if (checkRule(group.rules[i]) == false) {
                            return false;
                        }
                    }
                    return true;
                };
                if (newValue && checkGroup(newValue.group) == true) {
                    taskCtrl.requestedEntities.parameters =  JSON.stringify(newValue);
                    var query = {
                        query: computed(newValue.group)
                    };
                    taskCtrl.requestedEntities.query_parameters = query.query;
                    if (query.query == "()"){
                        taskCtrl.parametersCount = 0;
                        return;
                    }
                    taskCtrl.parametersError = false;
                    TDMService.getAnalysisCount(taskCtrl.taskData.be_name, query).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            taskCtrl.parametersCount = response.result;
                        }
                        else{
                            taskCtrl.parametersCount = 0;
                        }
                    });
                }
            }
        }, true);


        taskCtrl.openStep = function(step){
            if (step < taskCtrl.step || taskCtrl.disableChange == true){
                return taskCtrl.step = step;
            }
            if (taskCtrl.step == 1 && !$scope.generalForm.$valid){
                taskCtrl.generalForm = $scope.generalForm;
                $scope.generalForm.submitted = true;
                return;
            }
            else if (taskCtrl.step == 2 && !$scope.requestedEntitiesForm.$valid){
                taskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                $scope.requestedEntitiesForm.submitted = true;
                return;
            }
            else if (taskCtrl.step == 3 && !$scope.requestParametersForm.$valid){
                taskCtrl.requestParametersForm = $scope.requestParametersForm;
                $scope.requestParametersForm.submitted = true;
                return;
            }
            else if (taskCtrl.step == 4 && !$scope.executionTimingForm.$valid){
                taskCtrl.executionTimingForm = $scope.executionTimingForm;
                $scope.executionTimingForm.submitted = true;
                return;
            }
            taskCtrl.step = step;

            if (taskCtrl.step == 1){
                $scope.generalForm.submitted = true;
            }
            else if (taskCtrl.step == 2){
                $scope.requestedEntitiesForm.submitted = true;
            }
            else if (taskCtrl.step == 3){
                $scope.requestParametersForm.submitted = true;
            }
            else if (taskCtrl.step == 4){
                $scope.executionTimingForm.submitted = true;
            }
        };

        taskCtrl.generalNext = function(form) {
            if (form.$valid || taskCtrl.disableChange == true) {
                taskCtrl.step = 2;
            } else {
                form.submitted = true;
            }
            taskCtrl.generalForm = form;
        };

        taskCtrl.requestedEntitiesNext = function(form){
            if (taskCtrl.selectFieldType == 'given' && taskCtrl.requestedEntities && typeof taskCtrl.requestedEntities.entities_list === 'string'
                && taskCtrl.taskData.entity_exclusion_list == taskCtrl.requestedEntities.entities_list){
                taskCtrl.errorList = true;
                if (!form.$valid){
                    form.submitted = true;
                    taskCtrl.requestedEntitiesForm = form;
                }
                return;
            }
            taskCtrl.errorList = false;
            if (form.$valid || taskCtrl.disableChange == true) {
                taskCtrl.step = 3;
            } else {
                form.submitted = true;
            }
            taskCtrl.requestedEntitiesForm = form;
        };

        taskCtrl.requestParametersNext = function(form){
            if (form.$valid || taskCtrl.disableChange == true) {
                taskCtrl.step = 4;
            } else {
                form.submitted = true;
            }
            taskCtrl.requestParametersForm = form;
        };

        taskCtrl.executionTimingFinish = function(form){
            if (form.$valid || taskCtrl.disableChange == true) {
                if (!$scope.generalForm.$valid){
                    taskCtrl.step = 1;
                    return;
                }
                else if (!$scope.requestedEntitiesForm.$valid){
                    taskCtrl.step = 2;
                    return;
                }
                else if (!$scope.requestParametersForm.$valid){
                    taskCtrl.step = 3;
                    return;
                }
                taskCtrl.saveTask();
            } else {
                form.submitted = true;
            }
            taskCtrl.executionTimingForm = form;
        };

        taskCtrl.cronTabConfig = {
            allowMultiple: true
        };


        BreadCrumbsService.push({task_id: taskCtrl.taskData.task_title}, 'TASK_BREADCRUMB', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'taskCtrl'
    };
}


angular
    .module('TDM-FE')
        .directive('taskDirective', taskDirective);