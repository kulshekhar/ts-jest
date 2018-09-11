# ts-jest Documentation

## Setup

Make sure you have latest Ruby, then make sure you have the bundler:

```sh
gem install bundler
```

You will also need [PlantUML](http://plantuml.com/download) to build the docs

Finally you can install requirements:

```sh
# from the root of this project
cd docs
bundle install
```

To link the build directory to the `gh-pages` branch, ensure the `docs/_site` directory does NOT exists and run:

```sh
npm run doc:link
```

## Serve the docs locally with live-reload

To preview your changes with live-reload, run this:

```sh
npm run doc
```
