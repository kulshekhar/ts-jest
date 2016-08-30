#!/bin/bash

# This script creates a mock typescript-jest package in the node_modules 
# directory. The contents of this directory are symlinks to index.js and
# preprocessor.js
#
# This node_modules directory is in turn symlinked to by all the tests

mkdir node_modules/typescript-jest
ln -s $(pwd)/preprocessor.js $(pwd)/node_modules/typescript-jest/
ln -s $(pwd)/index.js $(pwd)/node_modules/typescript-jest/

ln -s $(pwd)/node_modules $(pwd)/tests/hello_world/
