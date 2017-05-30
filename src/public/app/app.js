'use strict';

angular
    .module('BlurAdmin', [
        'ngAnimate',
        'ui.bootstrap',
        'ui.sortable',
        'ui.router',
        'ngTouch',
        'toastr',
        'smart-table',
        "xeditable",
        'ui.slimscroll',
        'ngJsTree',
        'angular-progress-button-styles',
        'BlurAdmin.theme'
    ])
    .config(amChartConfig)
    .config(routesConfig)
    .controller('LoginCtrl', loginCtrl)
    .controller('MonitorCtrl', monitorCtrl)
    .controller('EditCtrl', editCtrl)
    .controller('ProfileCtrl', profileCtrl);

function routesConfig($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(true);
    $stateProvider
        .state('login', {
            url: '/login',
            title: 'Sign In - BlurMonitor',
            templateUrl: 'app/login.html',
            controller: 'LoginCtrl'
        });
    $stateProvider
        .state('register', {
            url: '/register',
            title: 'Register a New Profile - BlurMonitor',
            templateUrl: 'app/register.html',
            controller: 'LoginCtrl'
        });
    $stateProvider
        .state('edit', {
            url: '/edit',
            title: 'Edit Servers',
            templateUrl: 'app/edit.html',
            controller: 'EditCtrl'
        });
    $stateProvider
        .state('monitor', {
            url: '/monitor/:serverId',
            title: 'Monitor',
            templateUrl: 'app/monitor.html',
            controller: 'MonitorCtrl'
        });
    $stateProvider
        .state('profile', {
            url: '/profile',
            title: 'Edit Profile',
            templateUrl: 'app/profile.html',
            controller: 'ProfileCtrl'
        });
    $urlRouterProvider.otherwise('login');
}

function profileCtrl($scope, $http, $rootScope, $state, toastr) {

    if (typeof $rootScope.servers === "undefined") {
        $rootScope.pendingRedirect = {
            state: $state.current.name
        };
        return $state.go('login');
    }

    $("title").text("Edit Profile - BlueMonitor");

    $scope.avatars = [
        {name: "abraham", title: "Neat Abraham"},
        {name: "helen", title: "Organized Helen"},
        {name: "holly", title: "Genius Holly"},
        {name: "jim", title: "Furious Jim"},
        {name: "jones", title: "Mr. Jones"},
        {name: "leroy", title: "Experienced Leroy"},
        {name: "natalie", title: "Vigorous Natalie"},
        {name: "sandra", title: "Sweet Sandra"}
    ];
    $scope.avatar = 0;
    for (var i = 0; i < $scope.avatars.length; i++) {
        var current = $scope.avatars[i];
        if (current.name === $rootScope.user.avatar) {
            $scope.avatar = i;
            break;
        }
    }

    $scope.colors = [
        '#209e91',
        '#2dacd1',
        '#90b900',
        '#dfb81c',
        '#e85656',
        "#a5a5a5",
        "#505050",
        "#ececec"
    ];
    $scope.color = 0;
    for (i = 0; i < $scope.colors.length; i++) {
        current = $scope.colors[i];
        if (current === $rootScope.user.color) {
            $scope.color = i;
            break;
        }
    }

    $scope.nextAvatar = function () {
        $scope.avatar = ($scope.avatar + 1) % $scope.avatars.length;
    };

    $scope.nextColor = function () {
        $scope.color = ($scope.color + 1) % $scope.colors.length;
    };

    $scope.update = function () {
        var oldPassword = $("#oldPassword");
        var newPassword = $("#inputPassword");
        var confirmPassword = $("#inputConfirmPassword");
        if (confirmPassword.val() !== newPassword.val()) {
            $scope.setFieldError(newPassword, true);
            toastr.error("Passwords don't match");
            return;
        }
        $scope.setFieldError(newPassword, false);
        if (newPassword.val() && !oldPassword.val()) {
            $scope.setFieldError(oldPassword, true);
            toastr.error("Old password is missing", "Missing Field");
            return;
        }
        var data = {
            email: $rootScope.user.email,
            avatar: $scope.avatars[$scope.avatar].name,
            color: $scope.colors[$scope.color],
            fname: $("#inputFirstName").val(),
            lname: $("#inputLastName").val()
        };
        if (confirmPassword.val()) {
            data.oldPassword = oldPassword.val();
            data.newPassword = newPassword.val();
        }
        $http({
            method: 'POST',
            url: '/update_profile',
            data: JSON.stringify(data)
        })
            .then(
                function (response) {
                    if (response.status !== 200 || !response.data) {
                        toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                    }
                    else if (!response.data.success) {
                        toastr.error(response.data.error.body, response.data.error.title);
                    }
                    else {
                        $rootScope.user.fname = data.fname;
                        $rootScope.user.lname = data.lname;
                        $rootScope.user.avatar = data.avatar;
                        $rootScope.user.color = data.color;
                        toastr.success("Profile updated");
                    }
                }, function () {
                    toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                }
            );
    };

    $scope.setFieldError = function (element, hasError) {
        var parent = element;
        while (parent && !parent.hasClass("form-group")) {
            parent = parent.parent();
        }
        if (parent) {
            if (hasError) {
                parent.addClass("has-error");
            }
            else {
                parent.removeClass("has-error");
            }
        }
    };

}

