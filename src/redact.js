const redactedClassName = 'rdctt';
const selectors = ['P', 'SPAN', 'A', 'LI', 'TH', 'TD', 'DT', 'DL', 'H1', 'H2', 'H3', 'H4', 'H5', 'DIV', 'INPUT'];

let hostKey = document.location.host.replace(/[\.\:]/ig, '_');
let redactionRegex = null;

// Add redaction CSS style.
const style = document.createElement('style');
style.appendChild(document.createTextNode(''));
document.head.appendChild(style);

style.sheet.insertRule(
	`.${redactedClassName} { color: transparent !important; }`
);

style.sheet.insertRule(
	`.${redactedClassName}::selection { color: transparent !important; }`
);

function shouldCheckContent(target, mutationType) {
	return (
		mutationType === 'characterData' ||
		(target && selectors.some(tn => tn === target.tagName))
	);
}

function getHostRedactions(callback) {
	// Retrieves the saved redactions from storage and creates regular expression
	// for searching pages.
	chrome.storage.local.get([hostKey], result => {
		let redactions = result[hostKey] || [];
		if (redactions.length > 0) {
			redactionRegex = new RegExp('(' + redactions.join('|') + ')', 'i');
			callback();
		}
	});
}

function applyInitialRedactions() {
	// Add redaction class to elements already on the screen.
	Array.from(document.querySelectorAll(selectors.join()))
		.filter(e => shouldCheckContent(e) && e.childElementCount === 0 && redactionRegex.test(e.textContent))
		//.forEach(e => console.log(`${e} :: ${e.innerHTML}`));
		.forEach(e => e.innerHTML = e.innerHTML.replace(redactionRegex, `<span class="${redactedClassName}">$1</span>`));
	//.forEach(e => e.classList.add(redactedClassName));
}

getHostRedactions(applyInitialRedactions);

// Add class to elements that are added to DOM later
const observer = new MutationObserver(mutations => {
	if (redactionRegex !== null) {
		mutations
			.filter(
				m =>
					shouldCheckContent(m.target, m.type) &&
					m.target.childElementCount == 0 &&
					redactionRegex.test(m.target.textContent.trim())
			)
			.forEach(m => {
				console.log(m);
				const node = m.type === 'characterData' ? m.target.parentNode : m.target;
				if (node.classList) {
					node.classList.add(redactedClassName);
				}
			});
	}
});

const config = {
	attributes: false,
	characterData: true,
	childList: true,
	subtree: true
};

observer.observe(document.body, config);