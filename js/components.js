if(typeof Tasker == "undefined") {
    Tasker = {};
}

Tasker.autosize = Vue.directive("autosize", {
    bind: function(el, binding) {
        var tagName = el.tagName;
        setTimeout(function(){
            if (tagName == "TEXTAREA") {
                autosize(el);
            }
        },10);
    },
    
    componentUpdated: function(el, binding, vnode) {
        var tagName = el.tagName;
        if (tagName == "TEXTAREA") {
            autosize.update(el);
        }
    },
    
    unbind: function(el) {
        autosize.destroy(el);
    }
});

Tasker.dateFilter = Vue.filter("date", function(value, format){
    return Tasker.msToDate(value, format);
});

Tasker.truncate = Vue.filter("truncate", function(value, length, append){
    if(value.length < length) {
        return value.trim();
    }else {
        if(typeof append == "undefined")
            append = "";
        // Find first index of whitespace before length limit
        var negativeIndex = value.substring(0,length).split("").reverse().join("").search(/\s/);
        var index = value.substring(0,length).length - (negativeIndex > 0 ? negativeIndex : 0);
        return value.substring(0,length).substring(0, index).trim() + append;
    }
});

Tasker.taskCard = Vue.component("task-card", {
    template: "#task-card",
    props: ["task", "tasks"],
    data: function(){return {
        showDelete: false,
        newTaskTitle: "",
        tab: "details",
    };},
    methods: {
        setTab: function(tab) {
            this.tab = tab;
        },
        completeTask: function() {
            this.task.completed = new Date().getTime();
        },
        unCompleteTask: function() {
            this.task.completed = null;
        },
        addTask: function(){
            if(this.newTaskTitle.length > 0) {
                store.commit("NEWTASK", {title: this.newTaskTitle, parentTask: this.task});
                this.newTaskTitle = "";
            }
        },
        clearTaskFromStack: function() {
            this.$emit("clear-task-from-stack", this.task);
        },
        deleteTask: function() {
            this.showDelete = true;
        },
        deleteTaskCancel: function(){
            this.showDelete = false;
        },
        deleteTaskConfirm: function() {
            this.$emit("delete-task", this.task);
            this.showDelete = false;
        },
        toggleTimes: function() {
            this.showingTimes = !this.showingTimes;
        }
    },
    computed: {
        breadCrumbs: function() {
            if(this.taskPath.length > 1)
                return Tasker.taskPath(this.task, this.tasks).map(task => task.title).join(" -> ");
            return "";
        },
        taskPath: function() {
            return Tasker.taskPath(this.task, this.tasks);
        }
    }
});

Tasker.poptart = Vue.component("poptart", {
    template: "#poptart",
    props: {
        history: Array
    },
    data: function(){return {
        hasUnexpired: false
    };},
    mounted: function() {
        setInterval(this.checkExpired, 1000);
    },
    methods: {
        checkExpired: function(){
            var hasUnexpired = false;
            for(var index = 0; index < this.history.length; ++index) {
                if(this.isExpired(this.history[index])) {
                    this.history.splice(index, 1);
                }else {
                    hasUnexpired = true;
                }
            }
            
            this.hasUnexpired = hasUnexpired;
        },
        isExpired: function(item) {
            if(new Date().getTime() - item.time > 10000 ) {
                return true;
            }
            return false;
        },
        historyEvent: function(item) {
            this.$emit("history-event", item);task-card-timing;
            this.removeItem(item);
        },
        removeItem: function(item) {
            for(var index = 0; index < this.history.length; ++index) {
                if(item === this.history[index]) {
                    this.history.splice(index, 1);
                }
            }
        },
        message: function(item) {
            if(item.type.startsWith("undo")) {
                if(item.type.startsWith("undo.task")) {
                    if(item.type.startsWith("undo.task.delete")) {
                        return "Task '" +
                        this.$options.filters.truncate(item.task.title, 20) +
                        "' was deleted";
                    }
                }
            }
        },
        itemClass: function(item) {
            if(item.type.startsWith("undo")) {
                return ["light1", "outline"];
            }
        },
        buttonText: function(item) {
            if(item.type.startsWith("undo")) {
                return "undo";
            }
        }
    }
});

Tasker.msToDate = function(value, format) {
    if(typeof format == "undefined") {
        format = "YYYY-MM-DD hh:mm";
    }
    return moment.unix(value/1000).format(format);
};

Tasker.msToHoursOrMinutes = function(time) {
    if(time/1000/60/60 > 0.25) {
        // Return hours
        var hours = time/1000/60/60;
        return (Math.round(hours * 100) / 100) + " h";
    }else {
        // Return minutes
        var minutes = time/1000/60;
        return (Math.ceil(minutes * 100) / 100) + " m";
    }
};

