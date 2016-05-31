#! /bin/bash

set -e
mkdir -p ./dist/node/

babel src --out-dir dist/node --presets es2015 --plugins transform-async-to-generator
browserify ./index.js -o dist/post-message-bridge.js -s PostMessageBridge
uglifyjs --compress --mangle --source-map dist/post-message-bridge.min.map -o dist/post-message-bridge.min.js -- dist/post-message-bridge.js

cp dist/post-message-bridge.js dist/post-message-bridge-${npm_package_version}.js
cp dist/post-message-bridge.min.js dist/post-message-bridge-${npm_package_version}.min.js
cp dist/post-message-bridge.min.map dist/post-message-bridge-${npm_package_version}.min.map
