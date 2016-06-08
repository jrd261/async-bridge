'use strict';

const Bridge = require('./Bridge');

module.exports.create = ({ timeout = 100, source = typeof window === 'undefined' ? null : window }) => new Bridge({ timeout, source });
