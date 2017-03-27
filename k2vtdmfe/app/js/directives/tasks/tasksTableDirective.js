function tasksTableDirective(){

    var template = "views/tasks/tasksTable.html";

    var controller = function ($scope,$compile,TDMService,$sessionStorage,DTColumnBuilder,DTOptionsBuilder,DTColumnDefBuilder,$q,BreadCrumbsService,AuthService,toastr) {
        var tasksTableCtrl = this;

        tasksTableCtrl.loadingTable = true;
        tasksTableCtrl.userRole = AuthService.getRole();
        tasksTableCtrl.username = AuthService.getUsername();

        TDMService.getTasks().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }
            tasksTableCtrl.tasksData =_.sortBy(response.result, function(value) {
                return new Date(value.task_last_updated_date);
            });
            tasksTableCtrl.tasksData.reverse();
            tasksTableCtrl.dtInstance = {};
            tasksTableCtrl.dtColumns = [];
            tasksTableCtrl.dtColumnDefs = [];
            tasksTableCtrl.headers = [
                {
                    column : 'task_title',
                    name : 'Task Title',
                    clickAble : true,
                    visible : true
                },
                {
                    column : 'be_name',
                    name : 'Business Entity  Name',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'environment_name',
                    name : 'Environment Name',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'selection_method',
                    name : 'Selection Method',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'number_of_entities_to_copy',
                    name : 'No. of Entities',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'task_last_updated_by',
                    name : 'Updated By',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'task_last_updated_date',
                    name : 'Update Date',
                    clickAble : false,
                    type : 'date',
                    visible : true
                },
                {
                    column : 'task_status',
                    name : 'Task Status',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'task_execution_status',
                    name : 'Task execution status',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'scheduler',
                    name : 'Execution Timing',
                    clickAble : false,
                    visible : true
                },
                {
                    column : 'refresh_reference_data',
                    name : 'Refresh reference data',
                    clickAble : false,
                    visible : false
                },
                {
                    column : 'request_of_fresh_data',
                    name : 'Request up to date entity',
                    clickAble : false,
                    visible : false
                },
                {
                    column : 'delete_before_load',
                    name : 'Delete entity before load',
                    clickAble : false,
                    visible : false
                },
                {
                    column : 'replace_sequences',
                    name : 'Replace sequence',
                    clickAble : false,
                    visible : false
                }
            ];

            tasksTableCtrl.dtColumnDefs = [];
            if ($sessionStorage.taskTableHideColumns){
                tasksTableCtrl.hideColumns = $sessionStorage.taskTableHideColumns;
            }
            else{
                tasksTableCtrl.hideColumns = [10,11,12,13];
            }
            for(var i = 0;i < tasksTableCtrl.hideColumns.length ; i++){
                var hideColumn = DTColumnDefBuilder.newColumnDef(tasksTableCtrl.hideColumns[i])
                    .withOption('visible', false);
                //try to comment out the line below
                tasksTableCtrl.dtColumnDefs.push(hideColumn);
            }


            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="tasksTableCtrl.openTask(\'' + full.task_id + '\')">' + data + '</a>';
            };

            var selectionMethodColumn = function(data, type, full, meta){
                switch (data){
                    case 'L' :
                        return 'Entity List';
                    case 'P' :
                        return 'Parameters - selection based only on Parameters';
                    case 'PR' :
                        return 'Parameters- selection based on parameters with random selection';
                    case 'R' :
                        return 'Random selection';
                    case 'S' :
                        return 'Synthetic creation';
                    default :
                        return 'none';
                }
            };

            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };

            var taskActions = function(data, type, full, meta){
                var taskActions = '';
                if (full.task_status == "Active" &&
                    (tasksTableCtrl.userRole.type == 'admin' || full.owners.indexOf(tasksTableCtrl.username) >= 0 || tasksTableCtrl.username == full.task_created_by )){
                    tasksTableCtrl.tasksData[meta.row].disabled = false;
                    tasksTableCtrl.tasksData[meta.row].onHold = full.task_execution_status == 'onHold';
                    taskActions = taskActions + '<button style="margin-left: 3px;" ng-if="tasksTableCtrl.tasksData[' + meta.row + '].onHold == false && tasksTableCtrl.tasksData[' + meta.row + '].executioncount == 0" title="Execute Task" ng-disabled="tasksTableCtrl.tasksData[' + meta.row +'].disabled == true" class="btn btn-success btn-circle" type="button" ng-click="tasksTableCtrl.executeTask(' + meta.row + ',\'' + full.task_title + '\')"><i class="fa fa-play"></i> </button>';
                    taskActions = taskActions +  '<button  ng-if="tasksTableCtrl.tasksData[' + meta.row + '].onHold == false"  style="margin-left: 3px;background-color: #ec4758; color: black;" title="Hold Task" class="btn btn-circle" type="button" ng-click="tasksTableCtrl.holdTask(' + meta.row + ')"><i class="fa fa-pause"></i> </button>';
                    taskActions = taskActions +  '<a ng-if="tasksTableCtrl.tasksData[' + meta.row + '].onHold == true" style="margin-left: 3px;"  title="Activate Task" ng-click="tasksTableCtrl.activateTask(' + meta.row + ')"><span class="fa-stack fa-lg"><i style="color: green;" class="fa fa-circle-o fa-stack-2x"></i><i style="color: green;" class="fa fa-play fa-stack-1x"></i></span></a>';

                }
                taskActions = taskActions +  '<button style="margin-left: 3px;" title="Task Execution History" class="btn btn-primary btn-circle" type="button" ng-click="tasksTableCtrl.taskExecutionHistory(\'' + full.task_id + '\')"><i class="fa fa-copy"></i></button>';

                return taskActions;
            };

            for (var i = 0; i <  tasksTableCtrl.headers.length ; i++) {
                if (tasksTableCtrl.headers[i].clickAble == true) {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (tasksTableCtrl.headers[i].type == 'date'){
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else if (tasksTableCtrl.headers[i].column == 'selection_method'){
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(selectionMethodColumn));
                }
                else {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name));
                }
            }

            tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn('taskActions').withTitle('').renderWith(taskActions).withOption('width', '100px'));

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(tasksTableCtrl.tasksData);
                return deferred.promise;
            };

            tasksTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [7, 'asc'])
                .withButtons([
                    {
                        extend: 'colvis',
                        text: 'Show/Hide columns',
                        columns: [4,5,6,7,8,9,10,11,12,13],
                        callback : function(columnIdx,visible){
                            if (visible == true){
                                var index = tasksTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index >= 0){
                                    tasksTableCtrl.hideColumns.splice(index,1);
                                }
                            }
                            else{
                                var index = tasksTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index < 0){
                                    tasksTableCtrl.hideColumns.push(columnIdx);
                                }
                            }
                            $sessionStorage.taskTableHideColumns = tasksTableCtrl.hideColumns;
                        }
                    }
                ])
                .withOption("caseInsensitive",true)
                .withOption('search',{
                    "caseInsensitive": false
                })
                .withLightColumnFilter({
                        0 : {
                            type: 'text',
                            hidden : (tasksTableCtrl.hideColumns.indexOf(0) >= 0 ? true : false)
                        },
                        1 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'be_name')),function(el){
                                return {value : el,label :el}
                            }),
                            hidden : (tasksTableCtrl.hideColumns.indexOf(1) >= 0 ? true : false)
                        },
                        2 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'environment_name')),function(el){
                                return {value : el,label :el}
                            }),
                            hidden : (tasksTableCtrl.hideColumns.indexOf(2) >= 0 ? true : false)
                        },
                        3 : {
                            type: 'select',
                            values: [
                                {
                                    value : "P",
                                    label : "Parameters"
                                },
                                {
                                    value : "R",
                                    label : "Random selection"
                                },
                                {
                                    value : "S",
                                    label : "Synthetic creation"
                                },
                                {
                                    value : "L",
                                    label : "Entity List"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(3) >= 0 ? true : false)
                        },
                        4 : {
                            type: 'text',
                            hidden : (tasksTableCtrl.hideColumns.indexOf(4) >= 0 ? true : false)
                        },
                        5 : {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'task_last_updated_by')),function(el){
                                return {value : el,label :el}
                            }),
                            hidden : (tasksTableCtrl.hideColumns.indexOf(5) >= 0 ? true : false)
                        },
                        6 : {
                            type: 'text',
                            hidden : (tasksTableCtrl.hideColumns.indexOf(6) >= 0 ? true : false)
                        },
                        7 : {
                            type: 'select',
                            values: [
                                {
                                    value : "Inactive",
                                    label : "Inactive"
                                },
                                {
                                    value : "Active",
                                    label : "Active"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(7) >= 0 ? true : false)
                        },
                        8 : {
                            type: 'select',
                            values: [
                                {
                                    value : "Active",
                                    label : "Active"
                                },
                                {
                                    value : "onHold",
                                    label : "onHold"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(8) >= 0 ? true : false)
                        },
                        9 : {
                            type: 'text',
                            hidden : (tasksTableCtrl.hideColumns.indexOf(9) >= 0 ? true : false)
                        },
                        10 : {
                            type: 'select',
                            values: [
                                {
                                    value : "true",
                                    label : "true"
                                },
                                {
                                    value : "false",
                                    label : "false"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(10) >= 0 ? true : false)
                        },
                        11 : {
                            type: 'select',
                            values: [
                                {
                                    value : "true",
                                    label : "true"
                                },
                                {
                                    value : "false",
                                    label : "false"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(11) >= 0 ? true : false)
                        },
                        12 : {
                            type: 'select',
                            values: [
                                {
                                    value : "true",
                                    label : "true"
                                },
                                {
                                    value : "false",
                                    label : "false"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(12) >= 0 ? true : false)
                        },
                        13 : {
                            type: 'select',
                            values: [
                                {
                                    value : "true",
                                    label : "true"
                                },
                                {
                                    value : "false",
                                    label : "false"
                                }
                            ],
                            hidden : (tasksTableCtrl.hideColumns.indexOf(13) >= 0 ? true : false)
                        }
                });

            tasksTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(tasksTableCtrl.dtInstance)) {
                    tasksTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(tasksTableCtrl.dtInstance)) {
                    tasksTableCtrl.dtInstance = dtInstance;
                }
            };
            if (tasksTableCtrl.dtInstance.changeData != null)
                tasksTableCtrl.dtInstance.changeData(getTableData());

            tasksTableCtrl.loadingTable = false;
        });


        tasksTableCtrl.openTask = function(taskId){
            if ($scope.content.openTask) {
                var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(taskId)});
                if (taskData) {
                    $scope.content.openTask(taskData);
                    return;
                }
            }
            //TODO show error ??
        };

        tasksTableCtrl.openNewTask = function(){
            if ($scope.content.openNewTask) {
                $scope.content.openNewTask(tasksTableCtrl.tasksData);
                return;
            }
            //TODO show error ??
        };

        tasksTableCtrl.taskExecutionHistory = function (taskId) {
            if ($scope.content.openTaskHistory) {
                var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(taskId)});
                if (taskData) {
                    $scope.content.openTaskHistory(taskData);
                    BreadCrumbsService.push({title : taskData.task_title}, 'TASK_EXECUTION_HISTORY', function () {
                    });
                    return;
                }
            }
        };


        tasksTableCtrl.executeTask = function(index,task_title){
            tasksTableCtrl.tasksData[index].disabled = true;
            TDMService.executeTask(tasksTableCtrl.tasksData[index].task_id).then(function(response){
                if (response.errorCode == 'SUCCESS'){
                    tasksTableCtrl.tasksData[index].executioncount = 1;
                    toastr.success("Task # " + task_title, " Successfully started");
                    tasksTableCtrl.dtInstance.reloadData(function(data){}, true);
                    tasksTableCtrl.taskExecutionHistory(tasksTableCtrl.tasksData[index].task_id);
                }
                else{
                    toastr.error("Task # " + task_title, response.message);
                }
                tasksTableCtrl.tasksData[index].disabled = false;
            });
        };

        tasksTableCtrl.holdTask = function(index){
            TDMService.holdTask(tasksTableCtrl.tasksData[index].task_id).then(function(response){
                if (response.errorCode == 'SUCCESS'){
                    tasksTableCtrl.tasksData[index].task_execution_status = 'onHold';
                    toastr.success("Task # " + tasksTableCtrl.tasksData[index].task_title, " was Holded");
                    tasksTableCtrl.tasksData[index].onHold = true;
                    tasksTableCtrl.dtInstance.reloadData(function(data){}, true);
                }
                else{
                    toastr.error("Task # " + task_title, "Failed to hold");
                }
            });
        };

        tasksTableCtrl.activateTask = function(index){
            TDMService.activateTask(tasksTableCtrl.tasksData[index].task_id).then(function(response){
                if (response.errorCode == 'SUCCESS'){
                    tasksTableCtrl.tasksData[index].task_execution_status = 'Active';
                    toastr.success("Task # " + tasksTableCtrl.tasksData[index].task_title, " was activated");
                    tasksTableCtrl.tasksData[index].onHold = false;
                    tasksTableCtrl.dtInstance.reloadData(function(data){}, true);
                }
                else{
                    toastr.error("Task # " + task_title, "Failed to activate");
                }
            });
        }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'tasksTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('tasksTableDirective', tasksTableDirective);