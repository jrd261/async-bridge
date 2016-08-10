#! /bin/bash

set -e
babel bridge.js --out-file index.js --presets es2015 --plugins transform-async-to-generator
