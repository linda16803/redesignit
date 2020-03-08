

window.addEventListener('load', function() {
    getAppViewsPromise.then(function(appViews) {
        //sort the apps
        appViews.sort(function(a, b) {
            var a_title = a.title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");
            var b_title = b.title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");

            return (b_title > a_title) ? -1 : (a_title > b_title) ? 1 : 0;
        });

        var application_menu = document.getElementById("app-list");

        appViews.forEach(function(appView, i) {

            // Create the list element
            var li = document.createElement("li");
            li.className = "home-icon";

            // Button
            var button = document.createElement("button");
            button.setAttribute("title", appView.title.toUpperCase().replace(/_/g, " ").replace(/%/g, ""));

            button.onclick = function() {
                window.location.href = appView.path;
            };

            if (appView.icon) {
                var icon = document.createElement("div");
                icon.className = "icon";

                $.ajax({
                    url: appView.icon,
                    dataType: 'xml',
                    success: function(resXML) {
                        var svgNode = document.importNode(resXML.documentElement, true);

                        icon.appendChild(svgNode);
                    }
                });

                button.appendChild(icon);
            }
            var label = document.createElement("label");
            label.innerHTML = appView.title.toUpperCase().replace(/_/g, " ").replace(/%/g, "");
            button.appendChild(label);
            li.appendChild(button);

            // Append to the application-menu
            application_menu.appendChild(li);
        });
    })
    .catch(function(error) {
        console.log(error);
    });
});
