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
    return this.octokit.gists
      .create(payload)
      .then(() => this.fetchGists())
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

    this.gistFormToggle = document.createElement('button')
    this.gistFormToggle.textContent = '➕'
    this.gistFormToggle.classList.add(
      'btn',
      'btn--reset',
      'gist-form__toggle',
    )

    this.gistForm = document.createElement('form')
    this.gistForm.classList.add('gist-form')
    this.gistForm.hidden = true
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
    this.gistForm.append(this.inputDesc, this.inputFlexWrap)

    this.gistsList = document.createElement('ul')

    this.app.append(this.gistForm, this.keyPrompt)
  }

  getElement(selector) {
    const element = document.querySelector(selector)

    return element
  }

  hideKeyPrompt() {
    this.keyPrompt.remove()
  }

  displayGistsList() {
    this.app.append(this.gistFormToggle, this.gistsList)
  }

  displayGists(gists) {
    // TODO: render 'no gists' msg
    if (!gists) return alert('no gists')

    // clear child nodes
    while (this.gistsList.firstChild) {
      this.gistsList.removeChild(this.gistsList.firstChild)
    }

    gists.forEach(gist => {
      const li = document.createElement('li')
      const files = Object.keys(gist.files)
      const fileName = files[0]
      const fileNames = files.join(', ')

      li.classList.add('gist-list__item')
      li.setAttribute('id', `gist-${gist.id}`)

      const inputLabel = document.createElement('label')
      inputLabel.classList.add('file-input__label')
      inputLabel.textContent = '🔄'
      inputLabel.setAttribute('id', `${gist.id}-file-input`)
      const fileInput = document.createElement('input')
      fileInput.classList.add('file-input', 'sr-only')
      fileInput.type = 'file'
      fileInput.dataset.id = gist.id

      if (files.length > 1) {
        const tooltip = document.createElement('a')
        tooltip.setAttribute('href', '#')
        tooltip.classList.add('tooltip--bottom')
        tooltip.innerText = fileName
        tooltip.dataset.tooltip =
          files.length > 1 ? `[${fileNames}]` : ''
        li.append(tooltip)
      } else {
        li.innerText = fileName
      }

      inputLabel.append(fileInput)
      li.prepend(inputLabel)
      this.gistsList.append(li)
    })
  }

  renderGistForm() {
    this.gistForm.hidden = false
  }

  hideGistForm() {
    this.gistForm.hidden = true
    this.inputDesc.value = ''
    this.inputFilename.value = ''
  }

  renderSuccess(id) {
    const fileInput = document.getElementById(`${id}-file-input`)
    fileInput.textContent = '✅'
    fileInput.onclick = null
    fileInput.setAttribute('disabled', true)
    fileInput.classList.add('btn--disabled')
  }

  setUpEventListeners(controller) {
    this.keyPrompt.addEventListener('submit', e => {
      controller.handleInitOctokit(this.keyPromptInput.value)
    })
    this.gistFormToggle.addEventListener('click', () =>
      this.renderGistForm(),
    )
    this.gistForm.addEventListener('submit', e => {
      e.preventDefault()
      controller.handleNewGist()
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

  handleNewGist = () => {
    const {inputDesc, inputFilename} = this.view

    if (
      inputDesc.value.trim().length &&
      inputFilename.value.trim().length
    ) {
      this.model
        .createGist({
          description: inputDesc.value,
          public: true,
          files: {
            [inputFilename.value]: {
              content: 'Hello world!',
            },
          },
        })
        .then(() => this.view.hideGistForm())
    }
  }

  handleSelectGist = ({id, filename, content}) =>
    this.model.fetchGist(id).then(({data}) => {
      if (data.files[filename]) {
        const gist = document.getElementById(`gist-${id}`)
        this.handleSaveGist(id, filename, content)
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
