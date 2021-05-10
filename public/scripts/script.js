let dropdowns = document.querySelectorAll(".navbar .dropdown-toggler");
let dropdownIsOpen = false;
if (dropdowns.length) {
	dropdowns.forEach((dropdown) => {
		dropdown.addEventListener("click", (event) => {
			let target = document.querySelector("#" + event.target.dataset.dropdown);

			if (target) {
				if (target.classList.contains("show")) {
					target.classList.remove("show");
					dropdownIsOpen = false;
				} else {
					target.classList.add("show");
					dropdownIsOpen = true;
				}
			}
		});
	});
}

window.addEventListener("mouseup", (event) => {
	if (dropdownIsOpen) {
		dropdowns.forEach((dropdownButton) => {
			let dropdown = document.querySelector(
				"#" + dropdownButton.dataset.dropdown
			);
			let targetIsDropdown = dropdown == event.target;

			if (dropdownButton == event.target) {
				return;
			}

			if (!targetIsDropdown && !dropdown.contains(event.target)) {
				dropdown.classList.remove("show");
			}
		});
	}
});

document.onkeydown = KeyPress;

let script = document.createElement('script');
script.src = "https://cdn.jsdelivr.net/npm/mathpix-markdown-it@1.0.40/es5/bundle.js";
document.head.append(script);

script.onload = function () {
	const isLoaded = window.loadMathJax();
	if (isLoaded) {
		console.log('Styles loaded!')
	}
}

const getMethods = (obj) => {
	let properties = new Set();
	let currentObj = obj;
	do {
		Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item));
	} while ((currentObj = Object.getPrototypeOf(currentObj)));
	return [...properties.keys()].filter(
		(item) => typeof obj[item] === "function"
	);
};

const notebookContents = document.querySelector("#notebook-contents");

var focusedElem;
var currentScriptLanguage = "javascript";

function loadState() {
	if (window.sessionStorage.getItem('nb')) {
		const nb = JSON.parse(window.sessionStorage.getItem('nb'));
		for (const cellData of nb.cells) {
			addCell(false, cellData.language, cellData.code, cellData.res);
		}
	}
}

loadState();

function addCell(above, language, code, result) {
	const cellContainer = document.createElement("div");
	const cellScript = document.createElement("div");
	const cellResult = document.createElement("div");

	cellContainer.classList.add("cell");
	cellScript.classList.add("cell-script");
	cellScript.classList.add("selected");
	cellResult.classList.add("cell-result");

	if (result) {
		cellResult.innerHTML = result;
	} else {
		cellResult.classList.add("hidden");
	}

	cellContainer.appendChild(cellScript);
	cellContainer.appendChild(cellResult);
	cellScript.appendChild(addScriptLanguagesButtons(language));
	cellContainer.appendChild(addMoveUpDownButtons());

	if (above) {
		notebookContents.insertBefore(cellContainer, focusedElem);
	} else {
		if (focusedElem === undefined) notebookContents.appendChild(cellContainer);
		else focusedElem.after(cellContainer);
	}
	const codeMirrorCell = CodeMirror(cellScript, {
		lineNumbers: false,
		lineWrapping: true,
		tabSize: 2,
		autoCloseBrackets: true,
		extraKeys: { "Ctrl-Space": "autocomplete" },
		value: "",
		autofocus: true,
		matchBrackets: true,
	});
	if (code) {
		codeMirrorCell.setValue(code);
	}
	switch (language) {
		case "javascript": {
			currentScriptLanguage = "javascript";
			codeMirrorCell.setOption(
				"mode",
				{
					name: "javascript",
					globalVars: true,
				}
			);
			break;
		}
		case "python": {
			currentScriptLanguage = "python";
			codeMirrorCell.setOption("mode", {
				name: "python",
				version: 3,
				globalVars: true,
			});
			break;
		}
		case "html": {
			currentScriptLanguage = "html";
			codeMirrorCell.setOption(
				"mode",
				{
					name: "html",
					globalVars: true,
				}
			);
			break;
		}

		default:
			break;
	}
	codeMirrorCell.on("focus", function (instance) {
		focusedElem = instance.getWrapperElement().parentNode.parentNode;
		focusedElem.firstChild.classList.add("selected");
	});
	codeMirrorCell.on("blur", function (instance) {
		instance.getWrapperElement().parentNode.classList.remove("selected");
	});
	codeMirrorCell.on("keyup", function (instance, evt) {
		/*Enables keyboard navigation in autocomplete list*/
		if (
			!instance.state.completionActive &&
			evt.key !== "Tab" &&
			evt.key !== "Enter" &&
			evt.key !== ";" &&
			evt.key !== ":" &&
			evt.key !== "}" &&
			evt.key !== ")" &&
			evt.key !== "ArrowRight" &&
			evt.key !== "ArrowLeft" &&
			evt.key !== "ArrowUp" &&
			evt.key !== "ArrowDown" &&
			evt.key !== "Escape" &&
			evt.key !== "Backspace" &&
			evt.key !== "Control" &&
			evt.key !== "Shift" &&
			evt.key !== "Alt"
		) {
			/*Enter - do not open autocomplete list just after item has been selected in it*/
			if (currentScriptLanguage === "python") {
				CodeMirror.commands.autocomplete(instance, null, {
					hint: getHintsPython,
					completeSingle: false,
				});
			} else {
				CodeMirror.commands.autocomplete(instance, null, {
					completeSingle: false,
				});
			}
		}
	});
	codeMirrorCell.focus();
	deleteSkeletonCells();
	saveState();
}

