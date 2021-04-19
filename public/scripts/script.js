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

function addCell(above) {
	const e = document.createElement("div");
	e.classList.add("cell");
	if (above) {
		notebookContents.insertBefore(e, focusedElem);
	} else {
		notebookContents.appendChild(e);
	}
	const codeMirrorCell = CodeMirror(e, {
		lineNumbers: false,
		lineWrapping: true,
		tabSize: 2,
		theme: "monokai",
		mode: "javascript",
		autoCloseBrackets: true,
		extraKeys: { "Ctrl-Space": "autocomplete" },
		value: "",
	});
	codeMirrorCell.on("focus", function (instance) {
		focusedElem = instance.getWrapperElement().parentNode;
	});
	codeMirrorCell.on("keyup", function (instance, evt) {
		/*Enables keyboard navigation in autocomplete list*/
		console.log(evt.key);
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
			evt.key !== "Backspace"
		) {
			/*Enter - do not open autocomplete list just after item has been selected in it*/
			CodeMirror.commands.autocomplete(instance, null, {
				completeSingle: false,
			});
		}
	});
	deleteSkeletonCells();
}

function addSkeletonCell(above) {
	const e = document.createElement("div");
	e.classList.add("skeletonCell");
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
	focusedElem.remove();
	removeDeleteSkeletons();
}

function displayDeleteSkeleton() {
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
	if (evtobj.keyCode == 8 && evtobj.ctrlKey) deleteCell();
	if (evtobj.keyCode == 40 && evtobj.ctrlKey) addCell(false);
	if (evtobj.keyCode == 38 && evtobj.ctrlKey) addCell(true);
}