function editCtrl($scope, $http, $rootScope, $state, toastr) {

    if (typeof $rootScope.servers === "undefined") {
        $rootScope.pendingRedirect = {
            state: $state.current.name
        };
        return $state.go('login');
    }

    $("title").text("Edit Servers - BlueMonitor");

    $scope.findServer = function (key) {
        return $rootScope.servers[key];
    };

    $scope.findMeter = function (serverKey, meterId) {
        for (var i = 0; i < $rootScope.servers[serverKey].meters.length; i++) {
            var meter = $rootScope.servers[serverKey].meters[i];
            if (meter.id === meterId) {
                return meter;
            }
        }
        return null;
    };

    $scope.validateFields = function () {
        $(this).each(function() {
            var element = $(this);
            if (element.data("lastValue") === element.val()) {
                return;
            }
            if (element.val()) {
                element.data("lastValue", element.val());
            }
            $scope.setFieldStatus(element, FIELD_STATUS_PENDING);
            $scope.validate(element, function (valid, errorToast) {
                $scope.setFieldStatus(element, valid ? FIELD_STATUS_VALID : FIELD_STATUS_INVALID, errorToast);
            })
        });
    };

    $scope.validate = function (element, callback) {
        try {
            if (!element.hasClass("validatable") && !element.hasClass("validation-group")) {
                return callback(true);
            }
            switch (element.attr("id")) {
                case "inputMeterWidth":
                    callback(true);
                    break;
                case "inputMeterType":
                    if (element.val()) {
                        $scope.$apply(function () {
                            $scope.treeDataFindById($scope.currentMeter.id).type = element.val().toLowerCase();
                        });
                    }
                    callback(true);
                    break;
                case "inputServerTitle":
                    if (element.val()) {
                        $scope.$apply(function () {
                            $scope.treeDataFindById($scope.currentServer.id).text = element.val();
                        });
                    }
                    callback(element.val());
                    break;
                case "inputServerURL":
                case "inputServerMethod":
                    $scope.getSampleData(function (success) {
                        callback(success, {
                            title: "No Server Response",
                            body: "Try changing the given URL or HTTP Method"
                        });
                    });
                    break;
                case "inputMeterTitle":
                    if (element.val()) {
                        $scope.$apply(function () {
                            $scope.treeDataFindById($scope.currentMeter.id).text = element.val();
                        });
                    }
                    callback(element.val());
                    break;
                case "prototype-collection-path":
                    var stopIndex = $scope.currentMeter.prototypeCollection.collectionPath.length;
                    callback($scope.detectPathType($scope.currentMeter.prototypeCollection.collectionPath, stopIndex) !== "VALUE");
                    break;
                case "prototype-title-path":
                    stopIndex = $scope.currentMeter.prototypeCollection.titlePath.length;
                    callback($scope.detectPathType($scope.currentMeter.prototypeCollection.titlePath, stopIndex, [$scope.currentMeter.prototypeCollection.collectionPath, $scope.chooseAny]) === "VALUE");
                    break;
            }
            if (element.hasClass("not-empty")) {
                return callback(element.val());
            }
        } catch (e) {
            callback(false);
        }
    };

    $scope.$watch('currentMeter.isPrototype', function (value) {
        if (value) {
            $scope.$$postDigest(function() {
                $(".validation-group").trigger("change");
            });
        }
    });

    $scope.getSampleData = function (callback) {
        var server = $scope.mode === 'server' ? $scope.currentServer : $scope.findServer($scope.currentMeter.serverId);
        $http({url: server.url, method: server.method})
            .then(function (response) {
                if (response.status === 200) {
                    $scope.currentSample = response.data;
                    if (callback) {
                        callback(true);
                    }
                }
                else if (callback) {
                    callback(false);
                }
            }, function () {
                if (callback) {
                    callback(false);
                }
            });
    };

    var FIELD_STATUS_INVALID = 0, FIELD_STATUS_VALID = 1, FIELD_STATUS_PENDING = 2;
    $scope.setFieldStatus = function (element, status, errorToast) {
        var parent = $scope.findParentByClass(element, "form-group");
        if (parent) {
            var indicator = parent.find(".form-control-feedback");
            if (status === FIELD_STATUS_INVALID) {
                parent.addClass("has-error").removeClass("has-success");
                indicator.removeClass("ion-checkmark-circled").addClass("ion-android-cancel").removeClass("pending-feedback");
                if (errorToast) {
                    toastr.error(errorToast.body, errorToast.title);
                }
            }
            else if (status === FIELD_STATUS_VALID) {
                parent.removeClass("has-error").addClass("has-success");
                indicator.addClass("ion-checkmark-circled").removeClass("ion-android-cancel").removeClass("pending-feedback");
            }
            else if (status === FIELD_STATUS_PENDING) {
                indicator.addClass("pending-feedback");
            }
        }
    };

    $scope.findParentByClass = function (element, className) {
        var parent = element;
        while (parent && !parent.hasClass(className)) {
            parent = parent.parent();
        }
        return parent;
    };

    $scope.countPathRecords = function (pathArray) {
        var value = $scope.walkPathArray(pathArray, pathArray.length);
        var type = $scope.detectType(value);
        if (type === "ARRAY") {
            return value.length;
        }
        else if (type === "VALUE") {
            return "-";
        }
        var result = 0;
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                result++;
            }
        }
        return result;
    };

    $scope.addPathEntry = function (pathArray, prePathArrays) {
        var stopIndex = pathArray.length;
        if ($scope.detectPathType(pathArray, stopIndex, prePathArrays) === "ARRAY") {
            var keys = $scope.calculatePathArrayKeyOptions(pathArray, stopIndex, prePathArrays);
            if (keys.length === 0) {
                throw "no keys";
            }
            var key = keys[0];
            var values = $scope.calculatePathArrayValueOptions(key, pathArray, stopIndex, prePathArrays);
            var value = values && values.length ? values[0] : '';
            var conditions = {};
            conditions[key] = value;
            pathArray.push({
                type: "ARRAY",
                conditions: conditions,
                result: key
            });
        }
        else {
            keys = $scope.calculatePathObjectKeyOptions(pathArray, stopIndex, prePathArrays);
            if (keys.length === 0) {
                throw "no keys";
            }
            pathArray.push({
                type: "OBJECT",
                result: keys[0]
            });
        }
        $scope.$$postDigest(function() {
            $(".validation-group").trigger("change");
        });
    };

    $scope.removePathEntry = function (pathArray) {
        pathArray.splice(pathArray.length - 1);
        $scope.$$postDigest(function() {
            $(".validation-group").trigger("change");
        });
    };

    $scope.addCondition = function (pathArray, entryIndex) {
        var keys = $scope.calculatePathArrayKeyOptions(pathArray, entryIndex);
        if (keys.length === 0) {
            throw "no keys";
        }
        var key = null;
        for (var i = 0; i < keys.length; i++) {
            if (!pathArray[entryIndex].conditions.hasOwnProperty(keys[i])) {
                key = keys[i];
                break;
            }
        }
        if (key === null) {
            toastr.warning("No more unused keys to create a new condition with");
            return;
        }
        var values = $scope.calculatePathArrayValueOptions(key, pathArray, entryIndex);
        pathArray[entryIndex].conditions[key] = values && values.length ? values[0] : '';
        $scope.$$postDigest(function() {
            $(".validation-group").trigger("change");
        });
    };

    $scope.removeCondition = function (pathEntry, key) {
        delete pathEntry.conditions[key];
        $scope.$$postDigest(function() {
            $(".validation-group").trigger("change");
        });
    };

    $scope.canRemoveCondition = function (pathEntry) {
        var counter = 0;
        for (var key in pathEntry.conditions) {
            if (pathEntry.conditions.hasOwnProperty(key)) {
                if (++counter > 1) {
                    return true;
                }
            }
        }
        return false;
    };

    $scope.calculatePathObjectKeyOptions = function (pathArray, stopIndex, prePathArrays) {
        var value = $scope.walkPathArray(pathArray, stopIndex, prePathArrays);
        var result = new Set();
        for (key in value) {
            if (value.hasOwnProperty(key)) {
                result.add(key);
            }
        }
        return result.toArray();
    };

    $scope.calculatePathArrayKeyOptions = function (pathArray, stopIndex, prePathArrays) {
        var value = $scope.walkPathArray(pathArray, stopIndex, prePathArrays);
        var result = new Set();
        for (var i = 0; i < value.length; i++) {
            var entry = value[i];
            for (var key in entry) {
                if (entry.hasOwnProperty(key)) {
                    result.add(key);
                }
            }
        }
        return result.toArray();
    };

    $scope.calculatePathArrayValueOptions = function (key, pathArray, stopIndex, prePathArrays) {
        var value = $scope.walkPathArray(pathArray, stopIndex, prePathArrays);
        var result = new Set();
        for (var i = 0; i < value.length; i++) {
            var entry = value[i];
            if (entry.hasOwnProperty(key) && typeof entry[key] !== "object") {
                result.add(entry[key]);
            }
        }
        return result.toArray();
    };

    $scope.detectPathType = function (pathArray, stopIndex, prePathArrays) {
        return $scope.detectType($scope.walkPathArray(pathArray, stopIndex, prePathArrays));
    };

    $scope.detectType = function (value) {
        if (typeof value === "object") {
            return value instanceof Array ? "ARRAY" : "OBJECT";
        }
        return "VALUE";
    };

    $scope.chooseAny = function (collection) {
        for (var key in collection) {
            if (collection.hasOwnProperty(key)) {
                return collection[key];
            }
        }
        return [];
    };

    $scope.walkPathArray = function (pathArray, stopIndex, prePathArrays) {
        var input = $scope.currentSample;
        if (prePathArrays) {
            for (var i = 0; i < prePathArrays.length; i++) {
                var currentPathArray = prePathArrays[i];
                if (typeof currentPathArray === "function") {
                    input = currentPathArray(input);
                }
                else {
                    for (var j = 0; j < currentPathArray.length; j++) {
                        var entry = currentPathArray[j];
                        input = $scope.walkPath(entry, input);
                    }
                }
            }
        }
        for (i = 0; i < pathArray.length && i < stopIndex; i++) {
            entry = pathArray[i];
            input = $scope.walkPath(entry, input);
        }
        return input;
    };

    $scope.walkPath = function (entry, input) {
        if (entry.type === "ARRAY") {
            for (var i = 0; i < input.length; i++) {
                var isValid = true;
                var sampleEntry = input[i];
                for (var key in entry.conditions) {
                    if (!entry.conditions.hasOwnProperty(key)) {
                        continue;
                    }
                    if (sampleEntry[key] != entry.conditions[key]) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    return sampleEntry[entry.result];
                }
            }
            throw "could not extract entry path - array not match";
        }
        else if (entry.type === "OBJECT") {
            return input[entry.result];
        }
        return input;
    };

    $scope.propagateValidation = function () {
        $(".validation-group").trigger("change");
    };

    $("body")
        .on("change", ".validatable", $scope.validateFields)
        .on("keyup", ".validatable.on-keypress", $scope.validateFields)
        .on("change", ".validation-group-inner", $scope.propagateValidation);
    $scope.$on("$destroy", function () {
        $("body")
            .off("change", ".validatable", $scope.validateFields)
            .off("keyup", ".validatable.on-keypress", $scope.validateFields)
            .off("change", ".validation-group-inner", $scope.propagateValidation);
    });

    $scope.treeConfig = {
        core: {
            check_callback: function(operation, node, nodeParent, nodePosition, more) {
                // 'create_node'/'rename_node'/'delete_node'/'move_node'/'copy_node'
                if (operation === "move_node") {
                    if (node.type === "server") {
                        return nodeParent.type === "#";
                    }
                    return nodeParent.type === "server" && node.data.server === nodeParent.data.key;
                }
                return true;
            },
            themes: {
                dots: false,
                responsive: false
            }
        },
        dnd: {
            check_while_dragging: true
        },
        types: {
            server: {
                icon: 'tree-icon fa fa-server'
            },
            graph: {
                icon: 'tree-icon fa fa-area-chart'
            },
            pie: {
                icon: 'tree-icon fa fa-pie-chart'
            },
            table: {
                icon: 'tree-icon fa fa-table'
            },
            value: {
                icon: 'tree-icon fa fa-info'
            }
        },
        "plugins": ["dnd", 'types']
    };

    $scope.treeEventsObj = {
        select_node: function (e, data) {
            if (data.node.type === 'server') {
                $scope.mode = 'server';
                $scope.currentServer = $scope.findServer(data.node.data.key);
            }
            else {
                $scope.mode = 'meter';
                $scope.currentMeter = $scope.findMeter(data.node.data.server, data.node.data.meter);
            }
            $scope.getSampleData();
            $scope.$$postDigest(function() {
                $(".validatable").trigger("change");
            });
        }
    };

    $scope.treeData = [];
    for (var key in $rootScope.servers) {
        if (!$rootScope.servers.hasOwnProperty(key)) {
            continue;
        }
        $scope.treeData.push({
            id: key,
            parent: "#",
            type: "server",
            text: $rootScope.servers[key].title,
            state: {opened: false},
            data: {key: key}
        });
        if (!$rootScope.servers[key].meters) {
            continue;
        }
        for (var i = 0; i < $rootScope.servers[key].meters.length; i++) {
            var meter = $rootScope.servers[key].meters[i];
            $scope.treeData.push({
                id: meter.id,
                parent: key,
                type: meter.type.toLowerCase(),
                text: meter.title,
                state: {opened: false},
                data: {
                    server: key,
                    meter: meter.id
                }
            });
        }
    }

    $scope.treeDataFindById = function (id) {
        for (var i = 0; i < $scope.treeData.length; i++) {
            var data = $scope.treeData[i];
            if (data.id == id) {
                return data;
            }
        }
        return {};
    };

    $scope.treeDataIndexFindById = function (id) {
        for (var i = 0; i < $scope.treeData.length; i++) {
            var data = $scope.treeData[i];
            if (data.id === id) {
                return i;
            }
        }
        return null;
    };

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

}

