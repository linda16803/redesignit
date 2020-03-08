/**
 * @copyright Itential, LLC 2015
 *
 * props_config.js
 */
/* eslint-disable no-console */

var getPropsPromise = utilities.http('GET', '/config/property');
var inputArea;
var currentView;
var props;
var resetButton;
var saveButton;
var adapterMsg;

window.onload = function() {
	var tabList = document.getElementById('tab-list');
	inputArea = document.getElementById('input-area');
	resetButton = document.getElementById('reset');
	saveButton = document.getElementById('save');

	resetButton.disabled = true;
	saveButton.disabled = true;

	getPropsPromise
	.then(function(res) {
		var newLi;
		var description;
		var first = true;
		props = res;

		for (var propKey in props) {
			newLi = document.createElement('li');
			description = props[propKey].description || propKey;

			newLi.innerHTML = '<input type="radio" id="' + propKey
			+ '" name="current-view" onclick="switchView();"'
			+ (first ? ' checked' : '')
			+ '><label for="' + propKey + '">' + description + '</label>';

			if (first) {
				currentView = propKey;
				inputArea.value = JSON.stringify(props[propKey], null, 2);
				first = false;
			}

			tabList.appendChild(newLi);
		}

		// Default adapter ui message to hidden
		adapterMsg = document.getElementsByClassName('adapter-msg')[0];
		adapterMsg.style.display = 'none';
	})
	.catch(handleError);
};

function switchView() {
	currentView = document.querySelector('input[name="current-view"]:checked').id;
	var formActions = document.getElementsByClassName('form-actions')[0];
	inputArea.value = JSON.stringify(props[currentView], null, 2);
	if (currentView === 'adapterProps') {
		formActions.style.display = 'none';
		adapterMsg.style.display = 'block';		
	} else {
		formActions.style.display = 'block';
		adapterMsg.style.display = 'none';
		resetButton.disabled = true;
		saveButton.disabled = true;
	}
}

function enableButtons() {
	resetButton.disabled = false;
	saveButton.disabled = false;
}

function save() {
	var newProps = props;

	try {
		newProps[currentView] = JSON.parse(inputArea.value);
	} catch(parseError) {
		utilities.toast('Change is Invalid', parseError.toString().substr(13), 'error', 10000);
		return;
	}

	saveButton.className = 'primary-action processing';
	utilities.http('POST', '/config/property/update', {
		property_obj: newProps
	})
	.then(function() {
		props = newProps;
		saveButton.className = 'primary-action save';
		resetButton.disabled = true;
		saveButton.disabled = true;
		utilities.toast('Success', 'Sucessfully saved ' + currentView, 'success', 5000);
	})
	.catch(handleError);
}

function reset() {
	inputArea.value = JSON.stringify(props[currentView], null, 2);
}

function handleError(error) {
	utilities.toast('Error', error, 'error', 5000);
}