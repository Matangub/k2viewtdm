function dashboardCtrl($scope, $compile, BreadCrumbsService, TDMService, DTColumnBuilder, DTOptionsBuilder, $q) {
    var dashboardCtrl = this;



    dashboardCtrl.init = function(){

        dashboardCtrl.loadingTable = true;
        var colors = Highcharts.getOptions().colors;
        dashboardCtrl.chosenInterval = 'Month';


        $scope.$on('intervalChanged',function(event,data){
            dashboardCtrl.chosenInterval = data.interval;
            dashboardCtrl.getTasksStatus();
            dashboardCtrl.getTasksExecutionsStatus();
            dashboardCtrl.getTasksPerBE();
            dashboardCtrl.getNumProcessedEntities();
            dashboardCtrl.getNumCopiedFailedEntitiesPerLU();
            dashboardCtrl.getActivities(false);
        });

        dashboardCtrl.getTasksStatus();
        dashboardCtrl.getTasksExecutionsStatus();
        dashboardCtrl.getTasksPerBE();
        dashboardCtrl.getNumProcessedEntities();
        dashboardCtrl.getNumCopiedFailedEntitiesPerLU();
        dashboardCtrl.getActivities(true);
    };


    dashboardCtrl.getTasksStatus = function(){
        TDMService.getTasksStatus(dashboardCtrl.chosenInterval).then(function(response){
            dashboardCtrl.taskStatus = response.result;
            var active = _.find(dashboardCtrl.taskStatus,{task_status : 'Active',task_execution_status : 'Active'});
            var numOfActive = 0;
            if (active){
                numOfActive = parseInt(active.count);
            }
            var onHold = _.find(dashboardCtrl.taskStatus,{task_status : 'Active',task_execution_status : 'onHold'});
            var numOfOnHold = 0;
            if (onHold){
                numOfOnHold = parseInt(onHold.count);
            }

            var inActive = _.find(dashboardCtrl.taskStatus,{task_status : 'Inactive',task_execution_status : 'Active'});
            var numOfInActive = 0;
            if (inActive){
                numOfInActive = parseInt(inActive.count);
            }
            var inActiveOnHold = _.find(dashboardCtrl.taskStatus,{task_status : 'Inactive',task_execution_status : 'onHold'});
            var numOfInActiveOnHold = 0;
            if (inActiveOnHold){
                numOfInActiveOnHold = parseInt(inActiveOnHold.count);
            }

            dashboardCtrl.TasksStatusCateogryData = [
                {
                    name: "Active",
                    y: numOfActive + numOfOnHold
                },
                {
                    name: "Inactive",
                    y: numOfInActive + numOfInActiveOnHold
                }
            ];
            dashboardCtrl.TasksStatusRawData = [
                {
                    name: "Active",
                    y: numOfActive
                },
                {
                    name: "OnHold",
                    y: numOfOnHold
                },
                {
                    name: "Inactive",
                    y: numOfInActive + numOfInActiveOnHold
                }
            ];
            dashboardCtrl.TasksStatus = {
                chart: {
                    type: 'pie',
                    plotBackgroundColor : 'transparent'
                },
                title: {
                    text: 'Tasks'
                },
                series: [{
                    name: 'Tasks',
                    data: dashboardCtrl.TasksStatusCateogryData,
                    size: '60%',
                    dataLabels: {
                        formatter: function () {
                            return this.y > 0 ? this.point.name : null;
                        },
                        color: '#ffffff',
                        distance: -30
                    }
                }, {
                    name: 'Tasks',
                    data: dashboardCtrl.TasksStatusRawData,
                    size: '80%',
                    innerSize: '60%',
                    dataLabels: {
                        formatter: function () {
                            return this.y > 0 ? '<b>' + this.key + ': </b> ' + this.y : null;
                        }
                    }
                }]
            }
        });
    };

    dashboardCtrl.getTasksExecutionsStatus = function(){
        TDMService.getTasksExecutionsStatus(dashboardCtrl.chosenInterval).then(function(response){
            dashboardCtrl.taskExecutionresult = response.result;
            dashboardCtrl.barData = {
                labels: ['Failed', 'Pending', 'Paused', 'Stopped', 'Running', 'Completed'],
                datasets: [
                    {
                        label: "Exection status",
                        fillColor: "rgba(26,179,148,0.5)",
                        strokeColor: "rgba(26,179,148,0.8)",
                        highlightFill: "rgba(26,179,148,0.75)",
                        highlightStroke: "rgba(26,179,148,1)",
                        data: [dashboardCtrl.taskExecutionresult.failed,
                            dashboardCtrl.taskExecutionresult.pending,
                            dashboardCtrl.taskExecutionresult.paused,
                            dashboardCtrl.taskExecutionresult.stopped,
                            dashboardCtrl.taskExecutionresult.running,
                            dashboardCtrl.taskExecutionresult.completed]
                    }
                ]
            };
            dashboardCtrl.taskExecutions = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Execution Status'
                },
                xAxis: {
                    categories: [
                        'Failed',
                        'Pending',
                        'Paused',
                        'Stopped',
                        'Running',
                        'Completed'
                    ],
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'No. Of Task execution'
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: 'Task executions',
                    data: [
                        {y : dashboardCtrl.taskExecutionresult.failed, color : '#ec4758'},
                        {y : dashboardCtrl.taskExecutionresult.pending, color : '#B9C794'},
                        {y : dashboardCtrl.taskExecutionresult.paused ,color : '#92569C'},
                        {y : dashboardCtrl.taskExecutionresult.stopped, color :'#1c84c6'},
                        {y : dashboardCtrl.taskExecutionresult.running},
                        {y : dashboardCtrl.taskExecutionresult.completed,color : '#51B3C3'}
                    ]
                }]
            }
        });
    };


    dashboardCtrl.getTasksPerBE = function(){
        TDMService.getTasksPerBE(dashboardCtrl.chosenInterval).then(function(response){
            dashboardCtrl.ActiveTaskBE = response.result;
            var businessEntitiesData = [];
            var businessEntitiesDrillDownData = [];
            for (var i = 0; i < response.result.length; i++){
                response.result[i].count = parseInt(response.result[i].count);

                businessEntitiesData.push({
                    name : response.result[i].be_name,
                    y : response.result[i].count,
                    drilldown : response.result[i].be_name
                });
                businessEntitiesDrillDownData.push({
                    name : response.result[i].be_name,
                    id : response.result[i].be_name,
                    data : [
                        ['Failed', response.result[i].taskExecutions.failed],
                        ['Pending', response.result[i].taskExecutions.pending],
                        ['Paused', response.result[i].taskExecutions.paused],
                        ['Stopped', response.result[i].taskExecutions.stopped],
                        ['Running', response.result[i].taskExecutions.running],
                        ['Completed', response.result[i].taskExecutions.completed]
                    ]
                })
            }
            dashboardCtrl.tasksPerBE = {
                chart: {
                    type: 'pie'
                },
                title: {
                    text: 'Task Per BE'
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}: {point.y}'
                        }
                    },
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    }
                },
                series: [{
                    name: 'Active Tasks',
                    colorByPoint: true,
                    data: businessEntitiesData
                }],
                drilldown : {
                    series: businessEntitiesDrillDownData
                }
            }
        });
    };



    dashboardCtrl.getNumProcessedEntities = function(){
        TDMService.getNumProcessedCopiedFailedEntities(dashboardCtrl.chosenInterval).then(function(response){
            dashboardCtrl.processedEntities = response.result.processedentites;
            dashboardCtrl.copiedEntities = response.result.copiedentites;
            dashboardCtrl.failedEntities = response.result.failedentities;
        });
    };


    dashboardCtrl.getNumCopiedFailedEntitiesPerLU = function(){
        TDMService.getNumCopiedFailedEntitiesPerLU(dashboardCtrl.chosenInterval).then(function(response){
            dashboardCtrl.copiedEntitiesPerLU = _.map(response.result,function(lu){
               return {
                   name : lu.lu_name,
                   y : lu.total_num_of_copied_entities != null ? parseInt(lu.total_num_of_copied_entities) : 0
               }
            });
            dashboardCtrl.failedEntitiesPerLU = _.map(response.result,function(lu){
                return {
                    name : lu.lu_name,
                    y : lu.total_num_of_failed_entities != null ? parseInt(lu.total_num_of_failed_entities) : 0
                }
            });
            dashboardCtrl.copiedEntitiesPerLUChart = {
                chart: {
                    type: 'pie'
                },
                title: {
                    text: 'Copied Entities Per Logical Unit'
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}: {point.y}'
                        }
                    },
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    }
                },
                series: [{
                    name: 'Copied',
                    colorByPoint: true,
                    data: dashboardCtrl.copiedEntitiesPerLU
                }]
            };

            dashboardCtrl.failedEntitiesPerLUChart = {
                chart: {
                    type: 'pie'
                },
                title: {
                    text: 'Failed Entities Per Logical Unit'
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}: {point.y}'
                        }
                    },
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    }
                },
                series: [{
                    name: 'Failed',
                    colorByPoint: true,
                    data: dashboardCtrl.failedEntitiesPerLU
                }]
            }
        });
    };


    dashboardCtrl.getActivities = function(firstTime){
        TDMService.getActivities(dashboardCtrl.chosenInterval).then(function (response) {
            if (response.errorCode != 'SUCCESS') {
                //TODO show Error
                return;
            }
            dashboardCtrl.activityData = response.result;
            if (firstTime == false){
                dashboardCtrl.dtInstance.reloadData(function(data){},true);
                return;
            }
            dashboardCtrl.dtInstance = {};
            dashboardCtrl.dtColumns = [];
            dashboardCtrl.dtColumnDefs = [];
            dashboardCtrl.headers = [
                {
                    column: 'date',
                    name: 'Date',
                    clickAble: false,
                    type : 'date'
                },
                {
                    column: 'action',
                    name: 'Action',
                    clickAble: false
                },
                {
                    column: 'entity',
                    name: 'Entity',
                    clickAble: false
                },
                {
                    column: 'username',
                    name: 'Username',
                    clickAble: false
                },
                {
                    column: 'description',
                    name: 'Description',
                    clickAble: false
                }
            ];

            var changeToLocalDate = function(data, type, full, meta){
                if (data)
                    return moment(data).format('DD MMM YYYY, HH:mm');
                return '';
            };

            for (var i = 0; i < dashboardCtrl.headers.length; i++) {
                if (dashboardCtrl.headers[i].type == 'date'){
                    dashboardCtrl.dtColumns.push(DTColumnBuilder.newColumn(dashboardCtrl.headers[i].column).withTitle(dashboardCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else{
                    dashboardCtrl.dtColumns.push(DTColumnBuilder.newColumn(dashboardCtrl.headers[i].column).withTitle(dashboardCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(dashboardCtrl.activityData);
                return deferred.promise;
            };

            dashboardCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [0, 'desc'])
                .withButtons([
                ])
                .withOption("caseInsensitive",true)
                .withOption('search',{
                    "caseInsensitive": false
                })
                .withLightColumnFilter({
                    0 : {
                        type: 'text'
                    },
                    1 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(dashboardCtrl.activityData, 'action')),function(el){
                            return {value : el,label :el}
                        })
                    },
                    2 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(dashboardCtrl.activityData, 'entity')),function(el){
                            return {value : el,label :el}
                        })
                    },
                    3 : {
                        type: 'select',
                        values: _.map(_.unique(_.map(dashboardCtrl.activityData, 'username')),function(el){
                            return {value : el,label :el}
                        })
                    },
                    4 : {
                        type: 'text'
                    }
                });

            dashboardCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(dashboardCtrl.dtInstance)) {
                    dashboardCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(dashboardCtrl.dtInstance)) {
                    dashboardCtrl.dtInstance = dtInstance;
                }
            };
            if (dashboardCtrl.dtInstance.changeData != null)
                dashboardCtrl.dtInstance.changeData(getTableData());

            dashboardCtrl.loadingTable = false;
        });
    };

    dashboardCtrl.init();
}

angular
    .module('TDM-FE')
    .controller('dashboardCtrl', dashboardCtrl)
    .directive('hcChart', function ($timeout) {
        return {
            restrict: 'E',
            template: '<div style="width: {{width}}" class="chart-container"><div></div></div>',
            replace: true,
            scope: {
                options: '='
            },
            link: function (scope, element) {

                scope.$watch(function () { return scope.options; }, function () {

                    if (!scope.options) return;
                    scope.chart = new Highcharts.chart(element[0], scope.options);
                    scope.width = element.width();
                    $(window).resize(function () {
                        scope.width = element.width();
                        //var chart = new Highcharts.chart(element[0], scope.options);
                        $timeout(function(){
                            scope.chart.reflow();
                        },100)
                    });
                });
            }
        };
    });