function loginCtrl($scope, $http, $rootScope, baSidebarService, $state, toastr) {

    $("title").text($state.current.title);

    $scope.initialized = false;

    $rootScope.logout = function () {
        $rootScope.loggedIn = false;
        if (typeof(Storage) !== "undefined") {
            localStorage.removeItem("email");
            localStorage.removeItem("password");
        }
        $state.go('login');
    };

    $rootScope.getUserName = function () {
        if (!$rootScope.user) {
            return '';
        }
        var result = "";
        if ($rootScope.user.fname) {
            result += $rootScope.user.fname;
        }
        if ($rootScope.user.lname) {
            if ($rootScope.user.fname) {
                result += " ";
            }
            result += $rootScope.user.lname;
        }
        if (result === "") {
            result = $rootScope.user.email;
        }
        return result;
    };

    $scope.login = function () {
        var password = $scope.validateField("inputPassword3", "Password is required", "Required Field");
        var email = $scope.validateField("inputEmail3", "Email is required", "Required Field");
        if (email && password) {
            $scope.callLogin(email, password);
        }
    };

    $scope.callLogin = function (email, password) {
        $http({
            method: 'POST',
            url: '/login',
            data: JSON.stringify({email: email, password: password})
        })
            .then(
                function (response) {
                    if (response.status !== 200 || !response.data) {
                        toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                    }
                    else if (!response.data.success) {
                        toastr.error(response.data.error.body, response.data.error.title);
                        $scope.setFieldError("inputEmail3", true);
                        $scope.setFieldError("inputPassword3", true);
                    }
                    else {
                        if (typeof(Storage) !== "undefined") {
                            localStorage.setItem("email", email);
                            localStorage.setItem("password", password);
                        }
                        $rootScope.user = response.data.result;
                        $rootScope.servers = $rootScope.user.servers;
                        baSidebarService.clearStaticItems();
                        for (var key in $rootScope.servers) {
                            if (!$rootScope.servers.hasOwnProperty(key)) {
                                continue;
                            }
                            baSidebarService.addStaticItem({
                                title: $rootScope.servers[key].title,
                                server: {
                                    title: $rootScope.servers[key].title,
                                    url: $rootScope.servers[key].url,
                                    method: $rootScope.servers[key].method
                                },
                                stateRef: 'monitor',
                                stateParams: {serverId: key}
                            });
                        }
                        baSidebarService.addStaticItem({
                            title: 'New Server',
                            icon: 'ion-android-add-circle',
                            stateRef: 'edit'
                        });
                        $rootScope.loggedIn = true;
                        $scope.goHome();
                    }
                }, function () {
                    toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                }
            );
    };

    $scope.register = function () {
        var password = $scope.validateField("inputPassword3", "Password is required", "Required Field");
        var email = $scope.validateField("inputEmail3", "Email is required", "Required Field");
        var adminPassword = $scope.validateField("inputName3", "Admin password is required", "Required Field");
        if (adminPassword && email && password) {
            $http({
                method: 'POST',
                url: '/register',
                data: JSON.stringify({adminPassword: adminPassword, email: email, password: password})
            })
                .then(
                    function (response) {
                        if (response.status !== 200 || !response.data) {
                            toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                        }
                        else if (!response.data.success) {
                            toastr.error(response.data.error.body, response.data.error.title);
                            $scope.setFieldError("inputName3", true);
                            $scope.setFieldError("inputEmail3", true);
                            $scope.setFieldError("inputPassword3", true);
                        }
                        else {
                            $rootScope.email = email;
                            if (typeof(Storage) !== "undefined") {
                                localStorage.setItem("email", email);
                                localStorage.setItem("password", password);
                            }
                            $rootScope.user = response.data.result;
                            $rootScope.servers = $rootScope.user.servers;
                            baSidebarService.clearStaticItems();
                            baSidebarService.addStaticItem({
                                title: 'New Server',
                                icon: 'ion-android-add-circle',
                                stateRef: 'edit'
                            });
                            $rootScope.loggedIn = true;
                            $scope.goHome();
                        }
                    }, function () {
                        toastr.error("Could not communicate with BlurMonitor Server", "Oops!");
                    }
                );
        }
    };

    $scope.validateField = function (id, messageBody, messageTitle) {
        var field = $("#" + id);
        var value = null;
        if (field.get(0).checkValidity()) {
            value = field.val();
        }
        if (value) {
            $scope.setFieldError(id, false);
        }
        else {
            toastr.error(messageBody, messageTitle);
            $scope.setFieldError(id, true);
        }
        return value;
    };

    $scope.setFieldError = function (id, hasError) {
        var parent = $("#" + id);
        while (parent && !parent.hasClass("form-group")) {
            parent = parent.parent();
        }
        if (parent) {
            if (hasError) {
                parent.addClass("has-error");
            }
            else {
                parent.removeClass("has-error");
            }
        }
    };

    $scope.goHome = function () {
        if ($rootScope.pendingRedirect) {
            $state.go($rootScope.pendingRedirect.state, $rootScope.pendingRedirect.params);
            $rootScope.pendingRedirect = null;
            return;
        }
        for (var key in $rootScope.servers) {
            if (!$rootScope.servers.hasOwnProperty(key)) {
                continue;
            }
            return $state.go('monitor', {serverId: key});
        }
        $state.go('new');
    };

    if ($rootScope.loggedIn) {
        $scope.goHome();
    }

    if (typeof(Storage) !== "undefined") {
        var email = localStorage.getItem("email");
        var password = localStorage.getItem("password");
        if (email && password) {
            $scope.callLogin(email, password);
        }
        else {
            $scope.initialized = true;
        }
    } else {
        $scope.initialized = true;
    }

}

