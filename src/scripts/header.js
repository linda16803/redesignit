

var utilities = new PronghornUtils();
var applications = [];
var user_info = {};
var isMenuVisible = false;

var getAppViewsPromise = utilities.getAppViewsForUser();
var server_url = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

// On window load
window.addEventListener('load', function() {
    // Populate applications
    getAppViewsPromise.then(populateApplications).catch(console.log);

    // Populate settings
    populateSettings();
    // Add click functionality to menus
    addMenuFunctionality(document.getElementsByClassName("menu-title"));

    // Close menus when clicking outside of them
    document.addEventListener("click", function(event) {
        var open_menus = document.getElementsByClassName("show-menu");

        for (var i = 0; i < open_menus.length; i++) {
            open_menus[i].classList.remove("show-menu");
            isMenuVisible = false;
        }
    });

    // Add logout button functionality
    document.getElementById("logout").addEventListener("click", function() {
        utilities.http("GET", window.location.protocol + "//" + window.location.host + "/logout")
        .then(function(response) {
            location.replace('/login?logout=true');
        })
        .catch(console.log);
    });
});

function addMenuFunctionality(menu_titles) {
    // For each menu title
    for (var i = 0; i < menu_titles.length; i++) {
        // Add click functionality
        menu_titles[i].addEventListener("click", showMenu);
    }
}

// Menu Behavior
// **** THIS IS IMPORTANT for full Nested Dropdown support such as used in Mobile View ****
function showMenu (event) {
    if( event.target.tagName !== "INPUT" ) {
        // Hide any Open siblings (.siblings) and their children (.find)
        $(event.currentTarget).parents().siblings().removeClass('show-menu').find('[class=show-menu]').removeClass('show-menu');
        // Show/hide clicked Menu
        $(event.currentTarget).parent().toggleClass('show-menu');
        // Note whether a Menu is Open
        isMenuVisible = ($(document).find("[class=show-menu]").length > 0);
    }
    event.stopPropagation();
}

function populateApplications (appViewsForUser) {
    var application_menu = document.getElementById("application-menu");

    //sort the apps
    appViewsForUser.sort(function(a,b){
        var a_title = a.title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");
        var b_title = b.title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");

        return (b_title>a_title) ? -1 : (a_title>b_title) ? 1 : 0;
    });

    for (var i = 0; i < appViewsForUser.length; i++) {

        if (appViewsForUser[i].title === "Active Jobs" && appViewsForUser[i].path === "/workflow_engine/jobs") {
            var workqueue_list_item = document.getElementById("activejobs");
            workqueue_list_item.innerHTML = "<a href='/workflow_engine/jobs'>Active Jobs</a>";
            continue;
        }

        var application_label = document.createElement("span");
        application_label.innerHTML = appViewsForUser[i].title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");

        // Create the clickable reference
        var application_redirect = document.createElement("a");
        application_redirect.setAttribute("href", server_url + appViewsForUser[i].path);

        // Create the list element
        var application_element = document.createElement("li");

        // Append to the application-menu
        application_redirect.appendChild(application_label);
        application_element.appendChild(application_redirect);
        application_menu.appendChild(application_element);
    }
}

// Get the user object for the logged in user and populate settings
function populateSettings () {
    utilities.http("GET", window.location.protocol + "//" + window.location.host + "/whoAmI")
    .then(function(user_info) {
        if (user_info.roles.indexOf("Pronghorn.admin") !== -1) {
            // Settings Title
            var settings_title = document.getElementById("settings-title");
            var settings_label = document.createElement("span");
            settings_label.innerText = 'SETTINGS';
            //Append to settings-title
            settings_title.appendChild(settings_label);

            //Settings Menu
            var settings_menu = document.getElementById("settings-menu");
            //Users
            var users_label = document.createElement("span");
            users_label.innerHTML = "USERS";
            var users_redirect = document.createElement("a");
            users_redirect.setAttribute("href", "/user_config/");
            //Groups
            var groups_label = document.createElement("span");
            groups_label.innerHTML = "GROUPS";
            var groups_redirect = document.createElement("a");
            groups_redirect.setAttribute("href", "/group_config/");
            //Providers
            var providers_label = document.createElement("span");
            providers_label.innerHTML = "ADAPTERS";
            var providers_redirect = document.createElement("a");
            providers_redirect.setAttribute("href", "/adapter_config/");
            //System
            var system_label = document.createElement("span");
            system_label.innerHTML = "SYSTEM";
            var system_redirect = document.createElement("a");
            system_redirect.setAttribute("href", "/host_status/");
            //Properties
            var props_label = document.createElement("span");
            props_label.innerHTML = "PROPERTIES";
            var props_redirect = document.createElement("a");
            props_redirect.setAttribute("href", "/props_config/");
            //Create the list element
            var settings_element = document.createElement("li");
            //Append to the settings-menu
            users_redirect.appendChild(users_label);
            groups_redirect.appendChild(groups_label);
            providers_redirect.appendChild(providers_label);
            system_redirect.appendChild(system_label);
            props_redirect.appendChild(props_label);
            settings_element.appendChild(users_redirect);
            settings_element.appendChild(groups_redirect);
            settings_element.appendChild(providers_redirect);
            settings_element.appendChild(system_redirect);
            settings_element.appendChild(props_redirect);
            settings_menu.appendChild(settings_element);
        }
        else {
            // User is not authorized to access the SETTINGS menu items.

            // Remove these items so the cursor does not change to a hand when hovering
            // over the location where the SETTINGS menu would have been located.
            var settingsTitle = document.getElementById("settings-title");
            settingsTitle.remove();
            var settingsMenu = document.getElementById("settings-menu");
            settingsMenu.remove();
        }

        // Add username
        var username_label = document.createElement("label");
        username_label.innerHTML = user_info.username;
        document.getElementById("username").appendChild(username_label);
    })
    .catch(console.log);
}
