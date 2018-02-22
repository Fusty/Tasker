if(typeof Tasker == 'undefined') {
	Tasker = {};
}

Tasker.dateFilter = Vue.filter('date', function(value, format){
	if(typeof format == 'undefined') {
		format = "YYYY-MM-DD hh:mm";
	}
	return moment.unix(value/1000).format(format);
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
		showingTimes: false,
		newTaskTitle: ''
	}},
	methods: {
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
			console.log("Delete click");
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
			console.log(data);
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
	props: ['tasks', 'showChildren'],
	mixins: [Tasker.taskSearchWatcher],
	computed: {
		dragZone: function() {
			if(this.tasks.length == 0) {
				return ['drag-zone'];
			}else {
				return [];
			}
		},
		inflate: function() {
			console.log("Called");
			if(this.tasks.length == 0) {
				return {'inflate': true};
			}else {
				return {'inflate': false};
			}
		}
	}
});

Tasker.taskListItem = Vue.component('task-list-item', {
	template: '#task-list-item',
	props: ['task'],
	mixins: [Tasker.taskSearchWatcher],
	data: function(){return {
		showChildren: false
	}},
	methods: {
		toggleChildren: function() {
			if(this.task.tasks && this.task.tasks.length > 0)
			this.showChildren = !this.showChildren;
		},
		clickTask: function() {
			this.$emit('click-task', this.task);
		},
		specificClickTask: function() {
			this.$emit('specific-click-task', this.task);
		}
	},
	computed: {
		isSearchResult: function() {
			return Tasker.searchTask(this.task, this.searchInput);
		}
	}
});

Tasker.taskCardTiming = Vue.component('task-card-timing', {
	template: '#task-card-timing',
	props: ['times', 'task'],
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
		this.updateTime();
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
			}

			// Repeat every second
			var vm = this;
			setTimeout(function(){
				vm.updateTime();
			},1000);
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