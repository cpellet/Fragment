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
	closePopup();
	const nb = JSON.parse(window.sessionStorage.getItem('nb'));
	for (const cellData of nb.cells) {
		addCell(false, cellData.language, cellData.code, cellData.res);
	}
}
function preparePopup() {
	if (window.sessionStorage.getItem('nb')) {
		const pickup = document.querySelectorAll(".pickup");
		pickup.forEach((e) => e.classList.remove("pickup"));
	}
}

function closePopup() {
	const containers = document.querySelectorAll(".container");
	containers.forEach((e) => e.classList.remove("blur"));
	const modal = document.querySelector(".modal");
	modal.classList.remove("open");
}

function showPopup() {
	preparePopup();
	const containers = document.querySelectorAll(".container");
	containers.forEach((e) => e.classList.add("blur"));
	const modal = document.querySelector(".modal");
	modal.classList.add("open");
}

preparePopup();

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

function removeAllCells() {
	let nbc = document.querySelector("#notebook-contents");
	nbc.innerHTML = '';
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
	saveState();
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

function lnb() {
	console.log(JSON.stringify(getNotebookAsObject()));
}

function loadExample(number) {
	removeAllCells();
	for (const cellData of examples[number].cells) {
		addCell(false, cellData.language, cellData.code, cellData.res);
	}
	closePopup();
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

const examples = [{ "cells": [{ "language": "javascript", "code": "//Fragment can run JS\nalert(\"1+1=\"+(1+1))", "res": "" }, { "language": "python", "code": "for i in range(5):\n  print(i) #Python is also supported", "res": "0\n1\n2\n3\n4\n" }, { "language": "html", "code": "# And markdown too!", "res": "<h1 id=\"and-markdown-too!\">And markdown too!</h1>\n" }] }, { "cells": [{ "language": "html", "code": "<h2 style=\"color:blue;\">This is a Blue Heading</h2>", "res": "<h2 style=\"color:blue\">This is a Blue Heading</h2>" }, { "language": "html", "code": "Newton postulated that $\\vec { F } = m \\vec { a }$.", "res": "<div>Newton postulated that <span class=\"math-inline \">\n<mjx-container class=\"MathJax\" jax=\"SVG\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"7.982ex\" height=\"2.534ex\" role=\"img\" focusable=\"false\" viewBox=\"0 -1038 3527.9 1120\" style=\"vertical-align: -0.186ex;\"><g stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" transform=\"matrix(1 0 0 -1 0 0)\"><g data-mml-node=\"math\"><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mover\"><g data-mml-node=\"mi\"><path data-c=\"46\" d=\"M48 1Q31 1 31 11Q31 13 34 25Q38 41 42 43T65 46Q92 46 125 49Q139 52 144 61Q146 66 215 342T285 622Q285 629 281 629Q273 632 228 634H197Q191 640 191 642T193 659Q197 676 203 680H742Q749 676 749 669Q749 664 736 557T722 447Q720 440 702 440H690Q683 445 683 453Q683 454 686 477T689 530Q689 560 682 579T663 610T626 626T575 633T503 634H480Q398 633 393 631Q388 629 386 623Q385 622 352 492L320 363H375Q378 363 398 363T426 364T448 367T472 374T489 386Q502 398 511 419T524 457T529 475Q532 480 548 480H560Q567 475 567 470Q567 467 536 339T502 207Q500 200 482 200H470Q463 206 463 212Q463 215 468 234T473 274Q473 303 453 310T364 317H309L277 190Q245 66 245 60Q245 46 334 46H359Q365 40 365 39T363 19Q359 6 353 0H336Q295 2 185 2Q120 2 86 2T48 1Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(287.3, 224)\"><path data-c=\"20D7\" d=\"M377 694Q377 702 382 708T397 714Q404 714 409 709Q414 705 419 690Q429 653 460 633Q471 626 471 615Q471 606 468 603T454 594Q411 572 379 531Q377 529 374 525T369 519T364 517T357 516Q350 516 344 521T337 536Q337 555 384 595H213L42 596Q29 605 29 615Q29 622 42 635H401Q377 673 377 694Z\"></path></g></g></g><g data-mml-node=\"mo\" transform=\"translate(1065.1, 0)\"><path data-c=\"3D\" d=\"M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z\"></path></g><g data-mml-node=\"mi\" transform=\"translate(2120.9, 0)\"><path data-c=\"6D\" d=\"M21 287Q22 293 24 303T36 341T56 388T88 425T132 442T175 435T205 417T221 395T229 376L231 369Q231 367 232 367L243 378Q303 442 384 442Q401 442 415 440T441 433T460 423T475 411T485 398T493 385T497 373T500 364T502 357L510 367Q573 442 659 442Q713 442 746 415T780 336Q780 285 742 178T704 50Q705 36 709 31T724 26Q752 26 776 56T815 138Q818 149 821 151T837 153Q857 153 857 145Q857 144 853 130Q845 101 831 73T785 17T716 -10Q669 -10 648 17T627 73Q627 92 663 193T700 345Q700 404 656 404H651Q565 404 506 303L499 291L466 157Q433 26 428 16Q415 -11 385 -11Q372 -11 364 -4T353 8T350 18Q350 29 384 161L420 307Q423 322 423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 181Q151 335 151 342Q154 357 154 369Q154 405 129 405Q107 405 92 377T69 316T57 280Q55 278 41 278H27Q21 284 21 287Z\"></path></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(2998.9, 0)\"><g data-mml-node=\"mover\"><g data-mml-node=\"mi\"><path data-c=\"61\" d=\"M33 157Q33 258 109 349T280 441Q331 441 370 392Q386 422 416 422Q429 422 439 414T449 394Q449 381 412 234T374 68Q374 43 381 35T402 26Q411 27 422 35Q443 55 463 131Q469 151 473 152Q475 153 483 153H487Q506 153 506 144Q506 138 501 117T481 63T449 13Q436 0 417 -8Q409 -10 393 -10Q359 -10 336 5T306 36L300 51Q299 52 296 50Q294 48 292 46Q233 -10 172 -10Q117 -10 75 30T33 157ZM351 328Q351 334 346 350T323 385T277 405Q242 405 210 374T160 293Q131 214 119 129Q119 126 119 118T118 106Q118 61 136 44T179 26Q217 26 254 59T298 110Q300 114 325 217T351 328Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(14.5, -15)\"><path data-c=\"20D7\" d=\"M377 694Q377 702 382 708T397 714Q404 714 409 709Q414 705 419 690Q429 653 460 633Q471 626 471 615Q471 606 468 603T454 594Q411 572 379 531Q377 529 374 525T369 519T364 517T357 516Q350 516 344 521T337 536Q337 555 384 595H213L42 596Q29 605 29 615Q29 622 42 635H401Q377 673 377 694Z\"></path></g></g></g></g></g></svg></mjx-container></span>.</div>\n" }, { "language": "html", "code": "\\begin{align*}\nt _ { 1 } + t _ { 2 } = \\frac { ( 2 L / c ) \\sqrt { 1 - u ^ { 2 } / c ^ { 2 } } } { 1 - u ^ { 2 } / c ^ { 2 } } = \\frac { 2 L / c } { \\sqrt { 1 - u ^ { 2 } / c ^ { 2 } } }\n\\end{align*}", "res": "<div><span class=\"math-block \">\n<mjx-container class=\"MathJax\" jax=\"SVG\" display=\"true\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"43.665ex\" height=\"9.367ex\" role=\"img\" focusable=\"false\" viewBox=\"0 -2320 19299.8 4140\" style=\"vertical-align: -4.118ex;\"><g stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" transform=\"matrix(1 0 0 -1 0 0)\"><g data-mml-node=\"math\"><g data-mml-node=\"mtable\"><g data-mml-node=\"mtr\"><g data-mml-node=\"mtd\"><g data-mml-node=\"msub\"><g data-mml-node=\"mi\"><path data-c=\"74\" d=\"M26 385Q19 392 19 395Q19 399 22 411T27 425Q29 430 36 430T87 431H140L159 511Q162 522 166 540T173 566T179 586T187 603T197 615T211 624T229 626Q247 625 254 615T261 596Q261 589 252 549T232 470L222 433Q222 431 272 431H323Q330 424 330 420Q330 398 317 385H210L174 240Q135 80 135 68Q135 26 162 26Q197 26 230 60T283 144Q285 150 288 151T303 153H307Q322 153 322 145Q322 142 319 133Q314 117 301 95T267 48T216 6T155 -11Q125 -11 98 4T59 56Q57 64 57 83V101L92 241Q127 382 128 383Q128 385 77 385H26Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(361, -150) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"31\" d=\"M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z\"></path></g></g></g><g data-mml-node=\"mo\" transform=\"translate(986.8, 0)\"><path data-c=\"2B\" d=\"M56 237T56 250T70 270H369V420L370 570Q380 583 389 583Q402 583 409 568V270H707Q722 262 722 250T707 230H409V-68Q401 -82 391 -82H389H387Q375 -82 369 -68V230H70Q56 237 56 250Z\"></path></g><g data-mml-node=\"msub\" transform=\"translate(1987, 0)\"><g data-mml-node=\"mi\"><path data-c=\"74\" d=\"M26 385Q19 392 19 395Q19 399 22 411T27 425Q29 430 36 430T87 431H140L159 511Q162 522 166 540T173 566T179 586T187 603T197 615T211 624T229 626Q247 625 254 615T261 596Q261 589 252 549T232 470L222 433Q222 431 272 431H323Q330 424 330 420Q330 398 317 385H210L174 240Q135 80 135 68Q135 26 162 26Q197 26 230 60T283 144Q285 150 288 151T303 153H307Q322 153 322 145Q322 142 319 133Q314 117 301 95T267 48T216 6T155 -11Q125 -11 98 4T59 56Q57 64 57 83V101L92 241Q127 382 128 383Q128 385 77 385H26Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(361, -150) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g><g data-mml-node=\"mo\" transform=\"translate(3029.3, 0)\"><path data-c=\"3D\" d=\"M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z\"></path></g><g data-mml-node=\"mfrac\" transform=\"translate(4085.1, 0)\"><g data-mml-node=\"mrow\" transform=\"translate(220, 1000.5)\"><g data-mml-node=\"mo\"><path data-c=\"28\" d=\"M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z\"></path></g><g data-mml-node=\"mn\" transform=\"translate(389, 0)\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g><g data-mml-node=\"mi\" transform=\"translate(889, 0)\"><path data-c=\"4C\" d=\"M228 637Q194 637 192 641Q191 643 191 649Q191 673 202 682Q204 683 217 683Q271 680 344 680Q485 680 506 683H518Q524 677 524 674T522 656Q517 641 513 637H475Q406 636 394 628Q387 624 380 600T313 336Q297 271 279 198T252 88L243 52Q243 48 252 48T311 46H328Q360 46 379 47T428 54T478 72T522 106T564 161Q580 191 594 228T611 270Q616 273 628 273H641Q647 264 647 262T627 203T583 83T557 9Q555 4 553 3T537 0T494 -1Q483 -1 418 -1T294 0H116Q32 0 32 10Q32 17 34 24Q39 43 44 45Q48 46 59 46H65Q92 46 125 49Q139 52 144 61Q147 65 216 339T285 628Q285 635 228 637Z\"></path></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(1570, 0)\"><g data-mml-node=\"mo\"><path data-c=\"2F\" d=\"M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z\"></path></g></g><g data-mml-node=\"mi\" transform=\"translate(2070, 0)\"><path data-c=\"63\" d=\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(2503, 0)\"><path data-c=\"29\" d=\"M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z\"></path></g><g data-mml-node=\"msqrt\" transform=\"translate(2892, 0)\"><g transform=\"translate(1020, 0)\"><g data-mml-node=\"mn\"><path data-c=\"31\" d=\"M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(722.2, 0)\"><path data-c=\"2212\" d=\"M84 237T84 250T98 270H679Q694 262 694 250T679 230H98Q84 237 84 250Z\"></path></g><g data-mml-node=\"msup\" transform=\"translate(1722.4, 0)\"><g data-mml-node=\"mi\"><path data-c=\"75\" d=\"M21 287Q21 295 30 318T55 370T99 420T158 442Q204 442 227 417T250 358Q250 340 216 246T182 105Q182 62 196 45T238 27T291 44T328 78L339 95Q341 99 377 247Q407 367 413 387T427 416Q444 431 463 431Q480 431 488 421T496 402L420 84Q419 79 419 68Q419 43 426 35T447 26Q469 29 482 57T512 145Q514 153 532 153Q551 153 551 144Q550 139 549 130T540 98T523 55T498 17T462 -8Q454 -10 438 -10Q372 -10 347 46Q345 45 336 36T318 21T296 6T267 -6T233 -11Q189 -11 155 7Q103 38 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(572, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(2698, 0)\"><g data-mml-node=\"mo\"><path data-c=\"2F\" d=\"M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z\"></path></g></g><g data-mml-node=\"msup\" transform=\"translate(3198, 0)\"><g data-mml-node=\"mi\"><path data-c=\"63\" d=\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(433, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g></g><g data-mml-node=\"mo\" transform=\"translate(0, 109.5)\"><path data-c=\"221A\" d=\"M1001 1150Q1017 1150 1020 1132Q1020 1127 741 244L460 -643Q453 -650 436 -650H424Q423 -647 423 -645T421 -640T419 -631T415 -617T408 -594T399 -560T385 -512T367 -448T343 -364T312 -259L203 119L138 41L111 67L212 188L264 248L472 -474L983 1140Q988 1150 1001 1150Z\"></path></g><rect width=\"4034.6\" height=\"60\" x=\"1020\" y=\"1199.5\"></rect></g></g><g data-mml-node=\"mrow\" transform=\"translate(2176, -793.9)\"><g data-mml-node=\"mn\"><path data-c=\"31\" d=\"M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(722.2, 0)\"><path data-c=\"2212\" d=\"M84 237T84 250T98 270H679Q694 262 694 250T679 230H98Q84 237 84 250Z\"></path></g><g data-mml-node=\"msup\" transform=\"translate(1722.4, 0)\"><g data-mml-node=\"mi\"><path data-c=\"75\" d=\"M21 287Q21 295 30 318T55 370T99 420T158 442Q204 442 227 417T250 358Q250 340 216 246T182 105Q182 62 196 45T238 27T291 44T328 78L339 95Q341 99 377 247Q407 367 413 387T427 416Q444 431 463 431Q480 431 488 421T496 402L420 84Q419 79 419 68Q419 43 426 35T447 26Q469 29 482 57T512 145Q514 153 532 153Q551 153 551 144Q550 139 549 130T540 98T523 55T498 17T462 -8Q454 -10 438 -10Q372 -10 347 46Q345 45 336 36T318 21T296 6T267 -6T233 -11Q189 -11 155 7Q103 38 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(572, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(2698, 0)\"><g data-mml-node=\"mo\"><path data-c=\"2F\" d=\"M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z\"></path></g></g><g data-mml-node=\"msup\" transform=\"translate(3198, 0)\"><g data-mml-node=\"mi\"><path data-c=\"63\" d=\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(433, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g></g><rect width=\"8146.6\" height=\"60\" x=\"120\" y=\"220\"></rect></g><g data-mml-node=\"mo\" transform=\"translate(12749.4, 0)\"><path data-c=\"3D\" d=\"M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z\"></path></g><g data-mml-node=\"mfrac\" transform=\"translate(13805.2, 0)\"><g data-mml-node=\"mrow\" transform=\"translate(1690.3, 710)\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g><g data-mml-node=\"mi\" transform=\"translate(500, 0)\"><path data-c=\"4C\" d=\"M228 637Q194 637 192 641Q191 643 191 649Q191 673 202 682Q204 683 217 683Q271 680 344 680Q485 680 506 683H518Q524 677 524 674T522 656Q517 641 513 637H475Q406 636 394 628Q387 624 380 600T313 336Q297 271 279 198T252 88L243 52Q243 48 252 48T311 46H328Q360 46 379 47T428 54T478 72T522 106T564 161Q580 191 594 228T611 270Q616 273 628 273H641Q647 264 647 262T627 203T583 83T557 9Q555 4 553 3T537 0T494 -1Q483 -1 418 -1T294 0H116Q32 0 32 10Q32 17 34 24Q39 43 44 45Q48 46 59 46H65Q92 46 125 49Q139 52 144 61Q147 65 216 339T285 628Q285 635 228 637Z\"></path></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(1181, 0)\"><g data-mml-node=\"mo\"><path data-c=\"2F\" d=\"M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z\"></path></g></g><g data-mml-node=\"mi\" transform=\"translate(1681, 0)\"><path data-c=\"63\" d=\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\"></path></g></g><g data-mml-node=\"msqrt\" transform=\"translate(220, -1279.5)\"><g transform=\"translate(1020, 0)\"><g data-mml-node=\"mn\"><path data-c=\"31\" d=\"M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z\"></path></g><g data-mml-node=\"mo\" transform=\"translate(722.2, 0)\"><path data-c=\"2212\" d=\"M84 237T84 250T98 270H679Q694 262 694 250T679 230H98Q84 237 84 250Z\"></path></g><g data-mml-node=\"msup\" transform=\"translate(1722.4, 0)\"><g data-mml-node=\"mi\"><path data-c=\"75\" d=\"M21 287Q21 295 30 318T55 370T99 420T158 442Q204 442 227 417T250 358Q250 340 216 246T182 105Q182 62 196 45T238 27T291 44T328 78L339 95Q341 99 377 247Q407 367 413 387T427 416Q444 431 463 431Q480 431 488 421T496 402L420 84Q419 79 419 68Q419 43 426 35T447 26Q469 29 482 57T512 145Q514 153 532 153Q551 153 551 144Q550 139 549 130T540 98T523 55T498 17T462 -8Q454 -10 438 -10Q372 -10 347 46Q345 45 336 36T318 21T296 6T267 -6T233 -11Q189 -11 155 7Q103 38 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(572, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g><g data-mml-node=\"TeXAtom\" data-mjx-texclass=\"ORD\" transform=\"translate(2698, 0)\"><g data-mml-node=\"mo\"><path data-c=\"2F\" d=\"M423 750Q432 750 438 744T444 730Q444 725 271 248T92 -240Q85 -250 75 -250Q68 -250 62 -245T56 -231Q56 -221 230 257T407 740Q411 750 423 750Z\"></path></g></g><g data-mml-node=\"msup\" transform=\"translate(3198, 0)\"><g data-mml-node=\"mi\"><path data-c=\"63\" d=\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\"></path></g><g data-mml-node=\"TeXAtom\" transform=\"translate(433, 363) scale(0.707)\" data-mjx-texclass=\"ORD\"><g data-mml-node=\"mn\"><path data-c=\"32\" d=\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\"></path></g></g></g></g><g data-mml-node=\"mo\" transform=\"translate(0, 109.5)\"><path data-c=\"221A\" d=\"M1001 1150Q1017 1150 1020 1132Q1020 1127 741 244L460 -643Q453 -650 436 -650H424Q423 -647 423 -645T421 -640T419 -631T415 -617T408 -594T399 -560T385 -512T367 -448T343 -364T312 -259L203 119L138 41L111 67L212 188L264 248L472 -474L983 1140Q988 1150 1001 1150Z\"></path></g><rect width=\"4034.6\" height=\"60\" x=\"1020\" y=\"1199.5\"></rect></g><rect width=\"5254.6\" height=\"60\" x=\"120\" y=\"220\"></rect></g></g></g></g></g></g></svg></mjx-container></span></div>\n" }, { "language": "html", "code": "```smiles\nOC(=O)c1cc(Cl)cs1\n```", "res": "<div><div class=\"smiles\"><svg id=\"smiles-kojwxcp43hvvlx4tn8j\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 220 127.12672683810355\" style=\"width: 219.741px; height: 127.127px; overflow: visible;\"><defs><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-1\" gradientUnits=\"userSpaceOnUse\" x1=\"150.46151007226712\" y1=\"74.62672683830438\" x2=\"177.7412893944333\" y2=\"58.876690643618545\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-3\" gradientUnits=\"userSpaceOnUse\" x1=\"147.62639759171003\" y1=\"106.1267167148518\" x2=\"147.62651007228516\" y2=\"74.62671671505262\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-5\" gradientUnits=\"userSpaceOnUse\" x1=\"153.2963975916739\" y1=\"106.1267369613553\" x2=\"153.29651007224902\" y2=\"74.62673696155613\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-7\" gradientUnits=\"userSpaceOnUse\" x1=\"123.18172752470842\" y1=\"58.87669623014641\" x2=\"150.46151007226712\" y2=\"74.62672683830438\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-9\" gradientUnits=\"userSpaceOnUse\" x1=\"94.97650990823949\" y1=\"65.22784567002171\" x2=\"117.99786694114023\" y2=\"54.97810809466351\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-11\" gradientUnits=\"userSpaceOnUse\" x1=\"94.40503123358248\" y1=\"71.68886819934416\" x2=\"123.18172752470842\" y2=\"58.87669623014641\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-13\" gradientUnits=\"userSpaceOnUse\" x1=\"119.88911608143324\" y1=\"27.54925283168801\" x2=\"123.18172752470842\" y2=\"58.87669623014641\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-15\" gradientUnits=\"userSpaceOnUse\" x1=\"73.32744339845839\" y1=\"48.27978254755868\" x2=\"94.40503123358248\" y2=\"71.68886819934416\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-17\" gradientUnits=\"userSpaceOnUse\" x1=\"89.07747400661633\" y1=\"21\" x2=\"119.88911608143324\" y2=\"27.54925283168801\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-19\" gradientUnits=\"userSpaceOnUse\" x1=\"42\" y1=\"51.5723939908339\" x2=\"73.32744339845839\" y2=\"48.27978254755868\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-21\" gradientUnits=\"userSpaceOnUse\" x1=\"79.81280731783473\" y1=\"48.386809802271245\" x2=\"92.41283180436109\" y2=\"26.5629837642243\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient><linearGradient id=\"line-kojwxcp43hvvlx4tn8j-23\" gradientUnits=\"userSpaceOnUse\" x1=\"73.32744339845839\" y1=\"48.27978254755868\" x2=\"89.07747400661633\" y2=\"21\"><stop stop-color=\"currentColor\" offset=\"20%\"></stop><stop stop-color=\"currentColor\" offset=\"100%\"></stop></linearGradient></defs><mask id=\"text-mask-kojwxcp43hvvlx4tn8j\"><rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" fill=\"white\"></rect><circle cx=\"177.7412893944333\" cy=\"58.876690643618545\" r=\"7.875\" fill=\"black\"></circle><circle cx=\"150.461397591692\" cy=\"106.12672683810355\" r=\"7.875\" fill=\"black\"></circle><circle cx=\"42\" cy=\"51.5723939908339\" r=\"7.875\" fill=\"black\"></circle><circle cx=\"119.88911608143324\" cy=\"27.54925283168801\" r=\"7.875\" fill=\"black\"></circle></mask><style>\n                .element-kojwxcp43hvvlx4tn8j {\n                    font: 14px Helvetica, Arial, sans-serif;\n                    alignment-baseline: 'middle';\n                }\n                .sub-kojwxcp43hvvlx4tn8j {\n                    font: 8.4px Helvetica, Arial, sans-serif;\n                }\n            </style><g mask=\"url(#text-mask-kojwxcp43hvvlx4tn8j)\"><line x1=\"150.46151007226712\" y1=\"74.62672683830438\" x2=\"177.7412893944333\" y2=\"58.876690643618545\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-1')\"></line><line x1=\"147.62639759171003\" y1=\"106.1267167148518\" x2=\"147.62651007228516\" y2=\"74.62671671505262\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-3')\"></line><line x1=\"153.2963975916739\" y1=\"106.1267369613553\" x2=\"153.29651007224902\" y2=\"74.62673696155613\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-5')\"></line><line x1=\"123.18172752470842\" y1=\"58.87669623014641\" x2=\"150.46151007226712\" y2=\"74.62672683830438\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-7')\"></line><line x1=\"94.97650990823949\" y1=\"65.22784567002171\" x2=\"117.99786694114023\" y2=\"54.97810809466351\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-9')\"></line><line x1=\"94.40503123358248\" y1=\"71.68886819934416\" x2=\"123.18172752470842\" y2=\"58.87669623014641\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-11')\"></line><line x1=\"119.88911608143324\" y1=\"27.54925283168801\" x2=\"123.18172752470842\" y2=\"58.87669623014641\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-13')\"></line><line x1=\"73.32744339845839\" y1=\"48.27978254755868\" x2=\"94.40503123358248\" y2=\"71.68886819934416\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-15')\"></line><line x1=\"89.07747400661633\" y1=\"21\" x2=\"119.88911608143324\" y2=\"27.54925283168801\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-17')\"></line><line x1=\"42\" y1=\"51.5723939908339\" x2=\"73.32744339845839\" y2=\"48.27978254755868\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-19')\"></line><line x1=\"79.81280731783473\" y1=\"48.386809802271245\" x2=\"92.41283180436109\" y2=\"26.5629837642243\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-21')\"></line><line x1=\"73.32744339845839\" y1=\"48.27978254755868\" x2=\"89.07747400661633\" y2=\"21\" style=\"stroke-linecap:round;stroke-dasharray:none;stroke-width:1.26\" stroke=\"url('#line-kojwxcp43hvvlx4tn8j-23')\"></line></g><g><text x=\"173.8037893944333\" y=\"64.12669064361855\" class=\"element-kojwxcp43hvvlx4tn8j\" fill=\"currentColor\" style=\"\n                text-anchor: start;\n                writing-mode: horizontal-tb;\n                text-orientation: mixed;\n                letter-spacing: normal;\n                direction: ltr;\n            \"><tspan>O</tspan><tspan style=\"unicode-bidi: plaintext;\">H</tspan></text><text x=\"177.7412893944333\" y=\"58.876690643618545\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"150.46151007226712\" y=\"74.62672683830438\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"145.211397591692\" y=\"111.37672683810355\" class=\"element-kojwxcp43hvvlx4tn8j\" fill=\"currentColor\" style=\"\n                text-anchor: start;\n                writing-mode: horizontal-tb;\n                text-orientation: mixed;\n                letter-spacing: normal;\n                direction: ltr;\n            \"><tspan>O</tspan></text><text x=\"150.461397591692\" y=\"106.12672683810355\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"123.18172752470842\" y=\"58.87669623014641\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"94.40503123358248\" y=\"71.68886819934416\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"73.32744339845839\" y=\"48.27978254755868\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"47.25\" y=\"56.8223939908339\" class=\"element-kojwxcp43hvvlx4tn8j\" fill=\"currentColor\" style=\"\n                text-anchor: start;\n                writing-mode: horizontal-tb;\n                text-orientation: mixed;\n                letter-spacing: normal;\n                direction: rtl; unicode-bidi: bidi-override;\n            \"><tspan style=\"\n                unicode-bidi: plaintext;\n                writing-mode: lr-tb;\n                letter-spacing: normal;\n                text-anchor: start;\n            \">Cl</tspan></text><text x=\"42\" y=\"51.5723939908339\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"89.07747400661633\" y=\"21\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text><text x=\"115.95161608143324\" y=\"32.79925283168801\" class=\"element-kojwxcp43hvvlx4tn8j\" fill=\"currentColor\" style=\"\n                text-anchor: start;\n                writing-mode: horizontal-tb;\n                text-orientation: mixed;\n                letter-spacing: normal;\n                direction: ltr;\n            \"><tspan>S</tspan></text><text x=\"119.88911608143324\" y=\"27.54925283168801\" class=\"debug\" fill=\"#ff0000\" style=\"\n                font: 5px Droid Sans, sans-serif;\n            \"></text></g></svg></div></div>" }, { "language": "html", "code": "\\begin{figure}[h]\n\\includegraphics[width=0.5\\textwidth, center]{https://cdn.mathpix.com/snip/images/MJT22mwBq-bwqrOYwhrUrVKxO3Xcu4vyHSabfbG8my8.original.fullsize.png}\n\\end{figure}", "res": "<div class=\"table \" style=\"text-align: center\">\n<div class=\"figure_img\" style=\"text-align: center; \"><img src=\"https://cdn.mathpix.com/snip/images/MJT22mwBq-bwqrOYwhrUrVKxO3Xcu4vyHSabfbG8my8.original.fullsize.png\" style=\"width: 600px; \"></div></div>\n" }] }]