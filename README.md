# Gister

> Vanilla JS MVC Electron app for syncing Gists

## Usage

1. Install dependencies & package the desktop app (`npm i && npm run package`)
2. Generate a personal access token with `gist` access [here](https://github.com/settings/tokens)
3. Open the app in `out/`, enter access token & start working with your gists!

To package the app for installation on Debian-based Linux distros, install the npm package `electron-installer-debian`, run the npm script `build:deb` and simply double-click the built `.deb` file in `out/`.

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
