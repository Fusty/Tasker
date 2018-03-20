// Main vue instance
Tasker.vue = new Vue({
    el: "#app",
    data: function(){return {
        // tasks: [],
        headerInput: "",
        // taskStack: new TaskStack(),
        autoSaveEnabled: true,
        history: []
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
        }
    }
});