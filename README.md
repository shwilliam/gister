# Gister

> Vanilla JS MVC Electron app for syncing Gists

<img width="383" alt="App screencap" src="https://user-images.githubusercontent.com/38357771/63646286-0702ed00-c6c5-11e9-93b5-bc382498d488.png">

## Usage

1. Install dependencies & package the desktop app (`npm i && npm run package`)
2. Generate a personal access token with `gist` access [here](https://github.com/settings/tokens)
3. Open the app in `out/` & enter access token

You are all set! Click on the `🔄` button next to the file you want to sync and select it from the file-browser. To create a new gist, press the `➕` button on the top right and enter your new gist's description and filename.

## Troubleshooting

### Debian

If you are on a Debian-based Linux distro and unable to build the app using the `package` script, try to install the npm package `electron-installer-debian` and run the npm script `build:deb`. You should now be able to run the app by simply double-clicking the built `.deb` file in `out/`.

## Development

1. Install dependencies (`npm i`)
2. Open dev build (`npm start`)

## Contributing

This project is open to and encourages contributions! Feel free to discuss any bug fixes/features in the [issues](https://github.com/shwilliam/gister/issues). If you wish to work on this project:

1. Fork [this project](https://github.com/shwilliam/gister)
2. Create a branch (`git checkout -b new-branch`)
3. Commit your changes (`git commit -am 'add new feature'`)
4. Push to the branch (`git push origin new-branch`)
5. [Submit a pull request!](https://github.com/shwilliam/gister/pull/new/master)
