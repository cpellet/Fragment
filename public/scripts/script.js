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

function addCell(above, type) {
	const cellContainer = document.createElement("div");
	const cellScript = document.createElement("div");
	const cellResult = document.createElement("div");

	cellContainer.classList.add("cell");
	cellScript.classList.add("cell-script");
	cellScript.classList.add("selected");
	cellResult.classList.add("cell-result");
	cellResult.classList.add("hidden");

	cellContainer.appendChild(cellScript);
	cellContainer.appendChild(cellResult);
	cellScript.appendChild(addScriptLanguagesButtons());

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
	});

	if (type === "CODE") {
		codeMirrorCell.setOption("mode", { name: "javascript", globalVars: true });
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
			CodeMirror.commands.autocomplete(instance, null, {
				completeSingle: false,
			});
		}
	});
	codeMirrorCell.focus();
	deleteSkeletonCells();
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
		console.log(focusedElem);
		focusedElem.firstChild.classList.add("selected");
		focusedElem.firstChild.firstChild.CodeMirror.focus();
	}

	removeDeleteSkeletons();
}

function runCell() {
	const resultCell = focusedElem.firstChild.nextElementSibling;
	const scriptValue = focusedElem.firstChild.firstChild.nextElementSibling.CodeMirror.getValue();

	resultCell.textContent = evaluate(scriptValue);
	if (scriptValue.replace(/ /g, "") !== "") {
		focusedElem.firstChild.classList.remove("selected");
		resultCell.classList.remove("hidden");
	}

	const nextCell = focusedElem.parentNode.nextElementSibling.firstChild;
	if (nextCell) {
		nextCell.classList.add("selected");
		nextCell.firstChild.firstChild.focus();
	}
}

function evaluate(data) {
	return eval(data);
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
	else if (evtobj.keyCode === 40 && evtobj.ctrlKey && evtobj.shiftKey)
		addCell(false, "MARKDOWN");
	else if (evtobj.keyCode === 38 && evtobj.ctrlKey && evtobj.shiftKey)
		addCell(true, "MARKDOWN");
	else if (evtobj.keyCode === 40 && evtobj.ctrlKey) addCell(false, "CODE");
	else if (evtobj.keyCode === 38 && evtobj.ctrlKey) addCell(true, "CODE");
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

function addScriptLanguagesButtons() {
	const buttonContainer = document.createElement("div");
	const jsLabel = document.createElement("label");
	const pyLabel = document.createElement("label");
	const htmlLabel = document.createElement("label");
	const runButton = document.createElement("button");

	const jsIcon = document.createElement("i");
	const pyIcon = document.createElement("i");
	const htmlIcon = document.createElement("i");

	jsIcon.classList.add("script-language-icon");
	pyIcon.classList.add("script-language-icon");
	htmlIcon.classList.add("script-language-icon");

	const jsText = document.createElement("span");
	const pyText = document.createElement("span");
	const htmlText = document.createElement("span");

	const jsRadioBtn = document.createElement("input");
	const pyRadioBtn = document.createElement("input");
	const htmlRadioBtn = document.createElement("input");

	jsRadioBtn.type = "radio";
	pyRadioBtn.type = "radio";
	htmlRadioBtn.type = "radio";

	jsRadioBtn.name = "script-language";
	pyRadioBtn.name = "script-language";
	htmlRadioBtn.name = "script-language";

	jsRadioBtn.classList.add("script-language-radio");
	pyRadioBtn.classList.add("script-language-radio");
	htmlRadioBtn.classList.add("script-language-radio");

	jsRadioBtn.value = "js";
	jsRadioBtn.checked = true;
	pyRadioBtn.value = "py";
	htmlRadioBtn.value = "html";

	jsIcon.classList.add("fab");
	jsIcon.classList.add("fa-js-square");
	pyIcon.classList.add("fab");
	pyIcon.classList.add("fa-python");
	htmlIcon.classList.add("fab");
	htmlIcon.classList.add("fa-html5");

	buttonContainer.classList.add("script-language-selector");

	jsText.textContent = "JS";
	pyText.textContent = "Py";
	htmlText.textContent = "HTML";

	runButton.textContent = "Run";
	runButton.addEventListener("click", runCell);

	jsLabel.appendChild(jsIcon);
	jsLabel.appendChild(jsText);
	pyLabel.appendChild(pyIcon);
	pyLabel.appendChild(pyText);
	htmlLabel.appendChild(htmlIcon);
	htmlLabel.appendChild(htmlText);

	buttonContainer.appendChild(jsLabel);
	buttonContainer.appendChild(jsRadioBtn);
	buttonContainer.appendChild(pyLabel);
	buttonContainer.appendChild(pyRadioBtn);
	buttonContainer.appendChild(htmlLabel);
	buttonContainer.appendChild(htmlRadioBtn);
	buttonContainer.appendChild(runButton);

	return buttonContainer;
}
