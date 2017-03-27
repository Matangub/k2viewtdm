function taskHistoryDirective($interval){

    var template = "views/tasks/tasksHistoryTable.html";

    var controller = function ($scope,$compile,$timeout,TDMService,DTColumnBuilder,DTOptionsBuilder,DTColumnDefBuilder,$q,$sessionStorage) {
        var taskHistoryTableCtrl = this;
        taskHistoryTableCtrl.taskData = $scope.content.task;
        taskHistoryTableCtrl.loadingTable = true;

        TDMService.getTaskHistory(taskHistoryTableCtrl.taskData.task_id).then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }
            taskHistoryTableCtrl.runningExecutions = [];

            taskHistoryTableCtrl.taskHistoryData = _.filter(response.result,function(execution){
                if (execution.execution_status.toUpperCase() == 'RUNNING' || execution.execution_status.toUpperCase() == "EXECUTING"
                    || execution.execution_status.toUpperCase() == "STARTED" || execution.execution_status.toUpperCase() == "STARTEXECUTIONREQUESTED"){
                    taskHistoryTableCtrl.runningExecutions.push(execution);
                    return false;
                }
                return true;
            });

            taskHistoryTableCtrl.taskHistoryData =_.sortBy(taskHistoryTableCtrl.taskHistoryData, function(value) {
                return (value.task_execution_id * -1);
            });
            taskHistoryTableCtrl.executionIds = _.map(taskHistoryTableCtrl.runningExecutions,function(execution){
                return {
                    etl_execution_id : execution.etl_execution_id,
                    etl_ip_address : execution.etl_ip_address
                }
            });
            taskHistoryTableCtrl.reloadData = function(){
                TDMService.getTaskHistory(taskHistoryTableCtrl.taskData.task_id).then(function(response){
                    if (response.errorCode != 'SUCCESS'){
                        //TODO show Error
                        return;
                    }
                    taskHistoryTableCtrl.taskHistoryData = _.filter(response.result,function(execution){
                        if (execution.execution_status.toUpperCase() == 'RUNNING' || execution.execution_status.toUpperCase() == "EXECUTING"
                            || execution.execution_status.toUpperCase() == "STARTED" || execution.execution_status.toUpperCase() == "STARTEXECUTIONREQUESTED"){
                            return false;
                        }
                        return true;
                    });
                    taskHistoryTableCtrl.taskHistoryData =_.sortBy(taskHistoryTableCtrl.taskHistoryData, function(value) {
                        return (value.task_execution_id * -1);
                    });
                    taskHistoryTableCtrl.dtInstance.reloadData(function(data){}, false);
                });
            };

            taskHistoryTableCtrl.stopExecution = function(executionId){
                var execution = _.find(taskHistoryTableCtrl.executionIds,{etl_execution_id : executionId});
                if (!execution){
                    return;
                }
                TDMService.stopExecution(execution).then(function(response){
                    if (response.errorCode == 'SUCCESS'){
                        var index = _.indexOf(taskHistoryTableCtrl.executionIds,{etl_execution_id : executionId});
                        if (index >= 0){
                            taskHistoryTableCtrl.executionIds.splice(index, 1);
                            $timeout(function(){
                                taskHistoryTableCtrl.reloadData();
                            },1000);
                        }
                    }
                    else{
                        //error
                    }
                });
            };

            $scope.updateRunningExecutions = function(){
                if (taskHistoryTableCtrl.executionIds.length > 0) {
                    TDMService.getTaskMonitor({
                        executions : taskHistoryTableCtrl.executionIds
                    }).then(function(response){
                        if (response.errorCode != 'SUCCESS'){
                            //TODO show Error
                            return;
                        }
                        taskHistoryTableCtrl.runningExecutionsData = response.result;
                        taskHistoryTableCtrl.runningExecutionsData =_.sortBy(response.result, function(value) {
                            return value.executionID;
                        });
                        var executionsFinished = false;
                        for ( var i = 0; i < taskHistoryTableCtrl.runningExecutionsData.length; i++){
                            if (executionsFinished == false && taskHistoryTableCtrl.runningExecutionsData[i].data &&
                                taskHistoryTableCtrl.runningExecutionsData[i].data.status.toUpperCase() == 'COMPLETED'
                                || taskHistoryTableCtrl.runningExecutionsData[i].data.status.toUpperCase() == 'STOPPED'
                                || taskHistoryTableCtrl.runningExecutionsData[i].data.status.toUpperCase() == 'FAILED'){
                                executionsFinished = true;
                                var index = _.findIndex(taskHistoryTableCtrl.executionIds,{etl_execution_id : taskHistoryTableCtrl.runningExecutionsData[i].executionID});
                                if (index >= 0){
                                    taskHistoryTableCtrl.executionIds.splice(index, 1);
                                }
                            }
                        }
                        if (executionsFinished == true){
                            $timeout(function(){
                                taskHistoryTableCtrl.reloadData();
                            },5000);
                        }
                    });
                }
            };

            taskHistoryTableCtrl.dtInstance = {};
            taskHistoryTableCtrl.dtColumns = [];
            taskHistoryTableCtrl.dtColumnDefs = [];
            taskHistoryTableCtrl.headers = [
                {
                    column : 'environment_name',
                    name : 'Environment Name',
                    clickAble : false
                },
                {
                    column : 'data_center_name',
                    name : 'Data Center Name',
                    clickAble : false
                },
                {
                    column : 'task_execution_id',
                    name : 'Task Execution Id',
                    clickAble : true
                },
                {
                    column : 'be_name',
                    name : 'Business Entity Name',
                    clickAble : false
                },
                {
                    column : 'product_name',
                    name : 'Product Name',
                    clickAble : false
                },
                {
                    column : 'product_version',
                    name : 'Product Version',
                    clickAble : false
                },
                {
                    column : 'lu_name',
                    name : 'Logical Unit Name',
                    clickAble : false
                },
                {
                    column : 'num_of_processed_entities',
                    name : 'Total Number Of Processed Entities',
                    clickAble : false
                },
                {
                    column : 'num_of_copied_entities',
                    name : 'Number Of Copied Entities',
                    clickAble : false
                },
                {
                    column : 'num_of_failed_entities',
                    name : 'Number Of Failed Entities',
                    clickAble : false
                },
                {
                    column : 'start_execution_time',
                    name : 'Start Execution Date',
                    clickAble : false,
                    date : true
                },
                {
                    column : 'end_execution_time',
                    name : 'End Execution Date',
                    clickAble : false,
                    date : true
                },
                {
                    column : 'execution_status',
                    name : 'Execution Status',
                    clickAble : false
                }
            ];

            taskHistoryTableCtrl.dtColumnDefs = [];
            if ($sessionStorage.taskHistoryTableHideColumns){
                taskHistoryTableCtrl.hideColumns = $sessionStorage.taskHistoryTableHideColumns;
            }
            else{
                taskHistoryTableCtrl.hideColumns = [];
            }
            for(var i = 0;i < taskHistoryTableCtrl.hideColumns.length ; i++){
                var hideColumn = DTColumnDefBuilder.newColumnDef(taskHistoryTableCtrl.hideColumns[i])
                    .withOption('visible', false);
                //try to comment out the line below
                taskHistoryTableCtrl.dtColumnDefs.push(hideColumn);
            }


            var changeToLocalDate = function(data, type, full, meta){
                if (data) {
                    return moment(data).format('DD MMM YYYY, HH:mm');
                }
                return '';
            };

            for (var i = 0; i <  taskHistoryTableCtrl.headers.length ; i++) {
                if (taskHistoryTableCtrl.headers[i].date == true){
                    taskHistoryTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskHistoryTableCtrl.headers[i].column).withTitle(taskHistoryTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    taskHistoryTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskHistoryTableCtrl.headers[i].column).withTitle(taskHistoryTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskHistoryTableCtrl.taskHistoryData);
                return deferred.promise;
            };

            taskHistoryTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('paging', true)
                .withOption('scrollX', false)
                .withButtons([
                    {
                        extend: 'colvis',
                        text: 'Show/Hide columns',
                        columns: [5,7,8,9,10,11],
                        callback : function(columnIdx,visible){
                            if (visible == true){
                                var index = taskHistoryTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index >= 0){
                                    taskHistoryTableCtrl.hideColumns.splice(index,1);
                                }
                            }
                            else{
                                var index = taskHistoryTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index < 0){
                                    taskHistoryTableCtrl.hideColumns.push(columnIdx);
                                }
                            }
                            $sessionStorage.taskHistoryTableHideColumns = taskHistoryTableCtrl.hideColumns
                        }
                    }
                ])
                .withLightColumnFilter({
                    0 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'environment_name')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(0) >= 0 ? true : false)
                    },
                    1 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'data_center_name')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(1) >= 0 ? true : false)
                    },
                    2 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(2) >= 0 ? true : false)
                    },
                    3 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'be_name')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(3) >= 0 ? true : false)
                    },
                    4 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'product_name')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(4) >= 0 ? true : false)
                    },
                    5 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(5) >= 0 ? true : false)
                    },
                    6 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'lu_name')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(6) >= 0 ? true : false)
                    },
                    7 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(7) >= 0 ? true : false)
                    },
                    8 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(8) >= 0 ? true : false)
                    },
                    9 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(9) >= 0 ? true : false)
                    },
                    10 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(10) >= 0 ? true : false)
                    },
                    11 : {
                        type: 'text',
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(11) >= 0 ? true : false)
                    },
                    12 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'execution_status')),function(el){
                            return {value : el,label :el}
                        }),
                        hidden : (taskHistoryTableCtrl.hideColumns.indexOf(12) >= 0 ? true : false)
                    }
                });

            taskHistoryTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(taskHistoryTableCtrl.dtInstance)) {
                    taskHistoryTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(taskHistoryTableCtrl.dtInstance)) {
                    taskHistoryTableCtrl.dtInstance = dtInstance;
                }
            };
            if (taskHistoryTableCtrl.dtInstance.changeData != null)
                taskHistoryTableCtrl.dtInstance.changeData(getTableData());

            taskHistoryTableCtrl.loadingTable = false;
        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        link: function (scope, element, attr) {
            if (scope.updateRunningExecutions){
                scope.updateRunningExecutions();
            }
            var updateData = $interval(function () {
                if (scope.updateRunningExecutions){
                    scope.updateRunningExecutions();
                }
            }, 2000);
            element.on('$destroy', function () {
                $interval.cancel(updateData);
            });
        },
        controller: controller,
        controllerAs :'taskHistoryTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('taskHistoryDirective', taskHistoryDirective);