function monitorCtrl($scope, $stateParams, $http, $rootScope, baConfig, layoutPaths, $state) {

    if (typeof $rootScope.servers === "undefined") {
        $rootScope.pendingRedirect = {
            state: $state.current.name,
            params: $stateParams
        };
        return $state.go('login');
    }

    $scope.serverId = $stateParams.serverId;
    if (!$scope.serverId) {
        return $state.go('new');
    }

    $scope.server = $rootScope.servers[$scope.serverId];
    if (!$scope.server) {
        return $state.go('new');
    }

    $("title").text($scope.server.title + " - BlurMonitor");

    $scope.serverIsUp = true;

    $scope.data = [];

    $scope.active = true;

    $scope.hoveredMeterId = null;

    $scope.onMeterMouseEnter = function () {
        $scope.hoveredMeterId = $(this).attr("id");
    };

    $scope.onMeterMouseLeave = function () {
        $scope.hoveredMeterId = null;
    };

    $scope.shouldDraw = function (id) {
        return $scope.hoveredMeterId !== id;
    };

    $("body").on("mouseenter", ".meter", $scope.onMeterMouseEnter).on("mouseleave", ".meter", $scope.onMeterMouseLeave);

    $scope.$on("$destroy", function () {
        $scope.active = false;
        $("body").off("mouseenter", ".meter", $scope.onMeterMouseEnter).off("mouseleave", ".meter", $scope.onMeterMouseLeave);
    });

    $scope.update = function (callback) {
        if (!$scope.active) {
            return;
        }
        $http({
            method: $scope.server.method,
            url: $scope.server.url
        })
            .then(
                function (response) {
                    if (response.status === 200) {
                        $scope.serverIsUp = true;
                        if (response.data) {
                            $scope.data.push({
                                time: $scope.getTime(),
                                data: response.data
                            });
                            if (callback) {
                                callback(response.data);
                            }
                            else {
                                $scope.draw();
                            }
                        }
                    }
                    else {
                        $scope.serverIsUp = false;
                    }
                }, function () {
                    $scope.serverIsUp = false;
                }
            );
        setTimeout($scope.update, 5000);
    };

    $scope.draw = function () {
        for (var i = 0; i < $scope.meters.length; i++) {
            var meter = $scope.meters[i];
            var id = "meter-wrapper-" + i;
            if (!$scope.shouldDraw(id)) {
                continue;
            }
            switch (meter.type) {
                case "GRAPH":
                    $scope.drawGraph(i, meter.config);
                    break;
                case "PIE":
                    $scope.drawPie(i, meter.config);
                    break;
                case "VALUE":
                    $scope.drawValue(i, meter.config);
                    break;
                case "TABLE":
                    $scope.drawTable(i, meter.config);
                    break;
            }
        }
    };

    $scope.drawGraph = function (index, config) {
        var data = [];
        var startIndex = config.maxHistory ? Math.max(0, $scope.data.length - config.maxHistory) : 0;
        var rawData = $scope.data.slice(startIndex);
        if (!rawData) {
            return;
        }
        var graphIndex = 0;
        var graphs = [];
        for (var i = 0; i < rawData.length; i++) {
            data.push({time: rawData[i].time});
        }
        for (i = 0; i < config.participants.length; i++) {
            var participant = config.participants[i];
            if (participant.type === "INSTANCE") {
                var graphId = "g" + ++graphIndex;
                graphs.push({
                    id: graphId,
                    balloonText: participant.title + ' - [[value]]',
                    bullet: 'square',
                    bulletSize: 8,
                    lineColor: $scope.chooseColor(graphIndex),
                    fillColors: $scope.chooseColor(graphIndex),
                    lineThickness: 1,
                    valueField: graphId,
                    type: 'smoothedLine',
                    fillAlphas: config.participants.length === 1 && config.participants[0].type === "INSTANCE" ? 0.5 : 0
                });
                for (var j = 0; j < rawData.length; j++) {
                    data[j][graphId] = $scope.getEntryByPath(participant.valuePath, config.getBaseData(rawData[j].data));
                }
            }
            else {
                var sampleCollection = $scope.getEntryByPath(participant.collectionPath, config.getBaseData(rawData[0].data));
                for (var key in sampleCollection) {
                    if (!sampleCollection.hasOwnProperty(key)) {
                        continue;
                    }
                    graphId = "g" + ++graphIndex;
                    graphs.push({
                        id: graphId,
                        balloonText: $scope.getTitle(participant.titlePath, key, sampleCollection) + ' - [[value]]',
                        bullet: 'square',
                        bulletSize: 8,
                        lineColor: $scope.chooseColor(graphIndex),
                        fillColors: $scope.chooseColor(graphIndex),
                        lineThickness: 1,
                        valueField: graphId,
                        type: 'smoothedLine',
                        fillAlphas: config.participants.length === 1 && config.participants[0].type === "INSTANCE" ? 0.5 : 0
                    });
                    for (j = 0; j < rawData.length; j++) {
                        var sample = $scope.getEntryByPath(participant.collectionPath, config.getBaseData(rawData[j].data));
                        data[j][graphId] = $scope.getEntryByPath(participant.valuePath, sample[key]);
                    }
                }
            }
        }
        var lineChart = AmCharts.makeChart("meter" + index, {
            type: 'serial',
            theme: 'blur',
            color: baConfig.colors.defaultText,
            marginTop: 0,
            marginRight: 15,
            dataProvider: data,
            categoryField: 'time',
            valueAxes: [
                {
                    axisAlpha: 0,
                    position: 'left',
                    gridAlpha: 0.5,
                    gridColor: baConfig.colors.border
                }
            ],
            graphs: graphs,
            chartScrollbar: {
                graph: 'g1',
                gridAlpha: 0,
                color: baConfig.colors.defaultText,
                scrollbarHeight: 55,
                backgroundAlpha: 0,
                selectedBackgroundAlpha: 0.05,
                selectedBackgroundColor: baConfig.colors.defaultText,
                graphFillAlpha: 0,
                autoGridCount: true,
                selectedGraphFillAlpha: 0,
                graphLineAlpha: 0.2,
                selectedGraphLineColor: baConfig.colors.defaultText,
                selectedGraphLineAlpha: 1
            },
            chartCursor: {
                cursorAlpha: 0,
                valueLineEnabled: true,
                valueLineBalloonEnabled: true,
                valueLineAlpha: 0.5,
                fullWidth: true
            },
            export: {
                enabled: true
            },
            creditsPosition: 'bottom-right',
            pathToImages: layoutPaths.images.amChart
        });
        lineChart.addListener('rendered', zoomChart);
        if (lineChart.zoomChart) {
            lineChart.zoomChart();
        }
        function zoomChart() {
            lineChart.zoomToIndexes(Math.round(lineChart.dataProvider.length * 0.4), Math.round(lineChart.dataProvider.length * 0.55));
        }
    };

    $scope.drawPie = function (index, config) {
        if ($scope.data.length === 0) {
            return;
        }
        var data = [];
        var lastSample = config.getBaseData($scope.data[$scope.data.length - 1].data);
        for (var i = 0; i < config.participants.length; i++) {
            var participant = config.participants[i];
            if (participant.type === "INSTANCE") {
                data.push({
                    title: participant.title,
                    value: $scope.getEntryByPath(participant.valuePath, lastSample)
                });
            }
            else {
                var collection = $scope.getEntryByPath(participant.collectionPath, lastSample);
                for (var key in collection) {
                    if (!collection.hasOwnProperty(key)) {
                        continue;
                    }
                    data.push({
                        title: $scope.getTitle(participant.titlePath, key, collection),
                        value: $scope.getEntryByPath(participant.valuePath, collection[key])
                    });
                }
            }
        }
        var layoutColors = baConfig.colors;
        var pieChart = AmCharts.makeChart("meter" + index, {
            type: 'pie',
            startDuration: 0,
            theme: 'blur',
            addClassNames: true,
            color: layoutColors.defaultText,
            labelTickColor: layoutColors.borderDark,
            legend: {
                position: 'right',
                marginRight: 100,
                autoMargins: false
            },
            innerRadius: '40%',
            defs: {
                filter: [
                    {
                        id: 'shadow',
                        width: '200%',
                        height: '200%',
                        feOffset: {
                            result: 'offOut',
                            in: 'SourceAlpha',
                            dx: 0,
                            dy: 0
                        },
                        feGaussianBlur: {
                            result: 'blurOut',
                            in: 'offOut',
                            stdDeviation: 5
                        },
                        feBlend: {
                            in: 'SourceGraphic',
                            in2: 'blurOut',
                            mode: 'normal'
                        }
                    }
                ]
            },
            dataProvider: data,
            valueField: 'value',
            titleField: 'title',
            export: {
                enabled: true
            },
            creditsPosition: 'bottom-left',
            autoMargins: false,
            marginTop: 10,
            alpha: 0.8,
            marginBottom: 30,
            marginLeft: 0,
            marginRight: 0,
            pullOutRadius: 0,
            pathToImages: layoutPaths.images.amChart,
            responsive: {
                enabled: false, // creating an issue of not reading settings each even re-draw
                rules: [
                    // at 900px wide, we hide legend
                    {
                        maxWidth: 900,
                        overrides: {
                            legend: {
                                enabled: false
                            }
                        }
                    },
                    // at 200 px we hide value axis labels altogether
                    {
                        maxWidth: 200,
                        overrides: {
                            valueAxes: {
                                labelsEnabled: false
                            },
                            marginTop: 30,
                            marginBottom: 30,
                            marginLeft: 30,
                            marginRight: 30
                        }
                    }
                ]
            }
        });
        pieChart.addListener('init', function () {
            pieChart.legend.addListener('rollOverItem', handleRollOver);
        });
        pieChart.addListener('rollOverSlice', function (e) {
            handleRollOver(e);
        });
        function handleRollOver(e) {
            var wedge = e.dataItem.wedge.node;
            wedge.parentNode.appendChild(wedge);
        }
    };

    $scope.drawValue = function (index, config) {
        if ($scope.data.length === 0) {
            return;
        }
        var lastSample = config.getBaseData($scope.data[$scope.data.length - 1].data);
        var value = $scope.getEntryByPath(config.path, lastSample);
        $("#meter" + index).addClass("value-view").html(config.prefix + value + config.suffix);
    };

    $scope.drawTable = function (index, config) {
        if ($scope.data.length === 0) {
            return;
        }
        var lastSample = config.getBaseData($scope.data[$scope.data.length - 1].data);
        var headerValues = [""];
        for (var i = 0; i < config.table.values.length; i++) {
            headerValues.push(config.table.values[i].title);
        }
        var tableValues = [];
        var collection = $scope.getEntryByPath(config.table.collectionPath, lastSample);
        for (var key in collection) {
            if (!collection.hasOwnProperty(key)) {
                continue;
            }
            var row = [$scope.getTitle(config.table.titlePath, key, collection)];
            for (i = 0; i < config.table.values.length; i++) {
                row.push($scope.getEntryByPath(config.table.values[i].valuePath, collection[key]));
            }
            tableValues.push(row);
        }
        var headerHolder = $('<tr>');
        for (i = 0; i < headerValues.length; i++) {
            headerHolder.append($('<th>').html(headerValues[i]));
        }
        var tableHolder = $('<tbody>');
        for (i = 0; i < tableValues.length; i++) {
            var rowValues = tableValues[i];
            var rowHolder = $('<tr>').addClass("no-top-border");
            for (var j = 0; j < rowValues.length; j++) {
                rowHolder.append($('<td>').html(rowValues[j]));
            }
            tableHolder.append(rowHolder);
        }
        $("#meter" + index).html(
            $('<div>').addClass("horizontal-scroll").append(
                $('<table>').addClass("table table-hover").append(
                    $('<thead>').append(headerHolder),
                    tableHolder
                )
            )
        );
    };

    $scope.getEntryByPath = function (pathArray, sample) {
        if (pathArray.length === 0) {
            return $scope.normalizeValue(sample);
        }
        if (!sample) {
            throw "could not extract entry path";
        }
        var currentInstruction = pathArray[0];
        if (currentInstruction.type === "ARRAY") {
            for (var i = 0; i < sample.length; i++) {
                var isValid = true;
                var sampleEntry = sample[i];
                for (var key in currentInstruction.conditions) {
                    if (!currentInstruction.conditions.hasOwnProperty(key)) {
                        continue;
                    }
                    if (sampleEntry[key] !== currentInstruction.conditions[key]) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    return $scope.getEntryByPath(pathArray.slice(1), sampleEntry[currentInstruction.result]);
                }
            }
            throw "could not extract entry path - array not match";
        }
        else if (currentInstruction.type === "OBJECT") {
            return $scope.getEntryByPath(pathArray.slice(1), sample[currentInstruction.result]);
        }
        return $scope.normalizeValue(sample);
    };

    $scope.getTitle = function (titlePath, key, sample, prefix, suffix) {
        var title = titlePath === "{{key}}" ? key : $scope.getEntryByPath(titlePath, sample[key]);
        if (prefix) {
            title = prefix + " " + title;
        }
        if (suffix) {
            title += " " + suffix;
        }
        return title;
    };

    $scope.getTime = function () {
        var date = new Date();
        var minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        var seconds = date.getSeconds();
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return date.getHours() + ":" + minutes + ":" + seconds;
    };

    $scope.normalizeValue = function (value) {
        if (!$.isNumeric(value)) {
            return value;
        }
        var result = $scope.formatNumber(value, 3, '.', ',');
        return result.substr(-3) === "000" ? result.substr(0, result.length - 4) : result;
    };

    $scope.formatNumber = function (number, decimals, decPoint, thousandsSep) {
        var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep,
            dec = (typeof decPoint === 'undefined') ? '.' : decPoint,
            toFixedFix = function (n, prec) {
                // Fix for IE parseFloat(0.55).toFixed(0) = 0;
                var k = Math.pow(10, prec);
                return Math.round(n * k) / k;
            },
            s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }
        return s.join(dec);
    };

    var colors = [
        baConfig.colors.primary,
        baConfig.colors.danger,
        baConfig.colors.warning,
        baConfig.colors.success,
        baConfig.colors.info,
        baConfig.colors.primaryDark,
        baConfig.colors.warningLight,
        baConfig.colors.successDark,
        baConfig.colors.successLight,
        baConfig.colors.primaryLight,
        baConfig.colors.warningDark
    ];

    $scope.chooseColor = function (index) {
        return colors[index % colors.length];
    };

    $scope.update(function (sample) {
        $scope.meters = [];
        for (var i = 0; i < $scope.server.meters.length; i++) {
            var meter = $scope.server.meters[i];
            if (!meter.hasOwnProperty("prototypeCollection")) {
                meter.config.getBaseData = function (sample) {
                    return sample;
                };
                $scope.meters.push(meter);
                continue;
            }
            var prototypeCollection = meter.prototypeCollection;
            var collection = $scope.getEntryByPath(prototypeCollection.collectionPath, sample);
            for (var key in collection) {
                if (!collection.hasOwnProperty(key)) {
                    continue;
                }
                var meterCopy = JSON.parse(JSON.stringify(meter));
                meterCopy.title = $scope.getTitle(prototypeCollection.titlePath, key, collection,
                    prototypeCollection.titlePrefix, prototypeCollection.titleSuffix);
                (function (collectionPath, key) {
                    meterCopy.config.getBaseData = function (sample) {
                        return $scope.getEntryByPath(collectionPath, sample)[key];
                    };
                })(prototypeCollection.collectionPath, key);
                $scope.meters.push(meterCopy);
            }
        }
        $scope.$$postDigest(function(){
            $scope.draw();
        });
    });

}

