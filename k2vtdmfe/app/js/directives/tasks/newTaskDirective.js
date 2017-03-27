function newTaskDirective() {

    var template = "views/tasks/newTask.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, $timeout, AuthService,$state) {
        var newTaskCtrl = this;

        newTaskCtrl.tasks = $scope.content.tasks;

        newTaskCtrl.step = 1;

        newTaskCtrl.advancedSchedule = false;

        newTaskCtrl.taskData = {

        };

        newTaskCtrl.param = {};

        newTaskCtrl.requestedEntities = {};

        newTaskCtrl.selectFieldType = 'given';

        newTaskCtrl.entitiesPattern = new RegExp("^(\\d+(?:,\\d+){0,})?$");
        newTaskCtrl.excultionPattern = new RegExp("^(\\d+(?:,\\d+){0,})?$");
        newTaskCtrl.syntheticPattern = /^[^,\s]+$/g;

        newTaskCtrl.updateEntitiesPattern = function(){
            if (newTaskCtrl.taskData.number_of_entities_to_copy){
                newTaskCtrl.entitiesPattern = new RegExp("^(\\d+(?:,\\d+){"+ (newTaskCtrl.taskData.number_of_entities_to_copy - 1) +"})?$")
            }
        };

        var userRole = AuthService.getRole();

        TDMService.getTimeZone().then(function(response){
            if (response.errorCode == "SUCCESS") {
                newTaskCtrl.timeZoneMessage = 'Task execution time will be based on '+ response.result.current_setting  + ' time zone'
            }
            else {
                newTaskCtrl.timeZoneMessage = 'Task execution time will be based on DB time zone'
            }
        });

        if (userRole.type == 'admin') {
            TDMService.getEnvironments().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.allEnvironments = response.result;
                    newTaskCtrl.allEnvironments = _.filter(newTaskCtrl.allEnvironments, function (env) {
                        return env.environment_status === 'Active';
                    });
                }
                else {
                    toastr.error("Faild to get Environments for user " + AuthService.getUsername());
                }
            });
        }
        else {
            TDMService.getEnvironmentsForUser().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.allEnvironments = response.result;
                    newTaskCtrl.allEnvironments = _.filter(newTaskCtrl.allEnvironments, function (env) {
                        return env.environment_status === 'Active';
                    });
                }
                else {
                    toastr.error("Faild to get Environments for user " + AuthService.getUsername());
                }
            });
        }

        newTaskCtrl.environmentChange = function () {
            if (userRole.type == 'admin') {
                newTaskCtrl.userRole = {};
                newTaskCtrl.userRole.allowed_random_entity_selection = true;
                newTaskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                newTaskCtrl.userRole.allowed_refresh_reference_data = true;
                newTaskCtrl.userRole.allowed_request_of_fresh_data = true;
                newTaskCtrl.userRole.allowed_delete_before_load = true;
                newTaskCtrl.userRole.allowed_task_scheduling = true;
                newTaskCtrl.userRole.allowed_replace_sequences = true;
            }
            else {
                TDMService.getEnvironmentOwners(newTaskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                        if (ownerFound) {
                            newTaskCtrl.userRole = {};
                            newTaskCtrl.userRole.allowed_random_entity_selection = true;
                            newTaskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                            newTaskCtrl.userRole.allowed_refresh_reference_data = true;
                            newTaskCtrl.userRole.allowed_request_of_fresh_data = true;
                            newTaskCtrl.userRole.allowed_delete_before_load = true;
                            newTaskCtrl.userRole.allowed_task_scheduling = true;
                            newTaskCtrl.userRole.allowed_replace_sequences = true;
                        }
                        else {
                            TDMService.getRoleForUserInEnv(newTaskCtrl.taskData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    newTaskCtrl.userRole = response.result[0];
                                    if (newTaskCtrl.userRole.allowed_number_of_entities_to_copy) {
                                        newTaskCtrl.taskData.number_of_entities_to_copy = parseInt(newTaskCtrl.userRole.allowed_number_of_entities_to_copy);
                                        newTaskCtrl.userRole.maxToCopy = newTaskCtrl.taskData.number_of_entities_to_copy;
                                    }
                                }
                                else {
                                    toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Faild to get Role for user ");
                                }
                            });
                        }
                    }
                    else {
                        toastr.error("Environment # " + newTaskCtrl.taskData.environment_id, "failed to get owners : " + response.message);
                    }
                });
            }

            TDMService.getBusinessEntitiesForEnvProducts(newTaskCtrl.taskData.environment_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.businessEntities = response.result;
                }
                else {
                    toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Faild to get Business Entities");
                }
            });

            newTaskCtrl.taskData.be_id = undefined;
            newTaskCtrl.products = [];
        };

        newTaskCtrl.businessEntityChange = function () {
            var be = _.find(newTaskCtrl.businessEntities,{be_id : newTaskCtrl.taskData.be_id});
            if (be){
                newTaskCtrl.be_name = be.be_name;
            }
            if (newTaskCtrl.taskData.environment_id && newTaskCtrl.taskData.be_id) {
                TDMService.getProductsForBusinessEntityAndEnv(newTaskCtrl.taskData.be_id, newTaskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.allProducts = response.result;
                        newTaskCtrl.products = [];
                    }
                    else {
                        toastr.error("Business entity # " + newTaskCtrl.taskData.be_id, "Failed to get products");
                    }
                });

                TDMService.getBusinessEntityParameters(newTaskCtrl.taskData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.parameters = response.result;
                    }
                    else {
                        toastr.error("Business entity # " + newTaskCtrl.taskData.be_id, "Failed to get business entity parametes");
                    }
                })
            }
        };

        newTaskCtrl.selectSchedule = 'immediate';

        newTaskCtrl.addTask = function () {
            if (newTaskCtrl.createTaskInProgress == true){
                return;
            }
            newTaskCtrl.createTaskInProgress = true;
            if (newTaskCtrl.selectFieldType == 'given') {
                if (newTaskCtrl.requestedEntities && newTaskCtrl.taskData.entity_exclusion_list == newTaskCtrl.requestedEntities.entities_list){
                    newTaskCtrl.errorList = true;
                    newTaskCtrl.step = 2;
                    newTaskCtrl.createTaskInProgress = false;
                    return;
                }
                newTaskCtrl.taskData.selection_method = 'L';
                newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.entities_list;

            }
            else if (newTaskCtrl.selectFieldType == 'random') {
                newTaskCtrl.taskData.selection_method = 'R';
                newTaskCtrl.taskData.selection_param_value = null;
            }
            else if (newTaskCtrl.selectFieldType == 'synthetic') {
                newTaskCtrl.taskData.selection_method = 'S';
                newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.synthetic;
            }
            else {
                if (!newTaskCtrl.requestedEntities.query_parameters || newTaskCtrl.requestedEntities.query_parameters == '()'){
                    newTaskCtrl.parametersError = true;
                    newTaskCtrl.step = 2;
                    newTaskCtrl.createTaskInProgress = false;
                    return;
                }

                if (newTaskCtrl.parametersRandom == true){
                    newTaskCtrl.taskData.selection_method = 'PR';
                }
                else{
                    newTaskCtrl.taskData.selection_method = 'P';
                }
                newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.query_parameters;
                newTaskCtrl.taskData.parameters = newTaskCtrl.requestedEntities.parameters;
            }

            if (newTaskCtrl.selectSchedule == 'immediate') {
                newTaskCtrl.taskData.scheduler = newTaskCtrl.selectSchedule;
            }
            else {
                newTaskCtrl.taskData.scheduler = newTaskCtrl.scheduleData;
            }
            if (_.find(newTaskCtrl.tasks, {task_title: newTaskCtrl.taskData.task_title,task_status : 'Active'})) {
                newTaskCtrl.createTaskInProgress = false;
                return toastr.error("Task # " + newTaskCtrl.taskData.task_title + " Already Exists");
            }
            TDMService.createTask(newTaskCtrl.taskData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    var createTaskResult = response.result;
                    TDMService.postTaskProducts(response.result.id, newTaskCtrl.taskData.task_title, newTaskCtrl.products).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Task # " + createTaskResult.id, " Is Created Successfully");
                        }
                        else {
                            toastr.error("Task # " + newTaskCtrl.taskData.task_id, " Failed to Update : " + response.message);
                        }
                        $timeout(function () {
                            $state.go('index.tasks', {}, {reload: true});
                        }, 300);
                    });
                }
                else {
                    toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Unable to Create : " + response.message);
                    newTaskCtrl.createTaskInProgress = false;
                }
            });
        };

        var data = '{"group": {"operator": "AND","rules": []}}';

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
                     //   str += "( ANY("+ group.rules[i].field + ") " +  group.rules[i].condition + " \'" + data + "\' )";
                        str += "( \'" + data + "\' " +  group.rules[i].condition + " ANY("+ group.rules[i].field +") )";
                    }
                    else{
                     //   str += "( ANY("+ group.rules[i].field + ") " +  group.rules[i].condition + " \'" + data + "\' ) "  +  group.rules[i].operator + " ";
                        str += "( \'" + data + "\' " +  group.rules[i].condition + " ANY("+ group.rules[i].field +") ) "  +  group.rules[i].operator + " ";
                    }
                }
            }
            return str + ")";
        }


        newTaskCtrl.filter = JSON.parse(data);
        newTaskCtrl.parametersCount = 0;
        $scope.$watch('newTaskCtrl.filter', function (newValue) {
            if (newTaskCtrl.taskData.be_id) {
                var checkRule = function (rule) {
                    if (rule.group) {
                        return checkGroup(rule.group);
                    }
                    else {
                        if (rule.condition === "" || rule.data === null || rule.field === "") {
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

                if (checkGroup(newValue.group) == true) {
                    newTaskCtrl.requestedEntities.parameters = JSON.stringify(newValue);
                    var query = {
                        query: computed(newValue.group)
                    };
                    newTaskCtrl.requestedEntities.query_parameters = query.query;
                    if (query.query == "()"){
                        newTaskCtrl.parametersCount = 0;
                        return;
                    }
                    newTaskCtrl.parametersError = false;
                    TDMService.getAnalysisCount(newTaskCtrl.be_name, query).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            newTaskCtrl.parametersCount = response.result;
                        }
                        else{
                            newTaskCtrl.parametersCount = 0;
                        }
                    });
                }
            }
        }, true);


        newTaskCtrl.openStep = function(step){
            if (step < newTaskCtrl.step){
                return newTaskCtrl.step = step;
            }
            if (newTaskCtrl.step == 1 && !$scope.generalForm.$valid){
                newTaskCtrl.generalForm = $scope.generalForm;
                $scope.generalForm.submitted = true;
                return;
            }
            else if (newTaskCtrl.step == 2 && !$scope.requestedEntitiesForm.$valid){
                newTaskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                $scope.requestedEntitiesForm.submitted = true;
                return;
            }
            else if (newTaskCtrl.step == 3 && !$scope.requestParametersForm.$valid){
                newTaskCtrl.requestParametersForm = $scope.requestParametersForm;
                $scope.requestParametersForm.submitted = true;
                return;
            }
            else if (newTaskCtrl.step == 4 && !$scope.executionTimingForm.$valid){
                newTaskCtrl.executionTimingForm = $scope.executionTimingForm;
                $scope.executionTimingForm.submitted = true;
                return;
            }
            newTaskCtrl.step = step;

            if (newTaskCtrl.step == 1){
                $scope.generalForm.submitted = true;
            }
            else if (newTaskCtrl.step == 2){
                $scope.requestedEntitiesForm.submitted = true;
            }
            else if (newTaskCtrl.step == 3){
                $scope.requestParametersForm.submitted = true;
            }
            else if (newTaskCtrl.step == 4){
                $scope.executionTimingForm.submitted = true;
            }
        };

        newTaskCtrl.generalNext = function(form) {
            if (form.$valid) {
                newTaskCtrl.step = 2;
            } else {
                form.submitted = true;
            }
            newTaskCtrl.generalForm = form;
        };

        newTaskCtrl.requestedEntitiesNext = function(form){
            if (newTaskCtrl.selectFieldType == 'given' && newTaskCtrl.requestedEntities && typeof newTaskCtrl.requestedEntities.entities_list === 'string'
                && newTaskCtrl.taskData.entity_exclusion_list == newTaskCtrl.requestedEntities.entities_list){
                newTaskCtrl.errorList = true;
                if (!form.$valid){
                    form.submitted = true;
                    newTaskCtrl.requestedEntitiesForm = form;
                }
                return;
            }
            newTaskCtrl.errorList = false;
            if (form.$valid) {
                newTaskCtrl.step = 3;
            } else {
                form.submitted = true;
            }
            newTaskCtrl.requestedEntitiesForm = form;
        };

        newTaskCtrl.requestParametersNext = function(form){
            if (form.$valid) {
                newTaskCtrl.step = 4;
            } else {
                form.submitted = true;
            }
            newTaskCtrl.requestParametersForm = form;
        };

        newTaskCtrl.executionTimingFinish = function(form){
            if (form.$valid) {
                if (!$scope.generalForm.$valid){
                    newTaskCtrl.step = 1;
                    return;
                }
                else if (!$scope.requestedEntitiesForm.$valid){
                    newTaskCtrl.step = 2;
                    return;
                }
                else if (!$scope.requestParametersForm.$valid){
                    newTaskCtrl.step = 3;
                    return;
                }
                newTaskCtrl.addTask();
            } else {
                form.submitted = true;
            }
            newTaskCtrl.executionTimingForm = form;
        };


        newTaskCtrl.cronTabConfig = {
            allowMultiple: true
        };

        BreadCrumbsService.push({}, 'NEW_TASK', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'newTaskCtrl'
    };
}

