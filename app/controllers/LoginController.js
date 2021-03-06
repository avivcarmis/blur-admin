(function () {
    'use strict';

    angular
        .module('BlurAdmin')
        .controller('LoginCtrl', ['$scope', '$rootScope', 'baSidebarService', '$state', '$stateParams', 'toastr', '$uibModal', 'utils', 'comparator',
            function ($scope, $rootScope, baSidebarService, $state, $stateParams, toastr, $uibModal, utils, comparator) {

                $("title").text($state.current.title);

                $scope.initialized = false;

                if (typeof(Storage) === "undefined") {
                    $rootScope.browserNotSupported = true;
                    angular.element(document).ready(function () {
                        $("#browserSupport").removeClass("hidden");
                    });
                    return;
                }

                $rootScope.AVATARS = [
                    {name: "abraham", title: "Neat Abraham"},
                    {name: "helen", title: "Organized Helen"},
                    {name: "holly", title: "Genius Holly"},
                    {name: "jim", title: "Furious Jim"},
                    {name: "jones", title: "Mr. Jones"},
                    {name: "leroy", title: "Experienced Leroy"},
                    {name: "natalie", title: "Vigorous Natalie"},
                    {name: "sandra", title: "Sweet Sandra"}
                ];

                $rootScope.COLORS = [
                    '#90b900',
                    '#40a1a0',
                    '#72ab57',
                    '#dfb81c',
                    '#e85656',
                    "#a5a5a5",
                    "#505050",
                    "#ececec"
                ];

                $rootScope.confirm = function (body, title, onYesCallback, onNoCallback) {
                    var modal = $uibModal.open({
                        animation: true,
                        templateUrl: 'app/confirm.html',
                        controller: 'ConfirmCtrl',
                        size: 'sm',
                        resolve: {
                            data: function () {
                                return {title: title, body: body};
                            }
                        }
                    });
                    modal.result.then(onYesCallback, onNoCallback);
                };

                $rootScope.reloadSidebar = function () {
                    baSidebarService.clearStaticItems();
                    for (var i = 0; i < $rootScope.profile.servers.length; i++) {
                        var server = $rootScope.profile.servers[i];
                        baSidebarService.addStaticItem({
                            title: server.title,
                            server: {
                                id: server.id,
                                title: server.title,
                                url: server.url,
                                method: server.method
                            },
                            enabled: server.enabled,
                            stateRef: 'monitor',
                            stateParams: {serverId: server.id}
                        });
                    }
                    baSidebarService.addStaticItem({
                        title: 'New Server',
                        icon: 'ion-android-add-circle',
                        enabled: true,
                        stateRef: 'edit'
                    });
                };

                $rootScope.toggleServerStatus = function (serverId) {
                    for (var i = 0; i < $rootScope.profile.servers.length; i++) {
                        var server = $rootScope.profile.servers[i];
                        if (server.id == serverId) {
                            server.enabled = !server.enabled;
                            $rootScope.saveProfile();
                            return;
                        }
                    }
                };

                $rootScope.currentState = function (state, params) {
                    return $state.current.name == state && (state == 'edit' ? true : comparator.test(params, $state.params));
                };

                $rootScope.export = function () {
                    $uibModal.open({
                        animation: true,
                        templateUrl: 'app/export.html',
                        controller: 'ImportExportCtrl',
                        size: 'md'
                    });
                };

                $rootScope.import = function () {
                    $uibModal.open({
                        animation: true,
                        templateUrl: 'app/import.html',
                        controller: 'ImportExportCtrl',
                        size: 'md'
                    });
                };

                $rootScope.getProfileById = function (id) {
                    for (var i = 0; i < $rootScope.allProfiles.length; i++) {
                        var profile = $rootScope.allProfiles[i];
                        if (profile.id == id) {
                            return profile;
                        }
                    }
                    return null;
                };

                $rootScope.saveProfile = function () {
                    var current = $scope.profile;
                    if (!current) {
                        return;
                    }
                    for (var i = 0; i < $rootScope.allProfiles.length; i++) {
                        var profile = $rootScope.allProfiles[i];
                        if (profile.id == current.id) {
                            $rootScope.allProfiles[i] = utils.cloneObject(current);
                            localStorage.setItem("allProfiles", JSON.stringify($rootScope.allProfiles));
                            $rootScope.reloadSidebar();
                            return;
                        }
                    }
                };

                $rootScope.removeProfile = function () {
                    var current = $scope.profile;
                    if (!current) {
                        return;
                    }
                    for (var i = 0; i < $rootScope.allProfiles.length; i++) {
                        var profile = $rootScope.allProfiles[i];
                        if (profile.id == current.id) {
                            $rootScope.allProfiles.splice(i, 1);
                            localStorage.setItem("allProfiles", JSON.stringify($rootScope.allProfiles));
                            return $rootScope.logout();
                        }
                    }
                };

                $rootScope.reloadProfile = function () {
                    var current = $scope.profile;
                    if (!current) {
                        return;
                    }
                    $rootScope.profile = utils.cloneObject($scope.getProfileById(current.id));
                    if (!$rootScope.profile) {
                        return;
                    }
                    $rootScope.reloadSidebar();
                };

                $rootScope.goHome = function () {
                    if ($rootScope.pendingRedirect) {
                        $state.go($rootScope.pendingRedirect.state, $rootScope.pendingRedirect.params);
                        $rootScope.pendingRedirect = null;
                        return;
                    }
                    if ($rootScope.profile.servers.length > 0) {
                        $state.go('monitor', {serverId: $rootScope.profile.servers[0].id});
                    }
                    else {
                        $state.go('edit');
                    }
                };

                $rootScope.logout = function () {
                    $rootScope.loggedIn = false;
                    localStorage.removeItem("activeProfileId");
                    $state.go('login');
                };

                $scope.login = function (profileId) {
                    $rootScope.profile = utils.cloneObject($scope.getProfileById(profileId));
                    if (!$rootScope.profile) {
                        toastr.error("This profile doesn't exist anymore", "Oops!");
                        $rootScope.loggedIn = false;
                        localStorage.removeItem("activeProfileId");
                        return;
                    }
                    localStorage.setItem("activeProfileId", profileId);
                    $rootScope.reloadSidebar();
                    $rootScope.loggedIn = true;
                    $rootScope.goHome();
                };

                $scope.register = function () {
                    var id = utils.guid();
                    $rootScope.allProfiles.push({
                        id: id,
                        name: "",
                        avatar: utils.random($rootScope.AVATARS).name,
                        color: utils.random($rootScope.COLORS),
                        servers: []
                    });
                    localStorage.setItem("allProfiles", JSON.stringify($rootScope.allProfiles));
                    $rootScope.firstProfileUpdate = true;
                    $rootScope.pendingRedirect = {state: "profile"};
                    $scope.login(id);
                };

                var allProfilesData = localStorage.getItem("allProfiles");
                $rootScope.allProfiles = allProfilesData ? JSON.parse(allProfilesData) : [];
                $rootScope.profile = null;

                var activeProfileId = localStorage.getItem("activeProfileId");
                if (activeProfileId) {
                    return $scope.login(activeProfileId);
                }

                $scope.initialized = true;

            }]);
})();