function amChartConfig(baConfigProvider) {
    var layoutColors = baConfigProvider.colors;
    AmCharts.themes.blur = {

        themeName: "blur",

        AmChart: {
            color: layoutColors.defaultText,
            backgroundColor: "#FFFFFF"
        },

        AmCoordinateChart: {
            colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark]
        },

        AmStockChart: {
            colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark]
        },

        AmSlicedChart: {
            colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark],
            labelTickColor: "#FFFFFF",
            labelTickAlpha: 0.3
        },

        AmRectangularChart: {
            zoomOutButtonColor: '#FFFFFF',
            zoomOutButtonRollOverAlpha: 0.15,
            zoomOutButtonImage: "lens.png"
        },

        AxisBase: {
            axisColor: "#FFFFFF",
            axisAlpha: 0.3,
            gridAlpha: 0.1,
            gridColor: "#FFFFFF"
        },

        ChartScrollbar: {
            backgroundColor: "#FFFFFF",
            backgroundAlpha: 0.12,
            graphFillAlpha: 0.5,
            graphLineAlpha: 0,
            selectedBackgroundColor: "#FFFFFF",
            selectedBackgroundAlpha: 0.4,
            gridAlpha: 0.15
        },

        ChartCursor: {
            cursorColor: layoutColors.primary,
            color: "#FFFFFF",
            cursorAlpha: 0.5
        },

        AmLegend: {
            color: "#FFFFFF"
        },

        AmGraph: {
            lineAlpha: 0.9
        },
        GaugeArrow: {
            color: "#FFFFFF",
            alpha: 0.8,
            nailAlpha: 0,
            innerRadius: "40%",
            nailRadius: 15,
            startWidth: 15,
            borderAlpha: 0.8,
            nailBorderAlpha: 0
        },

        GaugeAxis: {
            tickColor: "#FFFFFF",
            tickAlpha: 1,
            tickLength: 15,
            minorTickLength: 8,
            axisThickness: 3,
            axisColor: '#FFFFFF',
            axisAlpha: 1,
            bandAlpha: 0.8
        },

        TrendLine: {
            lineColor: layoutColors.danger,
            lineAlpha: 0.8
        },

        // ammap
        AreasSettings: {
            alpha: 0.8,
            color: layoutColors.info,
            colorSolid: layoutColors.primaryDark,
            unlistedAreasAlpha: 0.4,
            unlistedAreasColor: "#FFFFFF",
            outlineColor: "#FFFFFF",
            outlineAlpha: 0.5,
            outlineThickness: 0.5,
            rollOverColor: layoutColors.primary,
            rollOverOutlineColor: "#FFFFFF",
            selectedOutlineColor: "#FFFFFF",
            selectedColor: "#f15135",
            unlistedAreasOutlineColor: "#FFFFFF",
            unlistedAreasOutlineAlpha: 0.5
        },

        LinesSettings: {
            color: "#FFFFFF",
            alpha: 0.8
        },

        ImagesSettings: {
            alpha: 0.8,
            labelColor: "#FFFFFF",
            color: "#FFFFFF",
            labelRollOverColor: layoutColors.primaryDark
        },

        ZoomControl: {
            buttonFillAlpha: 0.8,
            buttonIconColor: layoutColors.defaultText,
            buttonRollOverColor: layoutColors.danger,
            buttonFillColor: layoutColors.primaryDark,
            buttonBorderColor: layoutColors.primaryDark,
            buttonBorderAlpha: 0,
            buttonCornerRadius: 0,
            gridColor: "#FFFFFF",
            gridBackgroundColor: "#FFFFFF",
            buttonIconAlpha: 0.6,
            gridAlpha: 0.6,
            buttonSize: 20
        },

        SmallMap: {
            mapColor: "#000000",
            rectangleColor: layoutColors.danger,
            backgroundColor: "#FFFFFF",
            backgroundAlpha: 0.7,
            borderThickness: 1,
            borderAlpha: 0.8
        },

        // the defaults below are set using CSS syntax, you can use any existing css property
        // if you don't use Stock chart, you can delete lines below
        PeriodSelector: {
            color: "#FFFFFF"
        },

        PeriodButton: {
            color: "#FFFFFF",
            background: "transparent",
            opacity: 0.7,
            border: "1px solid rgba(0, 0, 0, .3)",
            MozBorderRadius: "5px",
            borderRadius: "5px",
            margin: "1px",
            outline: "none",
            boxSizing: "border-box"
        },

        PeriodButtonSelected: {
            color: "#FFFFFF",
            backgroundColor: "#b9cdf5",
            border: "1px solid rgba(0, 0, 0, .3)",
            MozBorderRadius: "5px",
            borderRadius: "5px",
            margin: "1px",
            outline: "none",
            opacity: 1,
            boxSizing: "border-box"
        },

        PeriodInputField: {
            color: "#FFFFFF",
            background: "transparent",
            border: "1px solid rgba(0, 0, 0, .3)",
            outline: "none"
        },

        DataSetSelector: {
            color: "#FFFFFF",
            selectedBackgroundColor: "#b9cdf5",
            rollOverBackgroundColor: "#a8b0e4"
        },

        DataSetCompareList: {
            color: "#FFFFFF",
            lineHeight: "100%",
            boxSizing: "initial",
            webkitBoxSizing: "initial",
            border: "1px solid rgba(0, 0, 0, .3)"
        },

        DataSetSelect: {
            border: "1px solid rgba(0, 0, 0, .3)",
            outline: "none"
        }

    };
}

