const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Exclude .pte files from the crawler entirely to prevent 2GB+ crashes
config.resolver.blockList = [/\.pte$/];

// 2. tokenizer is small enough to be a standard asset
config.resolver.assetExts.push('model');

module.exports = config;
