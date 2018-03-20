if(typeof Tasker == "undefined") {
    Tasker = {};
}

Tasker.getId = function() {
    return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
};

Tasker.stopwatch = function(time, currentTime) {
    var end = time.end ? time.end : (currentTime ? currentTime : new Date().getTime());
    var diff = end - time.begin;
    var hours = Math.floor(diff/1000/60/60);
    var minutes = Math.floor(diff/1000/60)%60;
    var seconds = Math.floor(diff/1000)%60;
    return [hours, minutes.pad(2), seconds.pad(2)];
};

Tasker.totalTime = function(time) {
    if(time.end) {
        var diff = time.end - time.begin;
        return Tasker.msToTimeArray(diff);
    }else {
        return "Timer still running . . .";
    }
};

Tasker.msToTimeArray = function(value) {
    var hours = Math.floor(value/1000/60/60);
    var minutes = Math.floor(value/1000/60)%60;
    var seconds = Math.floor(value/1000)%60;
    return [hours, minutes.pad(2), seconds.pad(2)];
};

Tasker.hasActiveTimer = function(task) {
    return (task.times.length > 0 && !task.times[0].end);
};

Tasker.hasActiveTimerChildren = function(task) {
    return Tasker.hasActiveTimerChildrenRecursive(task.tasks);
};

Tasker.hasActiveTimerChildrenRecursive = function(tasks) {
    for(var index = 0; index < tasks.length; ++index) {
        if(Tasker.hasActiveTimer(tasks[index]) || Tasker.hasActiveTimerChildren(tasks[index]))
            return true;
    }
    return false;
};

Tasker.isComplete = function(task) {
    return (task.completed);
};

Tasker.hasIncompleteChildren = function(task) {
    return Tasker.hasIncompleteChildrenRecursive(task.tasks);
};

Tasker.hasIncompleteChildrenRecursive = function(tasks) {
    for(var index = 0; index < tasks.length; ++index) {
        if(!Tasker.isComplete(tasks[index]) || Tasker.hasIncompleteChildren(tasks[index]))
            return true;
    }
    return false;
};

Tasker.hasCompleteChildren = function(task) {
    return Tasker.hasCompleteChildrenRecursive(task.tasks);
};

Tasker.hasCompleteChildrenRecursive = function(tasks) {
    for(var index = 0; index < tasks.length; ++index) {
        if(!Tasker.isComplete(tasks[index]) || !Tasker.hasCompleteChildren(tasks[index]))
            return false;
    }
    return true;
};

Tasker.searchTask = function(task) {
    if(!Tasker.registry.searchInput || Tasker.registry.searchInput == "")
        return true;
    if((task && task.title && task.title.toLowerCase().includes(Tasker.registry.searchInput.toLowerCase()) 
    || (task && task.description && task.description.toLowerCase().includes(Tasker.registry.searchInput.toLowerCase()))))
        return true;
    
    return false;
};

Tasker.cloneTask = function(task) {
    return new Task(task.title,  task.description, Tasker.cloneTimes(task.times), task.created, task.due, task.deleted, task.completed, task.id);
};

Tasker.cloneTasks = function(tasks) {
    if(tasks == []) {
        return [];
    }
    
    var clonedTasks = [];
    for(var index = 0; index < tasks.length; ++index) {
        clonedTasks.push(Tasker.cloneTask(tasks[index]));
    }
    return clonedTasks;
};

Tasker.cloneTime = function(time) {
    return new Time(time.title, time.begin, time.end);
};

Tasker.cloneTimes = function(times) {
    if(times == []) {
        return [];
    }
    
    var clonedTimes = [];
    for(var index = 0; index < times.length; ++index) {
        clonedTimes.push(Tasker.cloneTime(times[index]));
    }
    return clonedTimes;
};

Tasker.taskPath = function(task, tasks) {
    var path = [];
    for(var index = 0; index < tasks.length; ++index) {
        if(task.id == tasks[index].id) {
            return [tasks[index]];
        }else {
            var returnedPath = Tasker.taskPath(task, tasks[index].tasks);
            if(returnedPath.length > 0) {
                path.push(tasks[index]);
                return path.concat(returnedPath);
            }
        }
    }
    return path;
};