Tasker.taskList = Vue.component("task-list", {
    template: "#task-list",
    props: {
        tasks: Array,
        parentTask: Object,
        showChildren: Boolean,
        isListRoot: {
            type: Boolean,
            default: false
        },
        conditional: {
            type: String,
            default: "showAll"
        }
    },
    store,
    data: function(){return {
        newTaskTitle: ""
    };},
    methods: {
        dragChange: function(event) {
            if("added" in event) {
                if(this.parentTask) {
                    store.dispatch("SETPARENT", {
                        parent: this.parentTask.id,
                        child: event.added.element.id,
                        newIndex: event.added.newIndex
                    });
                }else {
                    store.dispatch("SETPARENT", {
                        parent: undefined,
                        child: event.added.element.id,
                        newIndex: event.added.newIndex
                    });
                }
            }else if("moved" in event) {
                store.dispatch("REORDER", {
                    tasks: this.tasks,
                    id: event.moved.element.id,
                    isListRoot: this.isListRoot,
                    newIndex: event.moved.newIndex,
                    oldIndex: event.moved.oldIndex,
                });
            }
        },
        addTask: function(parentTask) {
            if(this.newTaskTitle.length > 0) {
                store.commit("NEWTASK", {title: this.newTaskTitle, parentTask: parentTask});
                this.newTaskTitle = "";
            }
        },
        isComplete: function(task) {
            return Tasker.isComplete(task);
        },
        hasIncompleteChildren: function(task) {
            return Tasker.hasIncompleteChildren(task);
        },
        conditionalResult: function(task) {
            if(this.conditional == "showAll") {
                return true;
            }else if(this.conditional == "showCompletes") {
                return Tasker.isComplete(task) && !Tasker.hasIncompleteChildren(task);
            }else if(this.conditional == "showIncompletes") {
                return !Tasker.isComplete(task) || Tasker.hasIncompleteChildren(task);
            }
        }
    },
    computed: {
        dragZone: function() {
            if(this.tasks.length == 0) {
                return ["drag-zone"];
            }else {
                return [];
            }
        },
        inflate: function() {
            if(this.tasks.length == 0) {
                return {"inflate": true};
            }else {
                return {"inflate": false};
            }
        },
        listHasIncompleteChildren: function() {
            return Tasker.hasIncompleteChildrenRecursive(this.tasks);
        }
        
    }
});

Tasker.taskListItem = Vue.component("task-list-item", {
    template: "#task-list-item",
    props: {
        task: {
            type: Object
        },
        taskCardHeading: {
            type: Boolean,
            default: false
        }
    },
    store,
    data: function(){return {
        showChildren: false,
        currentTime: new Date().getTime(),
        stopwatch: ""
    };},
    mounted: function(){
        // Repeat every second
        setInterval(this.updateTime,1000);
    },
    methods: {
        toggleChildren: function() {
            this.showChildren = !this.showChildren;
        },
        focusTask: function() {
            this.$emit("click-task", this.task);
        },
        specificClickTask: function() {
            this.$emit("specific-click-task", this.task);
        },
        updateTime: function() {
            this.currentTime = new Date().getTime();
            if(Tasker.hasActiveTimer(this.task)) {
                this.stopwatch = Tasker.stopwatch(this.task.times[0], this.currentTime).join(":");
                this.totalTime = Tasker.totalTime(this.task.times[0]);
            }else {
                this.stopwatch = "00:00:00";
            }
        }
    },
    computed: {
        subTasks: function() {
            return store.getters.subTasks(this.task.id);
        },
        timerTitle: function() {
            if(this.task.times.length == 0) {
                return "";
            }else {
                return this.task.times[0].title;
            }
        },
        hasActiveTimer: function() {
            return Tasker.hasActiveTimer(this.task);
        },
        hasActiveTimerChildren: function() {
            return Tasker.hasActiveTimerChildren(this.task);
        },
        isComplete: function() {
            return Tasker.isComplete(this.task);
        },
        hasIncompleteChildren: function() {
            return Tasker.hasIncompleteChildren(this.task);
        }
    }
});

