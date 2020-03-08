/**
 * @copyright Itential, LLC 2015
 *
 * user_config.js
 */
/* eslint-disable no-console */

app.controller('UserConfig', ["$scope", "$http", "$window", "$timeout", "$q", "$mdToast", "$mdDialog", "$filter", function($scope, $http, $window, $timeout, $q, $mdToast, $mdDialog, $filter) {

    $scope.users = [];
    $scope.currentUser = {
        username: ""
    };
    $scope.filteredGroups = [];
    $scope.selfUsername = '';

    //Get all the users
    $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/users")
    .success(function(data, status, headers, config) {
        $scope.users = data.sort();

        // Get all the Groups
        $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/groups")
        .success(function(data, status, headers, config) {
            $scope.groups = data;
        }).error(function(data, status, headers, config) {
            console.log(data);
        });

    }).error(function(data, status, headers, config) {
        console.log(data);
    });

    $http.get('/whoami')
        .success(function(self) {
            $scope.selfUsername = self.username;
        })
        .error(console.log);

    //Focus on the selected user
    $scope.displayUser = function(user) {
        $scope.userModified = false;
        $scope.groupSearch = {};
        $scope.query.page = 1;
        $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/user/" + user)
            .success(function(data, status, headers, config) {
                $scope.currentUser = data;
                for (var i = 0; i < $scope.groups.length; i++) {
                    if (data.groups.indexOf($scope.groups[i]) !== -1) {
                        $scope.currentUser.groups.push({
                            group: $scope.groups[i],
                            ofUser: data.groups.indexOf($scope.groups[i]) !== -1,
                            originalOfUser: data.groups.indexOf($scope.groups[i]) !== -1
                        });
                    }
                }
                $scope.filteredGroups = $filter('orderBy')($scope.currentUser.groups, 'group', false);
                $scope.query.length = $scope.filteredGroups.length;
            }).error(function(data, status, headers, config) {
                console.log(data);
            });
    };

    $scope.addAllGroups = function(isChecked) {
        $scope.userModified = true;
        for (var i = 0; i < $scope.filteredGroups.length; i++) {
            $scope.filteredGroups[i].ofUser = isChecked;
        }
    };

    //passes the in group data to currentGroup.roles from rolesFiltered in jade view
    $scope.toggleInUser = function(group) {
        $scope.userModified = true;
        var found = $filter('filter')($scope.currentUser.groups, {
            group: group.group
        }, true)[0];

        if (found.ofUser) {
            found.ofUser = false;
            group.ofUser = true;
        } else {
            found.ofUser = true;
            group.ofUser = false;
        }
    };

    //TABLE PAGINATION FUNCTIONS
    $scope.query = {
        limit: 10,
        page: 1,
        length: 0
    };

    $scope.$watch(
        'query.page',
        function(n, o) {

            //set the begin and end to grab roles for the pagination
            var begin = (($scope.query.page - 1) * $scope.query.limit);
            var end = begin + $scope.query.limit;

            if ($scope.currentUser.groups) {

                // Coping roles, and filtering based on rolesFilter
                $scope.filteredGroups = $filter('filter')(angular.copy($scope.currentUser.groups), $scope.groupSearch);

                // Ordering and slicing the roles based on current page.
                $scope.filteredGroups = $filter('orderBy')($scope.filteredGroups, 'group', false).slice(begin, end);
            }
        },
        // Leave true, unless you have a reason
        true
    );

    // This will update the page numbering (10-20 of 31) whenever the live filter are changed.
    $scope.$watch(
        'groupSearch',
        function(n, o) {
            $scope.filteredGroups = angular.copy($scope.currentUser.groups);
            if ($scope.filteredGroups) {
                $scope.query.length = $filter('filter')($scope.filteredGroups, $scope.groupSearch).length;
            }
        },
        true
    );

    //TOAST FUNCTIONS
    //Display Toast
    function displayToast(content, time) {
        if (typeof time == "undefined") {
            time = 2500;
        }
        $mdToast.show(
            $mdToast.simple()
            .content(content)
            .position('bottom right')
            .hideDelay(time)
        );
    }
}]);