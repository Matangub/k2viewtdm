function tasksCtrl ($scope,BreadCrumbsService,$timeout){
    var tasksCtrl = this;
    tasksCtrl.pageDisplay = 'tasksTable';

    tasksCtrl.openTasks = function(){
        tasksCtrl.tasksData = {
            openTask : tasksCtrl.openTask,
            openNewTask : tasksCtrl.openNewTask,
            openTaskHistory : tasksCtrl.openTaskHistory
        };
        tasksCtrl.pageDisplay = 'tasksTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    tasksCtrl.openTask = function(task){
        tasksCtrl.taskData = {
            mode : "update",
            task : task,
            openTasks : tasksCtrl.openTasks

        };
        tasksCtrl.pageDisplay = 'task';
    };

    tasksCtrl.openTaskHistory = function(task){
        tasksCtrl.taskData = {
            task : task,
            openTasks : tasksCtrl.openTasks

        };
        tasksCtrl.pageDisplay = 'taskHistory';
    };

    tasksCtrl.openNewTask = function(tasks){
        tasksCtrl.taskData = {
            mode : "create",
            task : {},
            openTasks : tasksCtrl.openTasks,
            tasks : tasks
        };
        tasksCtrl.pageDisplay = 'newTask';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'TASKS',function(){
        tasksCtrl.openTasks();
    });

    $scope.$on('refreshPage',function(){
        var pageDisplay = tasksCtrl.pageDisplay;
        tasksCtrl.pageDisplay = 'none';
        $timeout(function(){
            tasksCtrl.pageDisplay = pageDisplay;
        },100);
    });

    tasksCtrl.tasksData = {
        openTask : tasksCtrl.openTask,
        openNewTask : tasksCtrl.openNewTask,
        openTaskHistory : tasksCtrl.openTaskHistory
    };
    tasksCtrl.pageDisplay = 'tasksTable';

}

angular
    .module('TDM-FE')
    .controller('tasksCtrl' , tasksCtrl);