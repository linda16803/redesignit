/**
 * @copyright Itential, LLC 2015
 *
 * profile.js
 */

var utilities = new PronghornUtils();
var urlPrefix = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
var username;

// fills in email input field with current user's email

utilities.http("get", urlPrefix + "/whoAmI")
.then(function(data) {
    username = data.username;
    utilities.http('get', urlPrefix + '/profile/' + data.username)
    .then(function(data) {
        if (data.email) {
            document.getElementById("email").value = data.email;
        } else {
            document.getElementById('email').placeholder = 'Enter email';
        }
    });
});

var closePage = function() {
    location.href = "/";
};

// updates the user profile with the email from the input field

var save = function() {
    var email = document.getElementById("email");
    var pattern = /\S+@\S+\.\S+/;
    if (pattern.test(email.value)) {
        document.getElementById('error-msg').className = "invisible";
        utilities.http("put", urlPrefix + "/profile/update", {email:email.value, username:username})
        .then(function(data) {
            if (data !== "no changes") {
                utilities.toast('Success', 'Profile updated', 'success', 4000);
            }
        }).catch(function(err) {
            utilities.toast('Error', 'Update failed', 'error', 4000);
        });
    } else {
        document.getElementById('error-msg').className = "input-error-msg";
    }
 };

