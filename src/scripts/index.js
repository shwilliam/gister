/* global Octokit */

const octokit = Octokit({
  auth: '',
})

const $editor = document.getElementById('rabbit-editor')

octokit.gists.list().then(({data}) => {
  const gists = data.slice().map(gist => gist.description)
  $editor.innerText = gists.join(' ')
})
