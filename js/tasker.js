if(typeof Tasker == 'undefined') {
	Tasker = {};
}

if(typeof Tasker.registry == 'undefined') {
	Tasker.registry = {
		searchInput: ''
	};
}

Tasker.getId = function() {
	return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
}

Tasker.stopwatch = function(time, currentTime) {
	var end = time.end ? time.end : (currentTime ? currentTime : new Date().getTime());
	var diff = end - time.begin;
	var hours = Math.floor(diff/1000/60/60);
	var minutes = Math.floor(diff/1000/60)%60;
	var seconds = Math.floor(diff/1000)%60;
	return [hours, minutes.pad(2), seconds.pad(2)];
}

Tasker.totalTime = function(time) {
	if(time.end) {
		var diff = time.end - time.begin;
		var hours = Math.floor(diff/1000/60/60);
		var minutes = Math.floor(diff/1000/60)%60;
		var seconds = Math.floor(diff/1000)%60;
		return [hours, minutes.pad(2), seconds.pad(2)];
	}else {
		return "Timer still running . . ."
	}
}

Tasker.hasActiveTimer = function(task) {
	return (task.times.length > 0 && !task.times[0].end);
}

Tasker.hasActiveTimerChildren = function(task) {
	return Tasker.hasActiveTimerChildrenRecursive(task.tasks);
}

Tasker.hasActiveTimerChildrenRecursive = function(tasks) {
	for(var index = 0; index < tasks.length; ++index) {
		if(Tasker.hasActiveTimer(tasks[index]) || Tasker.hasActiveTimerChildren(tasks[index]))
			return true;
	}
	return false;
}

Tasker.isComplete = function(task) {
	return (task.completed);
}

Tasker.hasIncompleteChildren = function(task) {
	return Tasker.hasIncompleteChildrenRecursive(task.tasks);
}

Tasker.hasIncompleteChildrenRecursive = function(tasks) {
	for(var index = 0; index < tasks.length; ++index) {
		if(!Tasker.isComplete(tasks[index]) || Tasker.hasIncompleteChildren(tasks[index]))
			return true;
	}
	return false;
}

Tasker.hasCompleteChildren = function(task) {
	return Tasker.hasCompleteChildrenRecursive(task.tasks);
}

Tasker.hasCompleteChildrenRecursive = function(tasks) {
	for(var index = 0; index < tasks.length; ++index) {
		if(!Tasker.isComplete(tasks[index]) || !Tasker.hasCompleteChildren(tasks[index]))
			return false;
	}
	return true;
}

Tasker.searchTask = function(task) {
	if(!Tasker.registry.searchInput || Tasker.registry.searchInput == '')
		return true;
	if((task && task.title && task.title.toLowerCase().includes(Tasker.registry.searchInput.toLowerCase()) 
		|| (task && task.description && task.description.toLowerCase().includes(Tasker.registry.searchInput.toLowerCase()))))
		return true;

	return false;
}

Tasker.cloneTask = function(task) {
	return new Task(task.title,  task.description, Tasker.cloneTasks(task.tasks), Tasker.cloneTimes(task.times), task.created, task.due, task.deleted, task.completed, task.id);
}

Tasker.cloneTasks = function(tasks) {
	if(tasks == []) {
		return [];
	}

	var clonedTasks = [];
	for(var index = 0; index < tasks.length; ++index) {
		clonedTasks.push(Tasker.cloneTask(tasks[index]));
	}
	return clonedTasks;
}

Tasker.cloneTime = function(time) {
	return new Time(time.title, time.begin, time.end);
}

Tasker.cloneTimes = function(times) {
	if(times == []) {
		return [];
	}

	var clonedTimes = [];
	for(var index = 0; index < times.length; ++index) {
		clonedTimes.push(Tasker.cloneTime(times[index]));
	}
	return clonedTimes;
}

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
}