Tasker.stringToSeconds = function(input) {
    input = input.trim();
    var hhmmss = /^\d{1,2}:\d{1,2}:\d{1,2}$/;
    var hhmm = /^\d{1,2}:\d{1,2}$/;
    var numHourNumMinute = /^(\d+)\s?(hours|hour|h)\s?(\d+)\s?(minutes|minute|mins|min|m)/;
    var numHour = "";
    var numMinute = "";
};

Tasker.hoursMinutesSecondsFromSeconds = function(seconds) {
    var hours = Math.floor(seconds/60/60);
    var minutes = Math.floor((seconds - hours*60*60)/60);
    seconds = seconds - (minutes*60);
    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds,
    };
};

Tasker.timeArrayToString = function(timeArray) {
    console.log(timeArray);
    var string = "";
    if(timeArray.hours > 0) {
        string += timeArray.hours + "h ";
    }
    if(timeArray.minutes > 0) {
        string += timeArray.minutes + "m ";
    }
    if(timeArray.seconds > 0) {
        string += timeArray.seconds + "s ";
    }
    return string;
};

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

Time = function(title, begin, end, id) {
    if(typeof title == "undefined" || title == "") {
        this.title = "New time log entry . . .";
    }else {
        this.title = title;
    }
    
    if(typeof begin == "undefined") {
        this.begin = new Date().getTime();
    }else {
        this.begin = begin;
    }
    
    if(typeof end == "undefined") {
        this.end = null;
    }else {
        this.end = end;
    }
    
    if(typeof id == "undefined" || id == null) {
        this.id = Tasker.getId();
    }else {
        this.id = id;
    }
    
    this.elapsed = function() {
        if(this.end)
            return Tasker.timeArrayToString(Tasker.hoursMinutesSecondsFromSeconds(this.end - this.begin));

        return '';
    };
};

Tasker.timesFromObjectArray = function(times) {
    var realTimes = [];
    times.forEach(function(timeObject) {
        realTimes.push(new Time(
            timeObject.title,
            timeObject.begin,
            timeObject.end,
            timeObject.id
        ));
    });
    return realTimes;
};

Task = function(title, description, times, created, due, deleted, completed, id, sort) {
    // Tasks have:
    // title - string
    // description - string - markdown
    // tasks - array of Task objects
    
    // Set defaults or import existing
    if(typeof title == "undefined" || title == "") {
        this.title = "";
    }else {
        this.title = title;
    }
    
    if(typeof description == "undefined" || description == "") {
        this.description = "";
    }else {
        this.description = description;
    }
        
    if(typeof times == "undefined" || times.length == 0) {
        this.times = [];
    }else {
        this.times = Tasker.timesFromObjectArray(times);
    }
    
    if(typeof created == "undefined" || created == null) {
        this.created = new Date().getTime();
    }else {
        this.created = created;
    }
    
    if(typeof due == "undefined" || due == null) {
        this.due = null;
    }else {
        this.due = due;
    }
    
    if(typeof deleted == "undefined" || deleted == null) {
        this.deleted = null;
    }else {
        this.deleted = deleted;
    }
    
    if(typeof completed == "undefined" || completed == null) {
        this.completed = null;
    }else {
        this.completed = completed;
    }
    
    if(typeof id == "undefined" || id == null) {
        this.id = Tasker.getId();
    }else {
        this.id = id;
    }
    
    if(typeof sort == "undefined") {
        this.sort = 999999;
    }else {
        this.sort = sort;
    }
    
    this.hasActiveTimer = function() {
        Tasker.hasActiveTimer(this);
    };
    
    this.hasActiveTimerChildren = function() {
        Tasker.hasActiveTimer(this);
    };
    
};

Tasker.tasksFromObjectArray = function(tasks) {
    var realTasks = [];
    tasks.forEach(function(taskObject) {
        realTasks.push(new Task(
            taskObject.title,
            taskObject.description,
            taskObject.times,
            taskObject.created,
            taskObject.due,
            taskObject.deleted,
            taskObject.completed,
            taskObject.id,
            taskObject.sort
        ));
    });
    return realTasks;
};

Tasker.idListFromTree = function(getters, tasks) {
    var ids = [];
    for(var index = 0; index < tasks.length; ++index) {
        if(tasks[index]) {
            var subTasks = getters.subTasks(tasks[index].id);
            if(subTasks.length > 0) {
                var idsToAdd = Tasker.idListFromTree(getters, subTasks);
                idsToAdd.push(tasks[index].id);
            }else {
                var idsToAdd = [tasks[index].id];
                
            }
            ids = ids.concat(idsToAdd);
        }
    }
    return ids;
};

