if(typeof Tasker == 'undefined') {
	Tasker = {};
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

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

Time = function(title, begin, end) {
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
}

Task = function(title, description, tasks, times, created, due, deleted, completed) {
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
		this.due = new Date().getTime();
	}else {
		this.due = due;
	}
	
	if(typeof deleted == 'undefined' || deleted.length == 0) {
		this.deleted = null;
	}else {
		this.deleted = deleted;
	}
	
	if(typeof completed == 'undefined' || completed.length == 0) {
		this.completed = null;
	}else {
		this.completed = completed;
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
		test: "Hello World",
		tasks: [
			new Task("Create a time tracking task managment application", "Create a website that can organize tasks and track the time it takes to complete each", [
				new Task("Create a way to add tasks to the main list", "Like from the navbar or something"),
				new Task("Create a way to add tasks to existing tasks", "Like from the task stack on the right"),
				new Task("Create a way to show task stack on the right", "Like cards stacked on the right"),
			]),
			new Task("Make the app really good", "Don't just make it some lame piece of crap")
		],
		headerInput: '',
		taskStack: new TaskStack(),
		autoSaveEnabled: true,
		searchInput: ''
	}},
	beforeMount: function(){
		this.loadFromStorage();
		this.autoSave();
	},
	methods: {
		addTask: function() {
			if(this.headerInput != '') {
				var newTask = new Task(this.headerInput)
				this.tasks.unshift(newTask);
				this.headerInput = '';
				this.clickTask(newTask);
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
		clickTask: function(task) {
			console.log("Regular clicked", task);
			this.taskStack.push(task);
		},
		specificClickTask: function(task) {
			console.log("Specific clicked", task);
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
						console.log(data[index]);
						this.taskStack = new TaskStack(data[index].tasks);
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
				var vm = this;
				setTimeout(function(){
					vm.autoSave();
				}, 2000);
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
	}
});