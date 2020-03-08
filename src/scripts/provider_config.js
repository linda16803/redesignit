/**
 * @copyright Itential, LLC 2015
 *
 * provider_config.js
 */

app.controller('ProviderConfig', ['$scope', '$http', '$window', '$timeout', '$q', '$mdToast', '$mdDialog', '$filter', function($scope, $http, $window, $timeout, $q, $mdToast, $mdDialog, $filter) {
    $scope.providers = [];
    $scope.currentProvider = {};
    $scope.showDetails = false;
    $scope.newProviderBool = false;

    // Get all of the providers
    $scope.getProviderList = function (){
        $http.get(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/providers')
        .success(function(data, status, headers, config) {
            $scope.providers = data.sort();
        }).error(function(data, status, headers, config) {
            console.log(data);
        });
    };
    $scope.getProviderList();

    $scope.saveProvider = function() {
        var exportObj = $scope.currentProvider;
        // Check id against existing providers for new providers
        if ($scope.newProviderBool) {
            if ($scope.providers.indexOf(exportObj.id) > -1 ) {
                return displayToast("Failed to create new adapter: Duplicate Adapter Id");
            }
        }

        // save to mongo
        $http.put(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/providers/' + encodeURIComponent(exportObj.id), exportObj)
        .success(function(data, status, headers, config) {
            if ($scope.newProviderBool) {
                // Refresh provider navigation panel and display the newly added provider
                $scope.getProviderList();
                $scope.display($scope.currentProvider.id);
                displayToast("Adapter " + $scope.currentProvider.id + " added");
            } else {
                displayToast($scope.currentProvider.id + " updated, Restarting adapter ...");
            }

            $scope.providerModified = false;
        }).error(function(data, status, headers, config) {
            console.log(data);
        });
    };

    // Open clone provider modal and copy mongo data on submit (with new id)
    $scope.cloneProvider = function(provider) {
        $scope.modal = new PHUI.Modal({
            'title': 'CLONE ADAPTER',
            'body':
                `<div class='provider-modal'>Save as</br><input class='clone-input' id='cloneName' placeholder='Required'/></br><span class='blue-warning'> Page will redirect to new adapter.</span></div>`,
            'actions': {
                'cancel' : function() {},
                'create': function() {
                    var providerName = $scope.currentProvider.id;
                    var clonedProvider = $scope.currentProvider;

                    // Remove original id and replace it with user input
                    delete clonedProvider._id;
                    clonedProvider.id = document.getElementById('cloneName').value;

                    // Validate id input for empty or duplicates
                    if (!clonedProvider.id) {
                        return displayToast("Failed to clone adapter: Missing Adapter Id");
                    } else if ($scope.providers.indexOf(clonedProvider.id) > -1 ) {
                        return displayToast("Failed to clone adapter: Duplicate Adapter Id");
                    }

                    // Create new / PUT provider in mongo
                    $http.put(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/providers/' + encodeURIComponent(clonedProvider.id), clonedProvider)
                    .success(function(data, status, headers, config) {
                        $scope.getProviderList();
                        $scope.display(clonedProvider.id);
                        displayToast("Adapter " + clonedProvider.id + " cloned from " + providerName);
                    }).error(function(data, status, headers, config) {

                    });
                }
            }
        });
        $scope.modal.open();
        applyNewCSS();
    };

    $scope.editProvider = function(provider) {};

    $scope.deleteProvider = function(provider) {
        $scope.modal = new PHUI.Modal({
            'title': 'DELETE ADAPTER',
            'body':
                `<div class='provider-modal'>Are you sure you want to delete </br> the adapter:</br>` + provider + `</div>`,
            'actions': {
                'cancel' : function() {},
                'create': function() {
                    $http.delete(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + '/providers/' + encodeURIComponent(provider))
                    .success(function(data, status, headers, config) {
                        // Refresh provider navigation and hide table details
                        $scope.getProviderList();
                        $scope.showDetails = false;
                        displayToast("Adapter " + provider + " removed");

                    }).error(function(data, status, headers, config) {
                        $scope.getProviderList();
                        $scope.showDetails = false;
                    });
                }
            }
        });

        $scope.modal.open();
        applyNewCSS();

        // Keep PHUI's 'cancel' and 'create' css classes, while changing text
        document.getElementsByClassName('cancel')[0].innerHTML = 'NO';
        document.getElementsByClassName('create')[0].innerHTML = 'YES';
    };

    function displayToast(content, time) {
        if (typeof time == 'undefined') {
            time = 4500;
        }
        $mdToast.show(
            $mdToast.simple()
            .content(content)
            .position('bottom right')
            .hideDelay(time)
        );
    }

    // Get details for a provider
    $scope.display = function(provider) {
        $scope.showDetails = true;
        $scope.newProviderBool = false;
        $scope.providerModified = false;
        $http.get(window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/providers/' + encodeURIComponent(provider))
        .success(function(data, status, headers, config) {
            $scope.currentProvider = data;
            document.getElementById("editor-wrapper").innerHTML = "";

            var div = document.createElement("DIV");
            div.setAttribute("id", "editor");
            div.innerHTML = JSON.stringify(data,null,4);

            document.getElementById("editor-wrapper").appendChild(div);

            var editor = ace.edit('editor');
            editor.setTheme('ace/theme/clouds');
            editor.session.setMode('ace/mode/json');

            editor.on('change',function(changeEvent){
                var jsonVal = editor.getValue();
                $scope.providerModified = true;
                try {
                    $scope.currentProvider = JSON.parse(jsonVal);
                } catch (e) {
                    $scope.providerModified = false;
                }
                $scope.$apply();
            });
        }).error(function(data, status, headers, config) {
            console.log(data);
        });

    };

    $scope.addProvider = function () {
        $scope.providerModified = false;
        $scope.newProvider = { id:'', type:''};
        $scope.showDetails = true;
        $scope.newProviderBool = true;
    };

    function applyNewCSS(){
        // * Cannot use stylesheet: importing PHUI also imports PHUI css which overwrites provider.css
        var modalWindow = document.getElementsByClassName('modal-window')[0];
        var modalHeader = document.getElementsByClassName('modal-header')[0];
        var modalTitle = document.getElementsByClassName('modal-title')[0];
        var cancelButton = document.getElementsByClassName('cancel')[0];
        var createButton = document.getElementsByClassName('create')[0];
        var modalActions = document.getElementById('phui-modal-actions');
        document.querySelectorAll('[title=Modal-Close]')[0].style.display = 'none'; // Hide X button
        modalWindow.style.borderRadius = 0;
        modalHeader.style.borderRadius = 0;
        modalHeader.style.height = '40px';
        modalHeader.style.padding = '10px';
        modalTitle.style.fontWeight = 400;
        modalTitle.style.fontSize = '1.1em';
        cancelButton.style.width = '110px';
        cancelButton.style.padding = '5px';
        cancelButton.style.marginRight = '0';
        cancelButton.style.borderRadius = '1px';
        cancelButton.style.backgroundColor = '#DCDCDC';
        cancelButton.style.color = 'black';
        cancelButton.style.boxShadow = 'none';
        cancelButton.style.fontWeight = '400';
        cancelButton.style.fontSize = '15px';
        createButton.style.width = '110px';
        createButton.style.padding = '5px';
        createButton.style.borderRadius = '1px';
        createButton.style.backgroundColor = '#E06737';
        createButton.style.boxShadow = 'none';
        createButton.style.fontWeight = '400';
        createButton.style.fontSize = '15px';
        modalActions.style.padding = '10px 5px';
        modalActions.style.boxShadow = 'none';
    }

    // ace editor
    var defaultHTML = JSON.stringify({
        "id":"required",
        "type":"required",
        "properties":{}
    }, null, 4);
    document.getElementById("new-editor").innerHTML = defaultHTML;

    var newEditor = ace.edit('new-editor');
    newEditor.setTheme('ace/theme/terminal');
    newEditor.session.setMode('ace/mode/json');
    newEditor.on('change',function(e){
        var jsonVal = newEditor.getValue();
        $scope.providerModified = true;
        try {
            $scope.currentProvider = JSON.parse(jsonVal);
        } catch (e) {
            $scope.providerModified = false;
        }
        $scope.$apply();
    });




    /*********************************************************/
    /*********************** JQX TABLE ***********************/
    /*********************************************************/

    $scope.buildMongoTable = function(data) {
        $scope.mongoData = [];
        $scope.currentProvider = data;
        var index = 0;
        if (data.properties && data.properties.constructor === Object && Object.keys(data.properties).length !== 0) {
            loopObject(data.properties, null);
        } else {
            $scope.mongoData = [
                {
                    Property:'N/A',
                    Datatype:'N/A',
                    Value:'N/A',
                    Index:0,
                    ChildOf:null
                }
            ];
        }

        // Build the initial table with Schema
        $scope.buildSchemaTable();

        // Build table rows from mongo in the same order as schema tables
        function loopObject (obj, parent) {
            for (property in obj) {
                var type = typeof(obj[property]);
                var value = obj[property];

                if (Array.isArray(obj[property])) {
                    type = 'array';
                    value = JSON.stringify(obj[property],null,4);
                }
                var parentIndex = index;
                var row = {
                    Property: property,
                    Datatype: type,
                    Value: value,
                    Index: index,
                    ChildOf: parent
                };
                index++;

                if (type === 'object') {
                    row.Datatype = null;
                    row.Value = null;

                    // Recursively add table rows until (type !== object)
                    loopObject(obj[property], parentIndex);
                }
                $scope.mongoData.push(row);
            }
        }


        $scope.tableData.forEach((function(row, i){

            // Replace schema default values with mongo values
            if($scope.mongoData[i] && $scope.mongoData[i].Value && $scope.mongoData[i].Property === row.Property) {
                row.Value = $scope.mongoData[i].Value;
            }

            /* If-Then validation + css style change using 'parent row' */
            if (row.If && row.If.properties && !inFlight) {

                // Key defined in the "If" object from the schema
                keyToCheck = Object.keys(row.If.properties)[0];

                // Loop through tableData rows and find the child with the same key as keyToCheck
                $scope.tableData.forEach(function(childToCheck){
                    if (childToCheck.Property === keyToCheck && childToCheck.ChildOf === row.Index ) {

                        // Check the found child's value against the "enum"" defined in the "If" object from schema
                        if(row.If.properties.type.enum.indexOf(childToCheck.Value) > -1){

                            // Find all required keys from the "Then" object if the "If" condition is met, and set required to true
                            $scope.tableData.forEach(function(child,i){
                                if (child.ChildOf === row.Index && row.Then.required.indexOf(child.Property) > -1) {
                                    child.required = true;
                                }
                            });
                        }
                    }
                });
            }
        }));

        var source = prepareSource($scope.tableData);
        $scope.dataAdapter = new $.jqx.dataAdapter(source);
        $scope.providerModified = false;
        $scope.mongoToJQX(false);

        // Allow to save provider when a row has been edited
        $('#providerTree').on('rowEndEdit', function (e) {
            $scope.providerModified = true;
            setTimeout(function(){
                $scope.mongoToJQX(false);
                lockRows($('#providerTree'));
            },10);
            $scope.$apply();
        });

        lockRows($('#providerTree'));
    };


    // Make rows uneditable if it is a parent element && type is an object
    function lockRows (tree) {
        var rowsExpanded = [];
        var lockedRows = [];

        $scope.tableData.forEach( function(row) {
            // Converted rows' datatype is null instead of 'object'
            if (row.Datatype === null || row.Datatype === 'N/A'){
                tree.jqxTreeGrid('lockRow', row.Index);
            }
        });
        /* rowClickCollapse(tree) */
    }


/** Collapse and expand rows onClick for uneditable rows (parents)
 * @deprecated
 */
    function rowClickCollapse (tree) {
        tree.on('rowClick', function(e){
            if (lockedRows.indexOf(e.args.key) > -1) {
                if (rowsExpanded.indexOf(e.args.key) === -1) {
                    // Timeouts added for clicking on collapse-arrows
                    setTimeout(function(){
                        tree.jqxTreeGrid('expandRow', e.args.key);
                        rowsExpanded.push(e.args.key);
                    },30);
                } else {
                    setTimeout(function(){
                        tree.jqxTreeGrid('collapseRow', e.args.key);
                        rowsExpanded.splice(rowsExpanded.indexOf(e.args.key), 1);
                    },30);
                }
            }
        });
    }

    var inFlight = false;
    $scope.mongoToJQX = function(bool) {
        inFlight = bool;
        var sortedRows = [...$scope.tableData].sort( function (a,b) {
            return a.Index - b.Index;
        });

        // Assign appropriate css class
        var cellClass = function (row, dataField, cellText, rowData) {
            if (sortedRows[rowData.Index].required) {
                return "required-value";
            }
            return "provider-value";
        };


        $('#providerTree').jqxTreeGrid({
            source: $scope.dataAdapter,
            editable:true,
            enableHover: false,
            ready: function() {
                lockRows($('#providerTree'));
            },
            columns: [
                { text: 'Property', dataField: 'Property', editable:false, width: 200,disabled:true},
                { text: 'Datatype',  dataField: 'Datatype', editable:false, width: 200 ,disabled:true},
                { text: 'Value', dataField: 'Value', width: 360, cellClassName: cellClass, columnType:"custom",

                    // If enum is given my schema, or data type is a boolean make the editor a dropdown ---- default otherwise
                    createEditor: function (rowKey, cellvalue, editor, cellText, width, height) {
                        inFlight = true;
                        var row = $("#providerTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            var dropDownList = $("<div class='dropDownList' style='border: none;'></div>").appendTo(editor);
                            dropDownList.jqxDropDownList({width: '100%', height: '100%', autoDropDownHeight: true, source: row.Enum });
                        }
                        var input = $("<input class='textbox' style='border: none;'/>").appendTo(editor);
                        input.jqxInput({ width: '100%', height: '100%' });
                    },

                    initEditor: function (rowKey, cellvalue, editor, celltext, width, height) {
                        var row = $("#providerTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            $(editor.find('.dropDownList')).val(cellvalue);
                        }
                        $(editor.find('.textbox')).val(cellvalue);
                    },

                    getEditorValue: function (rowKey , cellvalue, editor) {
                        var row = $("#providerTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            $scope.ifThen(row, true);
                            return $(editor.find('.dropDownList')).val();
                        } else if (row.Datatype === "integer") {
                            var number = parseFloat($(editor.find('.textbox')).val());
                            if (isNaN(number)) {
                                return 0;
                            }
                            return number;
                        }
                        return $(editor.find('.textbox')).val();
                    }
                }
            ]
        });
    };

    /* If-Then validation and css style change using 'child row' */
    $scope.ifThen = function (row, recursive) {
        if (row.parent && row.parent.If && row.parent.If.properties) {

            // Key to check if condtion against
            var ifKey = Object.keys(row.parent.If.properties)[0];

            // Values to check if condtion against
            var ifArray = row.parent.If.properties[ifKey].enum;

            var then = row.parent.Then;
            if (then.required) {

                // Loop through records of parent and compare it to required in "then" statement
                row.parent.records.forEach( function(child) {
                    if (then.required.indexOf(child.Property) > -1) {

                        // Loop through tableData to re render jqx table
                        $scope.tableData.forEach( function(targetRow){

                            // Index key check is needed (different from array order due to nesting)
                            ifArray.forEach( function(enumCheck) {
                                if (targetRow.Index === child.Index) {
                                    if (row.Value === enumCheck) {
                                        targetRow.required = true;
                                    } else {
                                        targetRow.required = false;
                                    }

                                    if (!inFlight) {
                                        if ($scope.newProviderBool) {
                                            $scope.schemaToJQX(true);
                                        } else {
                                            $scope.mongoToJQX(true);
                                        }
                                    }
                                }
                            });
                        });
                    }
                });
            }
        }
    };

    // Convert JSON schema into a jqx table
    $scope.buildSchemaTable = function () {
        $scope.providerModified = true;
        $scope.tableData = [];
        var index = 0;

        if (data.properties) {
            loopSchema(data.properties, null);
        } else {
            $scope.tableData = [
                {
                    Property:'N/A',
                    Datatype:'N/A',
                    Value:'N/A',
                    Index:0,
                    ChildOf:null
                }
            ];
        }

        function loopSchema (obj, parent) {
            for (property in obj) {
                var type = typeof(obj[property]);
                var value = obj[property];

                if (Array.isArray(obj[property])) {
                    type = 'array';
                    value = JSON.stringify(obj[property], null, 4);
                }

                var row = {
                    Property: property,
                    Datatype: value.type,
                    Value: value.default,
                    Index: index,
                    ChildOf: parent,
                    Enum:value.enum || null,
                    RequiredChildren:obj[property].required || null,
                    If:obj[property].if || null,
                    Then:obj[property].then || null
                };

                if (row.Datatype === "boolean") {
                    row.Enum = [ "true", "false" ];
                }

                index++;
                if (type === 'object' && obj[property].properties){
                    row.Datatype = null;
                    row.Value = null;
                    loopSchema(obj[property].properties, index-1);
                }
                $scope.tableData.push(row);
            }
        }

        // After converting schema into rows, get the rows with required children,
        // compare property of children with the values inside requiredChildren array
        // Set row.required to true if all conditions are met
        $scope.tableData.forEach ( function(row){
            if (row.RequiredChildren) {
                row.RequiredChildren.forEach( function(requiredField){
                    $scope.tableData.forEach( function(childRow){
                        if (childRow.Property === requiredField) {
                            childRow.required =  true;
                        }
                    });
                });
            }
        });

        var source = prepareSource($scope.tableData);
        $scope.dataAdapter = new $.jqx.dataAdapter(source);
        $scope.schemaToJQX();

    };
    $scope.schemaToJQX = function (bool){
        inFlight = bool;
        var sortedRows = [...$scope.tableData].sort( function (a,b) {
            return a.Index - b.Index;
        });

        var cellClass = function (row, dataField, cellText, rowData) {
            if(sortedRows[rowData.Index].required){
                return "required-value";
            }
            return "provider-value";
        };

        $('#newProviderTree').jqxTreeGrid({
            width:  '800px',
            source: $scope.dataAdapter,
            editable:true,
            enableHover: false,
            ready: function() {
                lockRows($('#newProviderTree'));
            },
            columns: [
                { text: 'Property', dataField: 'Property', editable:false, width: 200,disabled:true},
                { text: 'Datatype',  dataField: 'Datatype', editable:false, width: 200 ,disabled:true},
                { text: 'Value', dataField: 'Value', width: 360, cellClassName: cellClass, columnType:"custom",

                    createEditor: function (rowKey, cellvalue, editor, cellText, width, height) {
                        var row = $("#newProviderTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            var dropDownList = $("<div class='dropDownList' style='border: none;'></div>").appendTo(editor);
                            dropDownList.jqxDropDownList({width: '100%', height: '100%', autoDropDownHeight: true, source: row.Enum });
                        }
                        var input = $("<input class='textbox' style='border: none;'/>").appendTo(editor);
                        input.jqxInput({ width: '100%', height: '100%' });
                    },

                    initEditor: function (rowKey, cellvalue, editor, celltext, width, height) {
                        var row = $("#newProviderTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            $(editor.find('.dropDownList')).val(cellvalue);
                        }
                        $(editor.find('.textbox')).val(cellvalue);
                    },

                    getEditorValue: function (rowKey , cellvalue, editor) {
                        var row = $("#newProviderTree").jqxTreeGrid('getRow', rowKey);
                        if (row.Enum) {
                            $scope.ifThen(row, true);
                            return $(editor.find('.dropDownList')).val();
                        } else if (row.Datatype === "integer") {
                            var number = parseFloat($(editor.find('.textbox')).val());
                            if (isNaN(number)) {
                                return 0;
                            }
                            return number;
                        }
                        return $(editor.find('.textbox')).val();
                    }
                }
            ]
        });
    };

    function prepareSource (tableData) {
        return {
            dataType: 'json',
            dataFields: [
                { name: 'Index', type: 'number' },
                { name: 'ChildOf', type: 'number' },
                { name: 'Property', type: 'string' },
                { name: 'Datatype', type: 'string' },
                { name: 'Value', type: 'string' },
                { name: 'Enum', type: 'array' },
                { name: 'required', type: 'boolean' },
                { name: 'If', type: 'object' },
                { name: 'Then', type: 'object' }
            ],
            hierarchy:
            {
                keyDataField: { name: 'Index' },
                parentDataField: { name: 'ChildOf' }
            },
            id: 'Index',
            localData: tableData
        };
    }

    var finishedRows = [];
    function jqxToMongo (obj) {
        // Loop through each row of the table
        $scope.dataArray.forEach( function (row) {
            var parentElement = $scope.dataArray[row.ChildOf];

            // If current row is not a child of any other row, add to the object
            if (parentElement === undefined && !(row.Property in obj)) {
                obj[row.Property] = row.Value || {};
                finishedRows[row.Index] = true;

            // Add the {property:value} to the parent within the object
            } else if (parentElement && (parentElement.Property in obj)) {
                obj[parentElement.Property][row.Property] = row.Value;
                if (row.Datatype === null && row.Value === null) {
                    obj[parentElement.Property][row.Property] = {};
                }
                finishedRows[row.Index] = true;

            // If parentElement is a child of another (grand)parent element, nest it under
            } else if (parentElement && parentElement.ChildOf) {
                var grandparent = $scope.dataArray[parentElement.ChildOf];
                obj[grandparent.Property][parentElement.Property][row.Property] = row.Value;
                finishedRows[row.Index] = true;
            }
        });

        // Recursively run this function until all rows have been added to the object.
        if (!finishedRows.every( x => x === true)) {
            jqxToMongo(obj);
        }
        return obj;
    }
}]);