TaskStack = function(tasks) {
    if(typeof tasks != "undefined") {
        this.tasks = tasks;
        this.tasks.sort((a, b) => a.sort > b.sort);
    }else {
        this.tasks = [];		
    }
    
    this.push = function(task) {Array[1];
        if(this.tasks.indexOf(task) > -1)
            this.tasks.splice(this.tasks.indexOf(task), 1);
        this.tasks.unshift(task);
    };
    
    this.pop = function(task) {
        var index = 0;
        if(typeof task != "undefined") {
            index = this.tasks.indexOf(task);
        }
        return this.tasks.splice(index, 1);
    };
};

const store = new Vuex.Store({
    state: {
        tasks: [],
        taskRelationships: [],
        taskStack: new TaskStack(),
    },
    getters: {
        topLevelTasks: state => {
            // Get top level tasks (tasks with no child entry)
            return state.tasks.filter(task => {
                return typeof state.taskRelationships.find(relationship => {
                    return relationship.child == task.id;
                }) == "undefined" ;
            }).sort((a, b) => a.sort > b.sort);
        },
        subTasks: (state) => (id) => {
            var tasks = [];
            state.taskRelationships.filter(relationship => relationship.parent == id).forEach(relationship => {
                var subTask = state.tasks.find(task => relationship.child == task.id);
                tasks.push(subTask);
            });
            return tasks.sort((a, b) => a.sort > b.sort);
        },
        nonOrphans: (state, getters) => {
            return Tasker.idListFromTree(getters, getters.taskTree);
        },
        // Main task-tree generation
        taskTree: (state, getters) => {
            var topLevelTasks = getters.topLevelTasks;
            // Now recursively add all the children
            var populateChildren = function(task) {
                task.tasks = [];
                if(!task)
                    return;

                state.taskRelationships.filter(relationship => relationship.parent == task.id).forEach(relationship => {
                    var subTask = state.tasks.find(task => relationship.child == task.id);
                    
                    if(!subTask)
                        return;
                    
                    // Depth first
                    populateChildren(subTask);
                    
                    // Add self to task parent task list
                    task.tasks.push(subTask);
                });

                // Sort based on sort field
                task.tasks.sort((a, b) => {
                    return a.sort > b.sort;
                });
                
                // Normalize
                for(var index = 0; index < task.tasks.length; ++index) {
                    task.tasks[index].sort = index;
                }

            };
            
            // Sort based on sort field
            topLevelTasks.sort((a, b) => {
                return a.sort > b.sort;
            });

            // Normalize
            for(var index = 0; index < topLevelTasks.length; ++index) {
                topLevelTasks[index].sort = index;
            }
            
            topLevelTasks.forEach(task => populateChildren(task));
            return topLevelTasks;
        },
        dataToSave: state => {
            var data = {
                tasks: state.tasks,
                taskRelationships: state.taskRelationships,
                taskStack: state.taskStack,
            };
            return data;
        },
        nestedTimes: (state) => (id) => {
            var task = state.tasks.find(task => task.id == id);

            var days = [];

            if(!task) {
                return [];
            }

            var masterTasks = [task];

            var populateChildren = function(tasks) {
                // Get nested times for these tasks
                tasks.forEach(task => {
                    task.times.forEach(time => {
                        var breadcrumb = Tasker.taskPath(task, masterTasks).map(task => task.title).join(" -> ");
                        pushDay(time, breadcrumb);
                        if(task.tasks.length > 0) {
                            populateChildren(task.tasks);
                        }
                    });
                });                
            };

            var pushDay = function(time, breadcrumb) {
                var existingDay = days.find(day => Tasker.msToDate(time.begin, "ddd, DD MMM") == day.date);
                if(existingDay) {
                    pushBreadcrumb(time, breadcrumb, existingDay);
                }else {
                    days.push({                         
                        date: Tasker.msToDate(time.begin, "ddd, DD MMM"),
                        breadcrumbs: [
                            {
                                breadcrumb: breadcrumb,
                                times: [time]
                            }
                        ]
                    });
                }
            };

            var pushBreadcrumb = function(time, breadcrumb, day) {
                var existingBreadcrumb = day.breadcrumbs.find(crumb => crumb.breadcrumb == breadcrumb);
                if(existingBreadcrumb) {
                    if(!existingBreadcrumb.times.find(thisTime => time.id == thisTime.id)) {
                        existingBreadcrumb.times.push(time);
                    }
                }else {
                    day.breadcrumbs.push(
                        {
                            breadcrumb: breadcrumb,
                            times: [time]
                        });
                }
            };

            populateChildren(masterTasks);
            return days;
        }
    },
    actions: {
        LOAD: (context) => {
            try {
                var data = JSON.parse(localStorage.getItem("tasker"));
            }catch(exception){
                // Do nothing
            }

            if(!data)
                return;
                
            if(data.tasks) {
                // Set tasks, build new task objects
                context.state.tasks = Tasker.tasksFromObjectArray(data.tasks.filter(task => !(!task)));
            }
            
            if(data.taskRelationships) {
                // Set tasks, build new task objects
                context.state.taskRelationships == [];
                data.taskRelationships.forEach(relationship => {
                    if(context.state.tasks.find(task => relationship.parent) 
                    && typeof context.state.taskRelationships.find(existingRelationship => relationship.parent == existingRelationship.parent && relationship.child == existingRelationship.child) == "undefined" 
                    && relationship.parent != relationship.child) {
                        context.state.taskRelationships.push(relationship);
                    }
                });
            }
            
            if(data.taskStack) {
                // Reconstitute the task stack
                data.taskStack.tasks.reverse().forEach(taskFromStack => {
                    if(taskFromStack == null)
                        return;
                    context.state.taskStack.push(context.state.tasks.find(function(task) {
                        return task.id == taskFromStack.id;
                    }));
                });
            }

            context.commit("FIXORPHANS", context.getters);
        },
        SAVE: (context) => {
            localStorage.setItem("tasker", JSON.stringify({
                tasks: context.state.tasks,
                taskRelationships: context.state.taskRelationships,
                taskStack: context.state.taskStack
            }));
        },
        SETPARENT: (context, payload) => {
            var parent = payload.parent;
            var child = payload.child;
            var newIndex = payload.newIndex;


            // Set new sort
            context.state.tasks.find(task => task.id == child).sort = newIndex - 0.5;
            console.log("SETPARENT", context.state.tasks.find(task => task.id == child).title, context.state.tasks.find(task => task.id == child).sort, payload);

            // Remove this task from the relationships if it exists
            context.state.taskRelationships = context.state.taskRelationships.filter(relationship => relationship.child != child);
            
            // Set a parent if it exists
            if(parent) {
                // Remove wherever this thing appears
                context.state.taskRelationships.push({
                    parent: parent,
                    child: child
                });

                console.log("Just set a new parent", {
                    parent: parent,
                    child: child
                });
            }

        },
        REORDER: (context, payload) => {
            console.log("Reorder", payload);
            if(payload.newIndex == payload.oldIndex)
                return;
            var offset = payload.newIndex > payload.oldIndex ? 0.5 : -0.5;
            // Set new sort
            context.state.tasks.find(task => task.id == payload.id).sort = payload.newIndex + offset;
            console.log(offset, context.state.tasks.find(task => task.id == payload.id).title, context.state.tasks.find(task => task.id == payload.id).sort);
        },
        DELETETASK: (context, task) => {
            context.commit("DELETETASK", task);
            context.commit("FIXORPHANS", context.getters);
        }
    },
    mutations: {
        FIXORPHANS: (state, getters) => {
            // Get a flat list of all task ids that appear in the list, orphan any that don't appear
            var ids = getters.nonOrphans;
            state.taskRelationships = state.taskRelationships.filter(relationship => {
                return ids.includes(relationship.parent) && ids.includes(relationship.child);
            });
        },
        // Add a new task, optionally child to some parent
        NEWTASK: (state, payload) => {
            var title = payload.title;
            var parentTask = payload.parentTask;
            var newTask = new Task(title);
            state.tasks.push(newTask);
            if(parentTask)
                state.taskRelationships.push({parent: parentTask.id, child: newTask.id});
        },
        // Delete a task
        // TODO: Decide if we're orphaning child tasks or not
        DELETETASK: (state, task) => {
            state.tasks.splice(state.tasks.findIndex(findTask => findTask.id == task.id), 1);
        },
    }
});