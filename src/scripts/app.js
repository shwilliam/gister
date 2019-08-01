/* global Octokit */

class Model {
  constructor() {
    this.octokit = null
    this.activeGist = null
  }

  initOctokit(key) {
    this.octokit = Octokit({
      auth: key,
    })

    this.onOctokitInit()
  }

  bindHandler(controller) {
    this.onOctokitInit = controller.onOctokitInit
    this.onGistsListChange = controller.onGistsListChange
    this.onGistSelect = controller.onGistSelect
  }

  fetchGists() {
    this.octokit.gists
      .list({
        headers: {
          'If-None-Match': '', // avoid cache
        },
      })
      .then(({data}) => this.onGistsListChange(data))
  }

  fetchGist(id) {
    this.octokit.gists
      .get({
        gist_id: id,
        headers: {
          'If-None-Match': '', // avoid cache
        },
      })
      .then(({data}) => {
        this.activeGist = data
        this.onGistSelect(data)
      })
  }

  createGist(payload) {
    this.octokit.gists.create(payload).then(() => this.fetchGists())
  }

  saveGist(payload) {
    this.octokit.gists.update(payload)
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')

    this.keyPrompt = this.createElement('form')
    this.keyPrompt.classList.add('flex')
    this.keyPromptInput = this.createElement('input')
    this.keyPromptInput.type = 'text'
    this.keyPromptInput.placeholder = 'GitHub personal access token'
    this.keyPromptInput.required = true
    this.keyPromptSubmit = this.createElement('button')
    this.keyPromptSubmit.type = 'submit'
    this.keyPromptSubmit.textContent = 'Submit'
    this.keyPromptSubmit.classList.add('btn', 'btn--primary')
    this.keyPrompt.append(this.keyPromptInput, this.keyPromptSubmit)

    this.gistsList = this.createElement('ul')

    this.form = this.createElement('form')
    this.inputDesc = this.createElement('input')
    this.inputDesc.type = 'text'
    this.inputDesc.placeholder = 'Gist description'
    this.inputDesc.name = 'description'
    this.inputDesc.required = true
    this.inputFlexWrap = this.createElement('div')
    this.inputFlexWrap.classList.add('flex')
    this.inputFilename = this.createElement('input')
    this.inputFilename.type = 'text'
    this.inputFilename.placeholder = 'Filename'
    this.inputFilename.name = 'filename'
    this.inputFilename.required = true
    this.submitButton = this.createElement('button')
    this.submitButton.type = 'submit'
    this.submitButton.textContent = 'Create'
    this.submitButton.classList.add('btn', 'btn--primary')
    this.inputFlexWrap.append(this.inputFilename, this.submitButton)
    this.form.append(this.inputDesc, this.inputFlexWrap)

    this.editor = this.createElement('pre')
    this.editor.classList.add('editor')
    this.editorCode = this.createElement('code')
    this.editorCode.contentEditable = true
    this.editorTitle = this.createElement('h2')
    this.editor.append(this.editorTitle, this.editorCode)
    this.editorActions = this.createElement('div')
    this.editorActions.classList.add('editor__actions')
    this.saveButton = this.createElement('button')
    this.saveButton.textContent = 'Save'
    this.saveButton.classList.add('btn', 'btn--primary')
    this.closeButton = this.createElement('button')
    this.closeButton.textContent = 'Cancel'
    this.closeButton.classList.add('btn')
    this.editorActions.append(this.closeButton, this.saveButton)

    this.app.append(this.keyPrompt)
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

  hideKeyPrompt() {
    this.keyPrompt.remove()
  }

  displayGistsList() {
    this.app.append(this.form, this.gistsList)
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
      btn.classList.add('btn', 'btn--reset')

      li.append(btn)
      this.gistsList.append(li)
    })
  }

  displayEditor(controller, gist) {
    // TODO: handle multiple files
    const {description} = gist
    const {filename, content} = Object.values(gist.files)[0]
    this.saveButton.addEventListener(
      'click',
      controller.handleSaveGist,
    )

    this.editorCode.textContent = content
    this.editorTitle.textContent = filename
    this.form.remove()
    this.gistsList.remove()
    this.app.append(this.editor, this.editorActions)
  }

  closeEditor(controller) {
    this.editor.remove()
    this.editorActions.remove()
    this.saveButton.removeEventListener(
      'click',
      controller.handleSaveGist,
    )
    this.app.append(this.form, this.gistsList)
  }

  setUpEventListeners(controller) {
    this.form.addEventListener('submit', controller.handleNewGist)
    this.gistsList.addEventListener(
      'click',
      controller.handleSelectGist,
    )
    this.closeButton.addEventListener('click', () =>
      this.closeEditor(controller),
    )
    this.keyPrompt.addEventListener('submit', e => {
      controller.handleInitOctokit(this.keyPromptInput.value)
    })
  }
}

class Controller {
  constructor() {
    this.model = new Model()
    this.view = new View()

    this.model.bindHandler(this)
    this.view.setUpEventListeners(this)
  }

  onOctokitInit = () => {
    this.view.hideKeyPrompt()
    this.view.displayGistsList()
    this.model.fetchGists()
  }

  onGistsListChange = gists => {
    this.view.displayGists(gists)
  }

  onGistSelect = gist => {
    this.view.displayEditor(this, gist)
  }

  handleInitOctokit = key => {
    this.model.initOctokit(key)
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
        description: inputDesc.value,
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

  handleSaveGist = () => {
    this.model.saveGist({
      gist_id: this.model.activeGist.id,
      files: {
        [this.view.editorTitle.innerText]: {
          content: this.view.editorCode.innerText,
        },
      },
    })
    this.view.closeEditor(this)
  }
}

// app
new Controller()
