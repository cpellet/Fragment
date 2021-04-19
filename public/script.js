let dropdowns = document.querySelectorAll('.navbar .dropdown-toggler')
let dropdownIsOpen = false
if (dropdowns.length) {
  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('click', (event) => {
      let target = document.querySelector('#' + event.target.dataset.dropdown)

      if (target) {
        if (target.classList.contains('show')) {
          target.classList.remove('show')
          dropdownIsOpen = false
        } else {
          target.classList.add('show')
          dropdownIsOpen = true
        }
      }
    })
  })
}

window.addEventListener('mouseup', (event) => {
  if (dropdownIsOpen) {
    dropdowns.forEach((dropdownButton) => {
      let dropdown = document.querySelector('#' + dropdownButton.dataset.dropdown)
      let targetIsDropdown = dropdown == event.target

      if (dropdownButton == event.target) {
        return
      }

      if ((!targetIsDropdown) && (!dropdown.contains(event.target))) {
        dropdown.classList.remove('show')
      }
    })
  }
})

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}


const notebookContents = document.querySelector("#notebook-contents")

var focusedElem;

function addCell() {
  const e = document.createElement("div");
  e.classList.add("cell");
  notebookContents.appendChild(e);
  CodeMirror(e, {
    lineNumbers: false,
    lineWrapping: true,
    tabSize: 2,
    mode: 'javascript',
    extraKeys: { "Ctrl-Space": "autocomplete" },
    value: ''
  }).on("focus", function (instance) {
    focusedElem = instance.getWrapperElement().parentNode;
  });
  deleteSkeletonCells();
}

function addSkeletonCell() {
  const e = document.createElement("div");
  e.classList.add("skeletonCell");
  notebookContents.appendChild(e);
}

function deleteSkeletonCells(event) {
  for (let index = 0; index < notebookContents.children.length; index++) {
    if (notebookContents.children[index].classList.contains("skeletonCell")) {
      notebookContents.removeChild(notebookContents.children[index])
    }
  }
}

function deleteCell() {
  focusedElem.remove();
}