function ValueInstance(title, valuePath) {
    this.type = "INSTANCE";
    this.title = title;
    this.valuePath = valuePath;
}

function ValueCollection(collectionPath, titlePath, valuePath) {
    this.type = "COLLECTION";
    this.collectionPath = collectionPath;
    this.titlePath = titlePath;
    this.valuePath = valuePath;
}

function TableCollection(collectionPath, titlePath, values) {
    this.collectionPath = collectionPath;
    this.titlePath = titlePath;
    this.values = values;
}

function TableValue(title, valuePath) {
    this.title = title;
    this.valuePath = valuePath;
}

function PrototypeCollection(collectionPath, titlePrefix, titlePath, titleSuffix) {
    this.collectionPath = collectionPath;
    this.titlePrefix = titlePrefix;
    this.titlePath = titlePath;
    this.titleSuffix = titleSuffix;
}

function PathArrayEntry(conditions, result) {
    this.type = "ARRAY";
    this.conditions = conditions;
    this.result = result;
}

function PathObjectEntry(result) {
    this.type = "OBJECT";
    this.result = result;
}

function PathValueEntry() {
    this.type = "OTHER";
}

function Set() {
    this.values = {};
}
Set.prototype.add = function (value) {
    this.values[value] = true;
};
Set.prototype.toArray = function () {
    var result = [];
    for (var key in this.values) {
        if (this.values.hasOwnProperty(key)) {
            result.push(key);
        }
    }
    return result;
};