let currentUrl = null;
let hostKey = '';
let hiddenClass = 'hidden';

let requestPermissionsDiv = document.getElementById('requestPermissionsDiv');
let managePermissionsDiv = document.getElementById('managePermissionsDiv');

function checkPermissions() {
	chrome.permissions.contains({
		permissions: ['tabs'],
		origins: [`${currentUrl.origin}/`]
	}, checkPermissionsResult => {
		if (checkPermissionsResult) {
			initOrigin();
		} else {
			// Permissions not granted for current origin. Hookup onclick handler to request permissions.
			document.getElementById('originBtnSpan').innerText = currentUrl.origin;
			document.getElementById('requestPermissionsBtn').onclick = function requestPermissions() {
				chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
					chrome.permissions.request({
						permissions: ['tabs'],
						origins: [`${currentUrl.origin}/`]
					},
						result => {
							if (result) {
								initOrigin();
							}
						});
				});
			}
		}
	});
}

function initOrigin() {
	// Permissions are granted so display the management UI.
	requestPermissionsDiv.classList.add(hiddenClass);
	managePermissionsDiv.classList.remove(hiddenClass);
	document.getElementById('originTitleSpan').innerText = currentUrl.origin;

	// Get redactions from storage and display in list.
	chrome.storage.local.get(hostKey, result => {
		let redactedList = document.getElementById('redactedList');
		if (result.hasOwnProperty(hostKey)) {
			let redactions = result[hostKey] || [];
			for (var i = 0; i < redactions.length; i++) {
				let listItem = document.createElement('li');
				listItem.innerText = redactions[i]
				redactedList.appendChild(listItem);
			}
		}
	});
}

document.getElementById('addRedaction').onclick = function () {
	chrome.storage.local.get([hostKey], result => {
		let newRedactions = result[hostKey] || [];
		let newRedaction = document.getElementById('newRedaction').value.trim();
		newRedactions.push(newRedaction);
		let newState = {};
		newState[hostKey] = newRedactions;
		chrome.storage.local.set(newState);
	});

	// chrome.tabs.executeScript(null, {
	// 	file: 'redact.js'
	// });
}

document.getElementById('clearRedactions').onclick = function () {
	let newState = {};
	newState[hostKey] = [];
	chrome.storage.local.set(newState);
}

// Kick popup into motion.
chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
	currentUrl = new URL(tabs[0].url);
	hostKey = currentUrl.host.replace(/[\.\:]/ig, '_');
	checkPermissions();
});