function addSkeletonCell(above, type) {
	const e = document.createElement("div");
	const t = document.createElement("a");
	e.classList.add("skeletonCell");
	t.classList.add("skeletonText");
	t.textContent = type;
	e.appendChild(t);
	if (above) {
		notebookContents.insertBefore(e, focusedElem);
	} else {
		notebookContents.appendChild(e);
	}
}

function deleteSkeletonCells(event) {
	for (let index = 0; index < notebookContents.children.length; index++) {
		if (notebookContents.children[index].classList.contains("skeletonCell")) {
			notebookContents.removeChild(notebookContents.children[index]);
		}
	}
}

function deleteCell() {
	if (notebookContents.childElementCount === 0) {
		focusedElem = undefined;
		focusedElem.remove();
	} else {
		const tempFocusedElement = focusedElem;
		focusedElem = focusedElem.previousSibling;
		tempFocusedElement.remove();
		focusedElem.firstChild.classList.add("selected");
		focusedElem.firstChild.firstChild.nextElementSibling.CodeMirror.focus();
	}

	removeDeleteSkeletons();
}

function getNotebookAsObject() {
	var nb = { cells: [] };
	let cells = document.querySelector("#notebook-contents").children;
	for (i = 0; i < cells.length; i++) {
		const resultCell = cells[i].firstChild.nextElementSibling;
		const cm = cells[i].firstChild.firstChild.nextElementSibling.CodeMirror
		const scriptValue = cm.getValue();
		const lang = cm.getOption("mode")['name'];
		const resCellContentsHTML = resultCell.innerHTML;
		nb.cells.push({
			language: lang, code: scriptValue, res: resCellContentsHTML
		});
	}
	return nb;
}

function saveState() {
	window.sessionStorage.setItem('nb', JSON.stringify((getNotebookAsObject())));
}

async function loadPython() {
	setLoadingStatus('Initialising...', 'orange');
	await loadPyodide({
		indexURL: "https://cdn.jsdelivr.net/pyodide/v0.17.0/full/"
	});
	await pyodide.runPythonAsync(`
    import sys
    import io
    sys.stdout = io.StringIO()
	`);

	displayPythonRuntimeInfo();
	setLoadingStatus('Ready', 'green');
}

loadPython();

function displayPythonRuntimeInfo() {
	document.getElementById('py-version').textContent = pyodide.runPython(`sys.version`);
	displayGlobals();
	displayLoadedPackages();
}

function displayGlobals() {
	const globals = pyodide.globals.toJs();
	const globalList = document.getElementById("py-global-varables");
	for (let element of globals) {
		const listItem = document.createElement("li");
		listItem.textContent = element[0];
		globalList.appendChild(listItem);
	}
}
function displayLoadedPackages() {
	const packages = pyodide.loadedPackages;
	const packagesList = document.getElementById("py-loaded-packages");
	for (let element in packages) {
		const listItem = document.createElement("li");
		listItem.textContent = element;
		packagesList.appendChild(listItem);
	}
}


async function runCell() {
	const resultCell = focusedElem.firstChild.nextElementSibling;
	const cm = focusedElem.firstChild.firstChild.nextElementSibling.CodeMirror
	const scriptValue = cm.getValue();

	setLoadingStatus('Computing...', 'orange');

	if (cm.getOption("mode")["name"] == "javascript") {
		resultCell.textContent = evaluate(scriptValue);
	} else if (cm.getOption("mode")["name"] == "html") {
		const options = {
			htmlTags: true
		};
		const html = window.markdownToHTML(scriptValue, options);
		resultCell.innerHTML = html;
	} else {
		await pyodide.runPythonAsync(scriptValue)
			.then(output => { resultCell.textContent = pyodide.runPython("sys.stdout.getvalue()") })
			.catch((err) => { resultCell.textContent = err })
		await pyodide.runPythonAsync(`sys.stdout = io.StringIO()`)
		displayGlobals();
		displayLoadedPackages();
	}

	if (scriptValue.replace(/ /g, "") !== "") {
		focusedElem.firstChild.classList.remove("selected");
		resultCell.classList.remove("hidden");
	}
	saveState();
	setLoadingStatus('Ready', 'green');
	const nextCell = focusedElem.parentNode.nextElementSibling.firstChild;
	if (nextCell) {
		nextCell.classList.add("selected");
		nextCell.firstChild.firstChild.focus();
	}
}