Tasker.taskCardTiming = Vue.component("task-card-timing", {
    template: "#task-card-timing",
    props: ["times", "task", "breadCrumbs"],
    data: function(){return {
        currentPageSize: 5,
        showNestedTimes: false,
        showTimeEditor: true,
        editingTime: undefined,
    };},
    store,
    methods: {
        showMore: function() {
            this.currentPageSize += 5;
        },
        timesAsDays: function(times) {
            // Sort times by day into a new array
            var days = [];
            
            times.forEach(time => {
                var existingDay = days.find(day => Tasker.msToDate(time.begin, "ddd, DD MMM") == day.date);
                if(existingDay) {
                    existingDay.times.push(time);
                }else {
                    days.push({
                        date: Tasker.msToDate(time.begin, "ddd, DD MMM"),
                        times: [time]
                    });
                }
            });
            return days;
        },
        totalTime: function(inTimes) {
            // Breadcrumbs or Non Breadcrumbs
            if(inTimes.length > 0) {
                if("breadcrumb" in inTimes[0]) {
                    var times = [];
                    inTimes.forEach(breadcrumb => {
                        if(Array.isArray(breadcrumb)) {
                            breadcrumb.forEach(crumb => {
                                times = times.concat(crumb.times);
                            });
                        }else {
                            times = times.concat(breadcrumb.times);
                        }
                    });
                }else {
                    var times = inTimes;
                }
                var time = times.reduce((accumulator, time) => {if(time && time.end) {return accumulator + (time.end - time.begin);}else{return accumulator + 0;}}, 0);
                return Tasker.msToHoursOrMinutes(time);
            }
        },
        hourSpan: function(time) {
            var begin = Tasker.msToDate(time.begin, "h:mm A");
            var end = time.end ? Tasker.msToDate(time.end, "h:mm A") : "?";
            return begin + " - " + end;
        },
        elapsed: function(time) {
            if(time.end) {
                return Tasker.msToHoursOrMinutes(time.end - time.begin);
            }else {
                return "In Progress";
            }
        },
        openNestedTimeReport: function() {
            this.showNestedTimes = true;
        },
        closeNestedTimeReport: function() {
            this.showNestedTimes = false;            
        },
        openTimeEditor: function(time) {
            this.editingTime = time;
            this.showTimeEditor = true;
        },
        closeTimeEditor: function() {
            this.showTimeEditor = false;
        },
    },
    computed: {
        nestedTimes: function() {
            // Array of days, array of breadcrumbs, array of times
            return store.getters.nestedTimes(this.task.id);
        }
    }
});

Tasker.taskCardTimer = Vue.component("task-card-timer", {
    template: "#task-card-timer",
    props: ["times"],
    data: function(){return {
        timerTitle: "",
        currentTime: new Date().getTime(),
        stopwatch: "",
        totalTime: "",
        inlineData: {time: ""}
    };},
    mounted: function(){
        // Repeat every second
        setInterval(this.updateTime,1000);
    },
    watch: {
        inlineData: function() {
            console.log("Data changed!!", this.inlineData);
        }
    },
    methods: {
        startTimer: function() {
            this.times.unshift(new Time(this.timerTitle));
        },
        stopTimer: function() {
            this.times[0].end = new Date().getTime();
        },
        updateTime: function() {
            this.currentTime = new Date().getTime();
            if(this.isTiming) {
                this.stopwatch = Tasker.stopwatch(this.times[0], this.currentTime).join(":");
                this.totalTime = Tasker.totalTime(this.times[0]);
            }else {
                this.stopwatch = "00:00:00";
            }
        },
        continuePrevious: function() {
            this.times.unshift(new Time(this.times[0].title));
        },
        updateTempTime: function(time) {
            console.log("Updating", time);
            this.inlineData.time = time;
        },
        saveTime: function(time) {
            var interp = Tasker.interpretTime(time);
            console.log("New duration", interp);
            if(typeof interp == "object") {
                this.times[0].begin = new Date().getTime() - ((interp.hours*60*60*1000) + (interp.minutes*60*1000) + (interp.seconds*1000));
            }
        }
    },
    computed: {
        isTiming: function() {
            if(this.times.length > 0) {
                if(this.times[0].end == null) {
                    return true;
                }
            }
            return false;
        }
    }
});

Tasker.inlineEditable = Vue.component("inline-editable", {
    template: "#inline-editable",
    props: ["preText", "postText", "fieldType", "fieldClasses", "dataFieldName", "data", "fieldSize", "showValue"],
    data: function(){return {
        editing: false,
        oldValue: "",
    };},
    methods: {
        startEditing: function() {
            this.editing = true;
            this.oldValue = this.value;
        },
        stopEditing: function() {
            this.editing = false;
            this.$emit("saveValue", this.value);
            this.oldValue = "";
        },
        revertEditing: function() {
            this.editing = false;
            this.$emit("revertValue", this.oldValue);
            if(this.oldValue != "")
                this.value = this.oldValue;
        }
    },
    computed: {
        value: {
            get: function() {
                var subMap = null;
                var path = this.dataFieldName.split(".");

                path.forEach(segment => {
                    subMap = this.data[segment];
                });

                if(subMap == null)
                    subMap = this.data;

                return subMap;                
            },
            set: function(value) {
                var subMap = null;
                var path = this.dataFieldName.split(".");

                for(var index = 0; index < path.length; ++index) {
                    subMap = this.data[path[index]];
                }

                if(subMap == null)
                    subMap = this.data;


                subMap[path[path.length -1]] = value;
                this.$emit("updateValue", value);
            }
        }
    }
});