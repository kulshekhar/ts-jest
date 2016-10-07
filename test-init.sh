#!/bin/bash

# This script creates a mock ts-jest package in the node_modules
# directory. The contents of this directory are symlinks to index.js and
# preprocessor.js
#
# This node_modules directory is in turn symlinked to by all the tests

mkdir -p node_modules/ts-jest
ln -sf $(pwd)/preprocessor.js $(pwd)/node_modules/ts-jest/
ln -sf $(pwd)/index.js $(pwd)/node_modules/ts-jest/

ln -sf $(pwd)/node_modules $(pwd)/tests/simple/

# link tsconfig
ln -sf $(pwd)/tsconfig.json $(pwd)/tests/simple/
ln -sf $(pwd)/tsconfig.json $(pwd)/tests/button/
