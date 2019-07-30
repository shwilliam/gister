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
  }

  fetchGists() {
    this.octokit.gists.list().then(({data}) => {
      this.gists = data
      this.onGistsListChange(this.gists)
    })
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
      const ul = this.createElement('ul')

      Object.values(gist.files).forEach(file => {
        const li = this.createElement('li')
        const a = this.createElement('a')
        a.href = file.raw_url
        a.textContent = file.filename

        li.append(a)
        ul.append(li)
      })

      li.append(gist.description, ul)
      this.gistsList.append(li)
    })
  }

  setUpEventListeners(controller) {
    this.form.addEventListener('submit', controller.handleNewGist)
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

  handleNewGist = event => {
    event.preventDefault()
    console.log(event)
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
