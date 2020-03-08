/**
 * @copyright Itential, LLC 2015
 *
 * login.js
 */
/* eslint-disable no-console */

var app = angular.module('PronghornLogin', []);

function checkBrowser() {
    var browserMatches = [
        {
            name: 'Firefox',
            mustContain: ['Firefox'],
            mustNotContain: ['Seamonkey']
        },
        {
            name: 'Chrome',
            mustContain: ['Chrome'],
            mustNotContain: ['Chromium']
        },
        {
            name: '.NET',
            mustContain: ['.NET'],
            mustNotContain: []
        },
        {
            name: 'Edge',
            mustContain: ['Edge'],
            mustNotContain: []
        }
    ];
    
    var userAgent = navigator.userAgent;
    var browserMatch = false;
    browserMatches.forEach( function(browser) {
        if (userAgent.search(browser.name) > 0) {
            browserMatch = true;
            if (browser.name === '.NET') {
                var rv = userAgent.indexOf('rv:');
                var check = parseInt(userAgent.substring(rv + 3, userAgent.indexOf('.', rv)), 10);
                if (check < 11) return false;
            }
            // Check all mustContain items for existence in userAgent
            browser.mustContain.forEach( function(id) {
                if (userAgent.search(id) < 0) browserMatch = false;
            });
            
            // Check all mustNotContain items for existence in userAgent
            browser.mustNotContain.forEach( function(id) {
                if (userAgent.search(id) > 0) browserMatch = false;
            });
            return browserMatch;
        }
    });
    return browserMatch;
}

app.controller('LoginController', function($scope, $http, $window, $location, $timeout) {
    var validityCheck = checkBrowser();
    // Check for browser compatability
    if (!validityCheck) {
        // Grab the login form element as a parent
        var loginBody = document.getElementById('warning');
        // Create a div for the message to be in
        var newAlert = document.createElement('div');
        newAlert.setAttribute('id', 'badBrowserAlert');
        newAlert.setAttribute('class', 'alertDiv');
        // Add the div to the login body
        loginBody.appendChild(newAlert);
        // Create the message as a p element
        var pElement = document.createElement('p');
        pElement.setAttribute('class', 'alertLabel');
        pElement.innerHTML = 'This browser is not supported! Functionality cannot be guaranteed.';
        // Add the p element to the div
        newAlert.appendChild(pElement);
    }

    $scope.username = "";
    $scope.password = "";

    var utilities = new PronghornUtils();

    // Instantiate the last page visited variable
    var referrer = null;

    if ($location["$$absUrl"].indexOf("logout=true") > -1) {
        $location.search('logout', null);
        $scope.loginMessage = "You have been logged out!";
        $timeout(function() {
            $scope.loginMessage = "";
        }, 3000);
    } else {
        // Get the last page visited before coming to login
        // referrer = getReferrer();
        referrer = utilities.getCookie("referrer");
    }

    // Send the login credentials
    $scope.submit = function(username, password) {
        if (username === "") {
            $scope.loginMessage = "Username Field Required";
        } else if (password === "") {
            $scope.loginMessage = "Password Field Required";
        } else {
            $scope.password = "";
            $scope.loginMessage = "... Attempting Login ...";

            var credentials = {
                user: {
                    username: username,
                    password: password
                }
            };

            var baseURL = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
            $http.post(baseURL + "/login", credentials)
                .success(function(data, status, headers, config) {
                    // Return to the referrer page if there is one
                    if (referrer == null) {
                        window.location.replace(baseURL + "/");
                    } else {
                        try {
                            window.location.replace(baseURL + decodeURIComponent(referrer));
                        } catch (err) {
                            window.location.replace(baseURL + "/");
                        }
                    }
                }).error(function(data, status, headers, config) {
                    $scope.loginMessage = "Invalid Credentials";
                });
        }
    };

}); //login controller
