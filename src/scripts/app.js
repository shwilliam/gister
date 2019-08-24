/* global Octokit */
const fs = require('fs')

class Model {
  constructor() {
    this.octokit = null
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
    return this.octokit.gists.get({
      gist_id: id,
      headers: {
        'If-None-Match': '', // avoid cache
      },
    })
  }

  createGist(payload) {
    this.octokit.gists.create(payload).then(() => this.fetchGists())
  }

  saveGist(payload) {
    return this.octokit.gists.update(payload)
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')

    this.keyPrompt = document.createElement('form')
    this.keyPrompt.classList.add('flex')
    this.keyPromptInput = document.createElement('input')
    this.keyPromptInput.type = 'text'
    this.keyPromptInput.placeholder = 'GH access token'
    this.keyPromptInput.required = true
    this.keyPromptSubmit = document.createElement('button')
    this.keyPromptSubmit.type = 'submit'
    this.keyPromptSubmit.textContent = 'Submit'
    this.keyPromptSubmit.classList.add('btn', 'btn--primary')
    this.keyPrompt.append(this.keyPromptInput, this.keyPromptSubmit)

    this.gistsList = document.createElement('ul')

    this.form = document.createElement('form')
    this.inputDesc = document.createElement('input')
    this.inputDesc.type = 'text'
    this.inputDesc.placeholder = 'Gist description'
    this.inputDesc.name = 'description'
    this.inputDesc.required = true
    this.inputFlexWrap = document.createElement('div')
    this.inputFlexWrap.classList.add('flex')
    this.inputFilename = document.createElement('input')
    this.inputFilename.type = 'text'
    this.inputFilename.placeholder = 'Filename'
    this.inputFilename.name = 'filename'
    this.inputFilename.required = true
    this.submitButton = document.createElement('button')
    this.submitButton.type = 'submit'
    this.submitButton.textContent = 'Create'
    this.submitButton.classList.add('btn', 'btn--primary')
    this.inputFlexWrap.append(this.inputFilename, this.submitButton)
    this.form.append(this.inputDesc, this.inputFlexWrap)

    this.app.append(this.keyPrompt)
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
    // TODO: render 'no gists' msg
    if (!gists) return console.log('no gists')

    // clear child nodes
    while (this.gistsList.firstChild) {
      this.gistsList.removeChild(this.gistsList.firstChild)
    }

    // TODO: handle multiple files
    gists.forEach(gist => {
      const li = document.createElement('li')
      li.textContent = Object.keys(gist.files)[0]
      li.setAttribute('id', `gist-${gist.id}`)

      const inputLabel = document.createElement('label')
      inputLabel.classList.add('file-input__label')
      inputLabel.textContent = '🔎'
      inputLabel.setAttribute('id', `${gist.id}-file-input`)
      const fileInput = document.createElement('input')
      fileInput.classList.add('file-input', 'sr-only')
      fileInput.type = 'file'
      fileInput.dataset.id = gist.id

      inputLabel.append(fileInput)
      li.append(inputLabel)
      this.gistsList.append(li)
    })
  }

  renderSyncActions(id, filename, content, cb) {
    const gist = document.getElementById(`gist-${id}`)
    const fileInput = document.getElementById(`${id}-file-input`)

    // content has changed
    if (content) {
      const btnRender = document.createElement('button')
      btnRender.classList.add('btn', 'btn--reset')
      btnRender.textContent = '🔄'
      btnRender.setAttribute('id', `${id}-render-btn`)
      btnRender.onclick = () => {
        cb(id, filename, content)
      }

      fileInput.remove()

      gist.append(btnRender)
    } else {
      alert(`No changes to ${filename}!`)
    }
  }

  renderSuccess(id) {
    const btnRender = document.getElementById(`${id}-render-btn`)
    btnRender.textContent = '✅'
    btnRender.onclick = null
    btnRender.setAttribute('disabled', true)
    btnRender.classList.add('btn--disabled')
  }

  setUpEventListeners(controller) {
    this.form.addEventListener('submit', controller.handleNewGist)
    this.keyPrompt.addEventListener('submit', e => {
      controller.handleInitOctokit(this.keyPromptInput.value)
    })
    this.gistsList.addEventListener('change', function(e) {
      if (e.target.tagName === 'INPUT') {
        const gist = e.target.files[0]

        fs.readFile(gist.path, 'utf-8', (err, data) => {
          if (err)
            return alert(
              `An error ocurred reading the file at ${gist.path}`,
            )

          controller.handleSelectGist({
            id: e.target.dataset.id,
            filename: gist.name,
            content: data,
          })
        })
      }
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

  handleInitOctokit = key => {
    this.model.initOctokit(key)
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

  handleSelectGist = ({id, filename, content}) =>
    this.model.fetchGist(id).then(({data}) => {
      if (data.files[filename]) {
        this.view.renderSyncActions(
          id,
          filename,
          content.trim() !== data.files[filename].content.trim() &&
            content,
          this.handleSaveGist,
        )
      } else alert('Ensure filenames match')
    })

  handleSaveGist = (id, filename, content) => {
    this.model
      .saveGist({
        gist_id: id,
        files: {
          [filename]: {
            content,
          },
        },
      })
      .then(() => this.view.renderSuccess(id))
  }
}

// app
new Controller()
