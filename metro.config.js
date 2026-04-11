const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .mjs files which are common in modern ESM packages
config.resolver.sourceExts.push('mjs');

module.exports = config;
