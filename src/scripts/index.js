/* global Octokit */

class Model {
  constructor() {
    const octokit = Octokit({
      auth: '',
    })

    octokit.gists.list().then(({data}) => {
      this.gists = data
      this.onGistsListChange(this.gists)
    })
  }

  bindHandler(controller) {
    this.onGistsListChange = controller.onGistsListChange
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')
    this.gistsList = this.createElement('ul')
    this.app.append(this.gistsList)
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
}

class Controller {
  constructor() {
    this.model = new Model()
    this.view = new View()

    this.model.bindHandler(this)
  }

  onGistsListChange = gists => {
    this.view.displayGists(gists)
  }
}

// app
new Controller()
