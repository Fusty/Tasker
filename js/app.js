Tasker.interpretTime = function(input) {
    input = input.trim();
    if(input == "")
        return "";
    var hourMinuteRE = /^(\d+)\s*(hours|hour|h)\s*(\d+)\s*(minutes|minute|mins|min|m)$/;
    var hourRE = /^(\d+)\s*(hours|hour|h)$/;
    var minuteRE = /^(\d+)\s*(minutes|minute|min|m)$/;
    // Test for Regex that matches something.  In decreasing specificity
    var hours = undefined;
    var minutes = undefined;

    if(hourMinuteRE.test(input)) {
        hours = Number(input.replace(hourMinuteRE, "$1"));
        minutes = Number(input.replace(hourMinuteRE, "$3"));
    }else if(hourRE.test(input)) {
        hours = Number(input.replace(hourRE, "$1"));
    }else if(minuteRE.test(input)) {
        minutes = Number(input.replace(minuteRE, "$1"));
    }

    if(typeof hours == "undefined" && typeof minutes == "undefined" && input != "") {
        return "INVALID FORMAT";
    }

    var timeObject = {};

    if(hours)
        timeObject.hours = hours;

    if(minutes)
        timeObject.minutes = minutes;

    return Tasker.normalizeTimeObject(timeObject);
};

Tasker.normalizeTimeObject = function(timeObject) {
    var hours = 0;
    var minutes = 0;
    var seconds = 0;

    if("seconds" in timeObject) {
        seconds += timeObject.seconds%60;
        minutes += Math.floor(timeObject.seconds/60);
    }

    if("minutes" in timeObject) {
        console.log("Minutes to add", timeObject.minutes, timeObject.minutes%60);
        minutes += timeObject.minutes%60;
        console.log("Hours to add", timeObject.minutes, timeObject.minutes/60);
        hours += Math.floor(timeObject.minutes/60);
    }
    
    if("hours" in timeObject) {
        hours += timeObject.hours;
    }

    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
};

// Main vue instance
Tasker.vue = new Vue({
    el: "#app",
    data: function(){return {
        // tasks: [],
        headerInput: "",
        // taskStack: new TaskStack(),
        autoSaveEnabled: true,
        history: [],
        timeTestInput: "",
    };},
    store,
    beforeMount: function(){
        this.loadFromStorage();
        setInterval(this.autoSave, 2000);
    },
    mounted: function() {
        this.initGoogle();
    },
    methods: {
        initGoogle: function() {
            var vm = this;
            setTimeout(function(){
                try {
                    GoogleSheets.initClient();
                } catch (exception) {
                    vm.initGoogle();
                }
            },100);
        },
        handleAuthClick: function(event) {
            GoogleSheets.handleAuthClick(event);
        },
        handleSignoutClick: function(event) {
            GoogleSheets.handleSignoutClick(event);
        },
        historyEvent: function(item) {
            if(item.type.startsWith("undo")) {
                if(item.type.startsWith("undo.task")) {
                    if(item.type.startsthisWith("undo.task.delete")) {
                        this.undoTaskDelete(item.task);
                    }
                }
            }
        },
        undoTaskDelete: function(task) {
            alert("Implement me");
        },
        exportData: function() {
            console.log(JSON.stringify(this.$data));
        },
        search: function() {
        },
        addTask: function() {
            if(this.headerInput != "") {
                store.commit("NEWTASK", {title: this.headerInput});
                this.headerInput = "";
            }
        },
        deleteTask: function(task) {
            store.dispatch("DELETETASK", task);
            this.clearTaskFromStack(task);
        },
        focusTask: function(task) {
            this.taskStack.push(task);
        },
        specificClickTask: function(task) {
            this.taskStack.push(task);
        },
        clearTaskFromStack: function(task) {
            this.taskStack.pop(task);
        },
        clearStack: function() {
            while(this.taskStack.tasks.length > 0) {
                this.taskStack.pop();
            }
        },
        loadFromStorage: function() {
            store.dispatch("LOAD");
        },
        autoSave: function() {
            this.saveToStorage();
        },
        saveToStorage: function() {
            store.dispatch("SAVE");
        }
    },
    computed: {
        hasIncompleteChildren: function() {
            return Tasker.hasIncompleteChildrenRecursive(this.tasks);
        },
        hasCompleteChildren: function() {
            return Tasker.hasCompleteChildrenRecursive(this.tasks);
        },
        tasks: function() {
            return store.getters.taskTree;
        },
        topLevelTasks: function() {
            return store.getters.topLevelTasks;
        },
        taskStack: function() {
            return store.state.taskStack;
        },
        timeTestOutput: function() {
            return Tasker.interpretTime(this.timeTestInput);
        }
    }
});