Tasker.stringToSeconds = function(input) {
	input = input.trim();
	var hhmmss = /^\d{1,2}:\d{1,2}:\d{1,2}$/;
	var hhmm = /^\d{1,2}:\d{1,2}$/;
	var numHourNumMinute = /^(\d+)\s?(hours|hour|h)\s?(\d+)\s?(minutes|minute|mins|min|m)/;
	var numHour = '';
	var numMinute = '';
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

Time = function(title, begin, end, id) {
	if(typeof title == 'undefined' || title == '') {
		this.title = "New time log entry . . .";
	}else {
		this.title = title;
	}

	if(typeof begin == 'undefined') {
		this.begin = new Date().getTime();
	}else {
		this.begin = begin;
	}

	if(typeof end == 'undefined') {
		this.end = null;
	}else {
		this.end = end;
	}

	if(typeof id == 'undefined') {
		this.id = Tasker.getId();
	}else {
		this.id = id;
	}

	this.elapsed = function() {
		return "HEYO";
	}
}

Task = function(title, description, tasks, times, created, due, deleted, completed, id) {
	// Tasks have:
	// title - string
	// description - string - markdown
	// tasks - array of Task objects
	
	// Set defaults or import existing
	if(typeof title == 'undefined' || title == '') {
		this.title = "";
	}else {
		this.title = title;
	}
	
	if(typeof description == 'undefined' || description == '') {
		this.description = "";
	}else {
		this.description = description;
	}
	
	if(typeof tasks == 'undefined' || tasks.length == 0) {
		this.tasks = [];
	}else {
		this.tasks = tasks;
	}
	
	if(typeof times == 'undefined' || times.length == 0) {
		this.times = [];
	}else {
		this.times = times;
	}
	
	if(typeof created == 'undefined' || created == null) {
		this.created = new Date().getTime();
	}else {
		this.created = created;
	}
	
	if(typeof due == 'undefined' || due == null) {
		this.due = null;
	}else {
		this.due = due;
	}
	
	if(typeof deleted == 'undefined' || deleted == null) {
		this.deleted = null;
	}else {
		this.deleted = deleted;
	}
	
	if(typeof completed == 'undefined' || completed == null) {
		this.completed = null;
	}else {
		this.completed = completed;
	}

	if(typeof id == 'undefined') {
		this.id = Tasker.getId();
	}else {
		this.id = id;
	}

	this.hasActiveTimer = function() {
		Tasker.hasActiveTimer(this);
	}

	this.hasActiveTimerChildren = function() {
		Tasker.hasActiveTimer(this);
	}
	
	this.hasIncompleteChildren = function() {
		for(var index = 0; index < this.tasks.length; ++index) {
			if(this.tasks[index].hasIncompleteChildrenRecursive()) {
				if(this.completed != null) {
					return true;
				}else {
					return this.hasIncompleteChildren();
				}
			}
		}
		return false;
	}

	this.containsTask = function(task) {
		return this.containsTaskRecursive(task, this.tasks)
	}

	this.containsTaskRecursive = function(task, tasks) {
		if(this.task == task)
			return true;

		for(var index = 0; index < tasks.length; ++index) {
			if(tasks[index] == task)
				return true;
			else
				return this.containsTaskRecursive(task, tasks[index].tasks);
		}

		return false;
	}
}

TaskStack = function(tasks) {
	if(typeof tasks != 'undefined') {
		this.tasks = tasks;
	}else {
		this.tasks = []		
	}
	
	this.push = function(task) {
		if(this.tasks.indexOf(task) > -1)
		this.tasks.splice(this.tasks.indexOf(task), 1);
		this.tasks.unshift(task);
	}
	
	this.pop = function(task) {
		var index = 0;
		if(typeof task != 'undefined') {
			index = this.tasks.indexOf(task);
		}
		return this.tasks.splice(index, 1);
	}
}

// Main vue instance
Tasker.vue = new Vue({
	el: "#app",
	data: function(){return {
		tasks: [],
		headerInput: '',
		taskStack: new TaskStack(),
		autoSaveEnabled: true,
		searchInput: '',
	}},
	beforeMount: function(){
		this.loadFromStorage();
		setInterval(this.autoSave, 2000);
	},
	methods: {
		exportData: function() {
			console.log(JSON.stringify(this.$data));
		},
		search: function() {
		},
		addTask: function() {
			if(this.headerInput != '') {
				var newTask = new Task(this.headerInput)
				this.tasks.unshift(newTask);
				this.headerInput = '';
				this.focusTask(newTask);
			}
		},
		deleteTask: function(task) {
			this.deleteTaskRecursive(task, this.tasks);
			this.clearTaskFromStack(task);
		},
		deleteTaskRecursive: function(task, tasks) {
			for(var index = 0; index < tasks.length; ++index) {
				if(task == tasks[index]) {
					tasks.splice(index, 1);
					return;
				}else if(tasks[index].tasks.length > 0){
					this.deleteTaskRecursive(task, tasks[index].tasks);
				}
			}
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
			if(localStorage.getItem('tasker') != '') {
				var data = JSON.parse(localStorage.getItem('tasker'));
				if(data)
				for(var index in data) {
					if(index == 'taskStack') {
						this.taskStack = new TaskStack();
					}else {
						this[index] = data[index];
					}
				}
			}else {
				this.initBareData();
			}
		},
		autoSave: function() {
			if(this.autoSaveEnabled) {
				this.saveToStorage();
			}
		},
		saveToStorage: function() {
			localStorage.setItem('tasker', JSON.stringify(this.$data));
		},
		deleteStorage: function() {
			this.initBareData();
			this.saveToStorage();
		},
		initBareData: function() {
			var replace = {
				tasks: [],
				headerInput: '',
				taskStack: new TaskStack(),
				autoSaveEnabled: true
			}
			for(var index in replace) {
				this[index] = replace[index];
			}
		}
	},
	computed: {
		hasIncompleteChildren: function() {
			return Tasker.hasIncompleteChildrenRecursive(this.tasks);
		},
		hasCompleteChildren: function() {
			return Tasker.hasCompleteChildrenRecursive(this.tasks);
		}
	},
	watch: {
		searchInput: function() {
			Tasker.registry.searchInput = this.searchInput;
		}
	}
});