function queryBuilder($compile) {
    return {
        restrict: 'E',
        scope: {
            group: '=',
            params: '=',
            disablechange: '=',
            lastindex : '=',
            form : '='
        },
        templateUrl: 'views/tasks/queryBuilderDirective.html',
        compile: function (element, attrs) {
            var content, directive;
            content = element.contents().remove();
            return function (scope, element, attrs) {
                scope.operators = [
                    {name: 'AND'},
                    {name: 'OR'}
                ];

                scope.conditions = [
                    {
                        name: '=',
                        id : '='
                    },
                    {
                        name: '<>',
                        id : '<>'
                    },
                    {
                        name: '<',
                        id : '>'
                    },
                    {
                        name: '<=',
                        id : '>='
                    },
                    {
                        name: '>',
                        id : '<'
                    },
                    {
                        name: '>=',
                        id : '<='
                    }
                ];

                scope.comboConditions = [
                    {name: '='},
                    {name: '<>'}
                ];

                scope.changeParam = function (rule, field) {
                    scope.data = undefined;
                    var param = _.find(scope.params, {param_name: field});
                    if (param) {
                        rule.type = param.param_type;
                        if (rule.type == 'integer' || rule.type == 'real' || rule.type == 'number') {
                            rule.min = parseFloat(param.min_value);
                            rule.max = parseFloat(param.max_value);
                        }
                        else{
                            rule.validValues = param.valid_values
                        }
                    }
                    rule.field = field;
                };

                scope.changeCondition = function (rule, condition) {
                    rule.condition = condition;
                };

                scope.changeData = function (rule, data) {
                    if (data === undefined) {
                        rule.data = 0;
                        return;
                    }
                    rule.data = data;
                };

                scope.addCondition = function () {
                    scope.group.rules.push({
                        condition: '',
                        field: '',
                        data: null,
                        operator: 'AND'
                    });
                };

                scope.removeCondition = function (index) {
                    scope.group.rules.splice(index, 1);
                };

                scope.addGroup = function () {
                    scope.group.rules.push({
                        group: {
                            operator: 'AND',
                            rules: []
                        }
                    });
                };

                scope.removeGroup = function () {
                    "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
                };

                directive || (directive = $compile(content));

                element.append(directive(scope, function ($compile) {
                    return $compile;
                }));
            }
        }
    };
}

angular
    .module('TDM-FE')
    .directive('newTaskDirective', newTaskDirective)
    .directive('queryBuilder', ['$compile', queryBuilder]);