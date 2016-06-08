#! /bin/bash

set -e
mkdir -p ./dist/node/

babel bridge.js --out-file dist/bridge-node.js --presets es2015 --plugins transform-async-to-generator
browserify ./index.js -o dist/bridge.js -s bridge
uglifyjs --compress --mangle --source-map dist/bridge.min.map -o dist/bridge.min.js -- dist/bridge.js

cp dist/bridge.js dist/bridge-${npm_package_version}.js
cp dist/bridge.min.js dist/bridge-${npm_package_version}.min.js
cp dist/bridge.min.map dist/bridge-${npm_package_version}.min.map