async function runAll() {
	let cells = document.querySelector("#notebook-contents").children;
	for (i = 0; i < cells.length; i++) {
		focusedElem = cells[i];
		await runCell();
	}
}


function evaluate(data) {
	let message = "";
	try {
		message = eval(data);
	} catch (e) {
		message = e;
	}
	return message;
}

function displayDeleteSkeleton() {
	focusedElem.classList.remove("selected");
	focusedElem.classList.add("markedForDeletion");
}

function removeDeleteSkeletons() {
	for (let index = 0; index < notebookContents.children.length; index++) {
		if (
			notebookContents.children[index].classList.contains("markedForDeletion")
		) {
			notebookContents.children[index].classList.remove("markedForDeletion");
		}
	}
}

function KeyPress(e) {
	var evtobj = window.event ? event : e;
	if (evtobj.keyCode === 8 && evtobj.ctrlKey) deleteCell();
	else if (evtobj.keyCode === 40 && evtobj.ctrlKey) addCell(false, "javascript");
	else if (evtobj.keyCode === 38 && evtobj.ctrlKey) addCell(true, "javascript");
	else if (evtobj.keyCode === 13 && evtobj.ctrlKey) {
		e.preventDefault();
		runCell();
	}
}

const mathMenu = document.querySelector("#mathfuncmenu");

getMethods(Math).forEach((e) => {
	addSubmenu(mathMenu, e);
});

function addSubmenu(menu, title) {
	const e = document.createElement("li");
	const a = document.createElement("a");
	a.textContent = title;
	e.appendChild(a);
	menu.appendChild(e);
}

// <div class="script-language-selector">
// 	<label>
// 		<i class="fab fa-js-square"></i>JS
// 	</label>
// 	<input
// 		type="radio"
// 		name="script-language"
// 		class="script-language-radio"
// 		value="js"
// 		checked
// 	/>
// 	<label>
// 		<i class="fab fa-python"></i>Py
// 	</label>
// 	<input
// 		type="radio"
// 		name="script-language"
// 		class="script-language-radio"
// 		value="py"
// 	/>
// 	<label>
// 		<i class="fab fa-html5"></i>HTML
// 	</label>
// 	<input
// 		type="radio"
// 		name="script-language"
// 		class="script-language-radio"
// 		value="html"
// 	/>
// </div>;

function addMoveUpDownButtons() {
	const arrowContainer = document.createElement("div");
	const upArrowContainer = document.createElement('div');
	const downArrowContainer = document.createElement('div');
	const upArrow = document.createElement("i");
	const downArrow = document.createElement("i");
	arrowContainer.classList.add("arrow-container");
	upArrow.classList.add("fas");
	upArrow.classList.add("fa-arrow-up");
	downArrow.classList.add("fas");
	downArrow.classList.add("fa-arrow-down");

	upArrowContainer.addEventListener('click', function (e) {
		let cell = e.target.parentNode.parentNode.parentNode.parentNode;
		let previousCell = cell.previousSibling;
		cell.parentNode.insertBefore(cell, previousCell);

		saveState();
	});
	downArrowContainer.addEventListener('click', function (e) {
		let cell = e.target.parentNode.parentNode.parentNode.parentNode;
		let nextCell = cell.nextElementSibling;
		cell.parentNode.insertBefore(nextCell, cell);

		saveState();
	});

	upArrowContainer.appendChild(upArrow);
	downArrowContainer.appendChild(downArrow);
	arrowContainer.appendChild(upArrowContainer);
	arrowContainer.appendChild(downArrowContainer);
	return arrowContainer;
}

