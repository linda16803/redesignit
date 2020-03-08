/**
 * @copyright Itential, LLC 2015
 *
 * group_config.js
 */
/* eslint-disable no-console */

app.controller('GroupConfig', ["$scope", "$http", "$window", "$timeout", "$q", "$mdToast", "$mdDialog", "$filter", function($scope, $http, $window, $timeout, $q, $mdToast, $mdDialog, $filter) {

    $scope.groups = [];
    $scope.currentGroup = {};
    $scope.roleSearch = {};
    $scope.allCheck = false;

    //Get all of the groups
    $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/groups")
        .success(function(data, status, headers, config) {
            $scope.groups = data.sort();

        }).error(function(data, status, headers, config) {
            console.log(data);
        });

    //Get all the roles
    $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/roles")
        .success(function(data, status, headers, config) {
            for (var i = 0; i < data.length; i++) {
                data[i].methods = data[i].methods.toString().replace(/,/g, ", ");
                data[i].views = data[i].views.toString().replace(/,/g, ", ");
            }
            $scope.roles = data;
        }).error(function(data, status, headers, config) {
            console.log(data);
        });

    //Focus on the details for a group
    $scope.display = function(group) {
        $scope.groupModified = false;
        $scope.rolesFilter = {};
        $scope.query.page = 1;

        $http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/group/" + group)
            .success(function(data, status, headers, config) {
                var role_list = data.roles;

                $scope.currentGroup = {
                    _id: data._id,
                    group: group,
                    name: group,
                    roles: angular.copy($scope.roles)
                };
                //set initial data for table pagination and filter
                // $scope.rolesFiltered = $scope.currentGroup.roles;
                $scope.rolesFiltered = $filter('orderBy')($scope.currentGroup.roles, 'package', false);
                $scope.query.length = $scope.rolesFiltered.length;

                for (var i = 0; i < $scope.currentGroup.roles.length; i++) {
                    if (role_list) {
                        $scope.currentGroup.roles[i].inGroup = role_list.indexOf($scope.currentGroup.roles[i].package + "." + $scope.currentGroup.roles[i].role) !== -1;
                    }
                }
            }).error(function(data, status, headers, config) {
                console.log(data);
            });
    };

    //passes the in group data to currentGroup.roles from rolesFiltered in jade view
    $scope.toggleInGroup = function(role) {
        $scope.groupModified = true;
        var found = $filter('filter')($scope.currentGroup.roles, {
            role: role.role,
            package: role.package
        }, true)[0];

        if (found.inGroup) {
            found.inGroup = false;
            role.inGroup = true;
        } else {
            found.inGroup = true;
            role.inGroup = false;
        }

    };

    //Add all the currently filtered roles to a group
    $scope.addAllRoles = function(roles, isChecked) {
        $scope.groupModified = true;
        if (Object.keys(roles).length !== 0) {
            for (var i = 0; i < $scope.rolesFiltered.length; i++) {
                if ($scope.rolesFiltered[i].package.indexOf(roles.package) !== -1) {
                    $scope.rolesFiltered[i].inGroup = isChecked;
                }
                if ($scope.rolesFiltered[i].role.indexOf(roles.role) !== -1) {
                    $scope.rolesFiltered[i].inGroup = isChecked;
                }
                if ($scope.rolesFiltered[i].methods.indexOf(roles.methods) !== -1) {
                    $scope.rolesFiltered[i].inGroup = isChecked;
                }
                if ($scope.rolesFiltered[i].views.indexOf(roles.views) !== -1) {
                    $scope.rolesFiltered[i].inGroup = isChecked;
                }
            }
            $scope.currentGroup.roles = $scope.rolesFiltered;
        } else {
            for (var j = 0; j < $scope.rolesFiltered.length; j++) {
                $scope.rolesFiltered[j].inGroup = isChecked;
            }
        }
    };

    //Remove additional groups information and save to the database
    $scope.saveGroup = function() {
        var group_info = angular.copy($scope.currentGroup);
        var active_roles = [];

        for (var i = 0; i < group_info.roles.length; i++) {
            if (group_info.roles[i].inGroup) {
                active_roles.push(group_info.roles[i].package + "." + group_info.roles[i].role);
            }
        }
        group_info.roles = active_roles;

        $http.post(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/group", {
                group: group_info
            })
            .success(function(data, status, headers, config) {
                displayToast("Group " + group_info.name + " Saved");
                $scope.groupModified = false;
            }).error(function(data, status, headers, config) {
                console.log(data);
            });
    };

    ///////////TABLE PAGINATION FUNCTIONS
    // Need to remember to set initial properties before entering this section
    //	$scope.rolesFiltered = $filter('orderBy')($scope.currentGroup.roles, 'package', false);
    //	$scope.query.length = $scope.rolesFiltered.length;
    /////////////////////////////////////

    $scope.query = {
        limit: 10,
        page: 1,
        length: 0
    };

    // Watching for any page changes and then updates the displayed rows based on the page change
    $scope.$watch(
        'query.page',
        function(n, o) {

            //set the begin and end to grab roles for the pagination
            var begin = (($scope.query.page - 1) * $scope.query.limit);
            var end = begin + $scope.query.limit;

            if ($scope.currentGroup.roles) {

                // Coping roles, and filtering based on rolesFilter
                $scope.rolesFiltered = $filter('filter')(angular.copy($scope.currentGroup.roles), $scope.rolesFilter);

                // Ordering and slicing the roles based on current page.
                $scope.rolesFiltered = $filter('orderBy')($scope.rolesFiltered, 'package', false).slice(begin, end);
            }
        },
        // Leave true, unless you have a reason
        true
    );

    // This will update the page numbering (10-20 of 31) whenever the live filter are changed.
    $scope.$watch(
        'rolesFilter',
        function(n, o) {
            $scope.rolesFiltered = angular.copy($scope.currentGroup.roles);
            if ($scope.rolesFiltered) {
                $scope.query.length = $filter('filter')($scope.rolesFiltered, $scope.rolesFilter).length;
            }
        },
        true
    );
    ///////////TABLE PAGINATION FUNCTIONS

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
