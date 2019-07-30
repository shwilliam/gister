/* global Octokit */

class Model {
  constructor() {
    this.octokit = Octokit({
      auth: '',
    })

    this.fetchGists()
  }

  bindHandler(controller) {
    this.onGistsListChange = controller.onGistsListChange
    this.onGistSelect = controller.onGistSelect
  }

  fetchGists() {
    this.octokit.gists
      .list()
      .then(({data}) => this.onGistsListChange(data))
  }

  fetchGist(id) {
    this.octokit.gists
      .get({
        gist_id: id,
      })
      .then(({data}) => this.onGistSelect(data))
  }

  createGist(payload) {
    this.octokit.gists.create(payload)
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')
    this.gistsList = this.createElement('ul')

    this.form = this.createElement('form')

    this.inputDesc = this.createElement('input')
    this.inputDesc.type = 'text'
    this.inputDesc.placeholder = 'Gist description'
    this.inputDesc.name = 'description'
    this.inputDesc.required = true

    this.inputFilename = this.createElement('input')
    this.inputFilename.type = 'text'
    this.inputFilename.placeholder = 'Filename'
    this.inputFilename.name = 'filename'
    this.inputFilename.required = true

    this.submitButton = this.createElement('button')
    this.submitButton.type = 'submit'
    this.submitButton.textContent = 'Create'

    this.editor = this.createElement('pre')
    this.editorCode = this.createElement('code')
    this.editorCode.contentEditable = true
    this.editor.append(this.editorCode)

    this.form.append(
      this.inputDesc,
      this.inputFilename,
      this.submitButton,
    )

    this.app.append(this.form, this.gistsList)
  }

  createElement(tag, className) {
    const element = document.createElement(tag)

    if (className) element.classList.add(className)

    return element
  }

  getElement(selector) {
    const element = document.querySelector(selector)

    return element
  }

  resetForm() {
    this.inputDesc.value = ''
    this.inputFilename.value = ''
  }

  displayGists(gists) {
    if (!gists) return console.log('no gists')

    // clear child nodes
    while (this.gistsList.firstChild) {
      this.gistsList.removeChild(this.gistsList.firstChild)
    }

    gists.forEach(gist => {
      const li = this.createElement('li')
      const btn = this.createElement('button')

      btn.dataset.id = gist.id
      btn.textContent = gist.description

      li.append(btn)
      this.gistsList.append(li)
    })
  }

  displayEditor(gist) {
    // TODO: handle multiple files
    const {description} = gist
    const {filename, content} = Object.values(gist.files)[0]

    this.editorCode.textContent = content
    this.app.append(this.editor)
  }

  setUpEventListeners(controller) {
    this.form.addEventListener('submit', controller.handleNewGist)
    this.gistsList.addEventListener(
      'click',
      controller.handleSelectGist,
    )
  }
}

class Controller {
  constructor() {
    this.model = new Model()
    this.view = new View()

    this.model.bindHandler(this)
    this.view.setUpEventListeners(this)
  }

  onGistsListChange = gists => {
    this.view.displayGists(gists)
  }

  onGistSelect = gist => {
    this.view.displayEditor(gist)
  }

  handleSelectGist = event => {
    if (event.target.tagName === 'BUTTON') {
      this.model.fetchGist(event.target.dataset.id)
    }
  }

  handleNewGist = event => {
    event.preventDefault()
    const {inputDesc, inputFilename} = this.view

    if (
      inputDesc.value.trim().length &&
      inputFilename.value.trim().length
    ) {
      this.model.createGist({
        description: inputFilename.value,
        public: true,
        files: {
          [inputFilename.value]: {
            content: 'Hello world!',
          },
        },
      })

      this.view.resetForm()
    }
  }
}

// app
new Controller()