function addScriptLanguagesButtons(type) {
	const buttonContainer = document.createElement("div");
	const jsLabel = document.createElement("label");
	const pyLabel = document.createElement("label");
	const htmlLabel = document.createElement("label");
	const runButton = document.createElement("a");
	const separator = document.createElement("span");

	separator.classList.add("separator");

	const randomId = generateRandomId();

	const jsIcon = document.createElement("i");
	const pyIcon = document.createElement("i");
	const htmlIcon = document.createElement("i");
	const runIcon = document.createElement("i");

	jsIcon.classList.add("script-language-icon");
	pyIcon.classList.add("script-language-icon");
	htmlIcon.classList.add("script-language-icon");

	const jsRadioBtn = document.createElement("input");
	const pyRadioBtn = document.createElement("input");
	const htmlRadioBtn = document.createElement("input");

	jsRadioBtn.type = "radio";
	pyRadioBtn.type = "radio";
	htmlRadioBtn.type = "radio";

	jsRadioBtn.name = "script-language-" + randomId;
	pyRadioBtn.name = "script-language-" + randomId;
	htmlRadioBtn.name = "script-language-" + randomId;

	jsRadioBtn.id = "javascript-" + randomId;
	pyRadioBtn.id = "python-" + randomId;
	htmlRadioBtn.id = "html-" + randomId;

	jsRadioBtn.classList.add("script-language-radio");
	jsRadioBtn.classList.add("javascript");
	pyRadioBtn.classList.add("script-language-radio");
	pyRadioBtn.classList.add("python");
	htmlRadioBtn.classList.add("script-language-radio");
	htmlRadioBtn.classList.add("html");

	jsRadioBtn.value = "javascript";
	if (type === "html") htmlRadioBtn.checked = true;
	else if (type === "python") pyRadioBtn.checked = true;
	else if (type === "javascript") jsRadioBtn.checked = true;
	pyRadioBtn.value = "python";
	htmlRadioBtn.value = "html";

	jsIcon.classList.add("fab");
	jsIcon.classList.add("fa-js-square");
	pyIcon.classList.add("fab");
	pyIcon.classList.add("fa-python");
	htmlIcon.classList.add("fab");
	htmlIcon.classList.add("fa-markdown");
	runIcon.classList.add("far");
	runIcon.classList.add("fa-play-circle");

	buttonContainer.classList.add("script-language-selector");

	runButton.classList.add("run-button");
	runButton.appendChild(runIcon);
	runButton.addEventListener("click", runCell);

	jsRadioBtn.addEventListener("change", function (evt) {
		changeScriptLanguage(evt, "javascript");
	});
	pyRadioBtn.addEventListener("change", function (evt) {
		changeScriptLanguage(evt, "python");
	});
	htmlRadioBtn.addEventListener("change", function (evt) {
		changeScriptLanguage(evt, "html");
	});

	jsLabel.appendChild(jsRadioBtn);
	pyLabel.appendChild(pyRadioBtn);
	htmlLabel.appendChild(htmlRadioBtn);

	jsLabel.htmlFor = "javascript-" + randomId;
	pyLabel.htmlFor = "python-" + randomId;
	htmlLabel.htmlFor = "html-" + randomId;

	jsLabel.appendChild(jsIcon);
	pyLabel.appendChild(pyIcon);
	htmlLabel.appendChild(htmlIcon);

	buttonContainer.appendChild(jsLabel);
	buttonContainer.appendChild(pyLabel);
	buttonContainer.appendChild(htmlLabel);
	buttonContainer.appendChild(separator);
	buttonContainer.appendChild(runButton);

	return buttonContainer;
}

function changeScriptLanguage(evt, language) {
	switch (language) {
		case "javascript": {
			currentScriptLanguage = "javascript";
			evt.target.parentNode.parentNode.nextElementSibling.CodeMirror.setOption(
				"mode",
				{
					name: "javascript",
					globalVars: true,
				}
			);
			break;
		}
		case "python": {
			currentScriptLanguage = "python";
			const codeMirror =
				evt.target.parentNode.parentNode.nextElementSibling.CodeMirror;
			codeMirror.setOption("mode", {
				name: "python",
				version: 3,
				globalVars: true,
			});
			break;
		}
		case "html": {
			currentScriptLanguage = "html";
			evt.target.parentNode.parentNode.nextElementSibling.CodeMirror.setOption(
				"mode",
				{
					name: "html",
					globalVars: true,
				}
			);
			break;
		}

		default:
			break;
	}
	saveState();
}

function getHintsPython(e) {
	var hints = CodeMirror.pythonHint(e);
	var anyHints = CodeMirror.hint.anyword(e);

	anyHints.list.forEach(function (hint) {
		if (hints.list.indexOf(hint) == -1) hints.list.push(hint);
	});

	hints.list.sort();

	if (hints) {
		CodeMirror.on(hints, "pick", function (word) {
			if (word.charAt(word.length - 1) == ")") editor.execCommand("goCharLeft");
		});
	}
	return hints;
}

function generateRandomId() {
	return Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
}


function setLoadingStatus(status, color) {
	const runStatus = document.getElementById('run-status');
	runStatus.textContent = status;
	runStatus.style.color = color;
}


function toggleExpand() {
	const expander = document.querySelector('.expander-icon');
	const bottomPanel = document.querySelector('.bottom-panel');
	if (expander.classList.contains('fa-chevron-up')) {
		bottomPanel.style.height = '20vh';
		expander.classList.replace('fa-chevron-up', 'fa-chevron-down');
	} else {
		bottomPanel.style.height = '0';
		expander.classList.replace('fa-chevron-down', 'fa-chevron-up');
	}
}