/**
 * @copyright Itential, LLC 2015
 *
 * layout.js
 */
/* eslint-disable no-console */

var app = angular.module('Pronghorn', ['ngMaterial', 'md.data.table', 'mp.colorPicker', 'ngSanitize', 'pascalprecht.translate'])
    .config(function($mdThemingProvider, $translateProvider) {
        function getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1);
                if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
            }
            return "english";
        }

        //Itential Palette Definition (ONLY 900 so far)
        $mdThemingProvider.definePalette('Itential', {
            '50': 'a3d4e2',
            '100': '85c6d8',
            '200': '66b7ce',
            '300': '48a9c5',
            '400': '299bbb',
            '500': '0b8db2',
            '600': '097b9b',
            '700': '086985',
            '800': '06586f',
            '900': '054659',
            'A100': 'ff8a80',
            'A200': 'ff5252',
            'A400': 'ff1744',
            'A700': 'd50000',
            'contrastDefaultColor': 'light'
        });

        $mdThemingProvider.theme('default')
            .primaryPalette('Itential', {
                'hue-1': '300',
                'default': '500',
                'hue-2': '700',
                'hue-3': '900'
            })
            .accentPalette('orange', {
                'default': '900'
            });

        var locale = getCookie("locale");
        $translateProvider.useUrlLoader('/getDictionary/' + locale);
        $translateProvider.preferredLanguage('en');
        $translateProvider.useMissingTranslationHandler('customTranslationHandler');
    });

app.factory('customTranslationHandler', function() {
    return function(missing_key, uses) {
        missing_key = missing_key.toLowerCase().replace(/%/g, "");
        missing_key = missing_key.charAt(0).toUpperCase() + missing_key.slice(1);
        return missing_key.replace(/_[A-Za-z0-9]*/g, function(txt) {
            return " " + txt.charAt(1).toUpperCase() + txt.substr(2).toLowerCase();
        });
    };
});

app.factory('UserFactory', function($http, $q) {
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return "";
    }


    return {
        getCurrentUser: function() {
            return $http.get(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/whoami')
                .then(function(response) {
                    return response.data.username;
                })
                .catch(function(e) {
                    return undefined;
                    //return $q.reject(e);
                });
        },
        getUserDetails: function() {
            return $http.get(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/whoami')
                .then(function(response) {
                    return response.data;
                })
                .catch(function(e) {
                    return undefined;
                    //return $q.reject(e);
                });
        }
    };
});

app.directive('restrict', ['$http', '$q', 'UserFactory', function($http, $q, UserFactory) {
    return {
        restrict: 'A',
        replace: true,
        link: function($scope, element, attrs) {
            UserFactory.getUserDetails().then(function(resp) {
                var key;
                var application = $scope.pathname.split('/')[1];
                var restriction = JSON.parse(attrs['restrict']);
                var roleResp = [];
                resp.groups.forEach(function(group) {
                    roleResp.push($http.get(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/config/group/" + group, {
                            cache: true
                        })
                        .success(function(data, status, headers, config) {
                            if (data.roles !== undefined) {
                                data.roles.forEach(function(role) {
                                    if (role.indexOf(application + '.') !== -1 && restriction.permit.indexOf(role.split('.')[1]) !== -1) {
                                        key = role.split('.')[1];
                                    }
                                });
                            }
                        }).error(function(data, status, headers, config) {
                            console.log('error', data);
                        }));
                });

                $q.all(roleResp).then(function() {
                    if (key === undefined) {
                        if (restriction['action'] === 'hide') {
                            element.addClass('ng-hide');
                        } else if (restriction['action'] === 'disable') {
                            element.unbind('click');
                        }
                    }
                });
            });
        }
    };
}]);



// This directive was added to fix the autofocus property for dialogs which is apparently broken in even recent version of angularjs
// The issue is that autofocus only works the first time the dialog is open, if you close and reopen the autofocus doesn't work
// This effectively replaces the default autofocus with a new one.
// https://github.com/angular-ui/bootstrap/issues/2802
app.directive('autofocus', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element) {
            $timeout(function() {
                $element[0].focus();
            });
        }
    };
}]);