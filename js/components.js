if(typeof Tasker == 'undefined') {
	Tasker = {};
}

Tasker.autosize = Vue.directive('autosize', {
	bind: function(el, binding) {
		var tagName = el.tagName
		setTimeout(function(){
			if (tagName == 'TEXTAREA') {
				autosize(el)
			}
		},10);
	},
	
	componentUpdated: function(el, binding, vnode) {
		var tagName = el.tagName
		if (tagName == 'TEXTAREA') {
			autosize.update(el)
		}
	},
	
	unbind: function(el) {
		autosize.destroy(el)
	}
})


Tasker.dateFilter = Vue.filter('date', function(value, format){
	if(typeof format == 'undefined') {
		format = "YYYY-MM-DD hh:mm";
	}
	return moment.unix(value/1000).format(format);
});

Tasker.truncate = Vue.filter('truncate', function(value, length, append){
	if(value.length < length) {
		return value.trim();
	}else {
		if(typeof append == 'undefined')
		append = '';
		// Find first index of whitespace before length limit
		var negativeIndex = value.substring(0,length).split("").reverse().join("").search(/\s/);
		var index = value.substring(0,length).length - (negativeIndex > 0 ? negativeIndex : 0);
		return value.substring(0,length).substring(0, index).trim() + append;
	}
});

Tasker.taskSearchWatcher = {
	props: ['searchInput'],
	computed: {
		isSearchResult: function() {
			return Tasker.searchTask(this.task, this.searchInput.slice(0).trim());
		}
	},
	watch: {
		searchInput: function() {
			if(this.task && this.searchInput != '') {
				this.showChildren = true;
			}
		}
	}
}

Tasker.taskCard = Vue.component('task-card', {
	template: '#task-card',
	props: ['task', 'tasks'],
	mixins: [Tasker.taskSearchWatcher],
	data: function(){return {
		showDelete: false,
		newTaskTitle: '',
		tab: 'details',
	}},
	methods: {
		setTab: function(tab) {
			this.tab = tab;
		},
		completeTask: function() {
			this.task.completed = new Date().getTime()
		},
		unCompleteTask: function() {
			this.task.completed = null
		},
		addTask: function(){
			if(this.newTaskTitle != '') {
				this.task.tasks.push(new Task(this.newTaskTitle));
				this.newTaskTitle = '';
			}
		},
		clearTaskFromStack: function() {
			this.$emit('clear-task-from-stack', this.task);
		},
		deleteTask: function() {
			this.showDelete = true;
		},
		deleteTaskCancel: function(){
			this.showDelete = false;
		},
		deleteTaskConfirm: function() {
			this.$emit('delete-task', this.task);
			this.showDelete = false;
		},
		onChange: function(data){
			return false;
			if(data.added) {
				if(this.task.containsTask(data.added.element))
				return false;
			}
		},
		toggleTimes: function() {
			this.showingTimes = !this.showingTimes;
		}
	},
	computed: {
		breadCrumbs: function() {
			if(this.taskPath.length > 1)
			return Tasker.taskPath(this.task, this.tasks).map(task => task.title).join(" -> ");
			return '';
		},
		taskPath: function() {
			return Tasker.taskPath(this.task, this.tasks);
		}
	}
});

Tasker.taskList = Vue.component('task-list', {
	template: '#task-list',
	props: {
		tasks: Array,
		showChildren: Boolean,
		isListRoot: {
			type: Boolean,
			default: false
		},
		conditional: {
			type: String,
			default: 'showAll'
		}
	},
	data: function(){return {
		newTaskTitle: ''
	}},
	mixins: [Tasker.taskSearchWatcher],
	methods: {
		newTask: function() {
			console.log("New task called");
			if(this.newTaskTitle.length > 0) {
				this.tasks.push(new Task(this.newTaskTitle));
				this.newTaskTitle = '';
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
				return Tasker.isComplete(task) && !Tasker.hasIncompleteChildren(task)
			}else if(this.conditional == "showIncompletes") {
				return !Tasker.isComplete(task) || Tasker.hasIncompleteChildren(task);
			}
		}
	},
	computed: {
		dragZone: function() {
			if(this.tasks.length == 0) {
				return ['drag-zone'];
			}else {
				return [];
			}
		},
		inflate: function() {
			if(this.tasks.length == 0) {
				return {'inflate': true};
			}else {
				return {'inflate': false};
			}
		},
		listHasIncompleteChildren: function() {
			return Tasker.hasIncompleteChildrenRecursive(this.tasks);
		}
		
	}
});

Tasker.taskListItem = Vue.component('task-list-item', {
	template: '#task-list-item',
	props: {
		task: {
			type: Object
		},
		taskCardHeading: {
			type: Boolean,
			default: false
		}
	},
	mixins: [Tasker.taskSearchWatcher],
	data: function(){return {
		showChildren: false,
		currentTime: new Date().getTime(),
		stopwatch: ''
	}},
	mounted: function(){
		// Repeat every second
		setInterval(this.updateTime,1000);
	},
	methods: {
		toggleChildren: function() {
			this.showChildren = !this.showChildren;
		},
		focusTask: function() {
			this.$emit('click-task', this.task);
		},
		specificClickTask: function() {
			this.$emit('specific-click-task', this.task);
		},
		updateTime: function() {
			this.currentTime = new Date().getTime();
			if(Tasker.hasActiveTimer(this.task)) {
				this.stopwatch = Tasker.stopwatch(this.task.times[0], this.currentTime).join(":");
				this.totalTime = Tasker.totalTime(this.task.times[0]);
			}else {
				this.stopwatch = '00:00:00';
			}
		}
	},
	computed: {
		isSearchResult: function() {
			return Tasker.searchTask(this.task, this.searchInput);
		},
		timerTitle: function() {
			if(this.task.times.length == 0) {
				return ''
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

Tasker.taskCardTiming = Vue.component('task-card-timing', {
	template: '#task-card-timing',
	props: ['times', 'task', 'breadCrumbs'],
	data: function(){return {
		currentPageSize: 5
	}},
	methods: {
		showMore: function() {
			this.currentPageSize += 5;
		}
	}
});

Tasker.taskCardTimer = Vue.component('task-card-timer', {
	template: '#task-card-timer',
	props: ['times'],
	data: function(){return {
		timerTitle: '',
		currentTime: new Date().getTime(),
		stopwatch: '',
		totalTime: '',
	}},
	mounted: function(){
		// Repeat every second
		setInterval(this.updateTime,1000);
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
				this.stopwatch = '00:00:00';
			}
		},
		continuePrevious: function() {
			this.times.unshift(new Time(this.times[0].title));
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