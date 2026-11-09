// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Somente para a pré-visualização web (`npm run web`): no navegador o expo-sqlite
// roda o SQLite compilado em WebAssembly (.wasm). No celular (Expo Go) isso não é usado.
config.resolver.assetExts.push('wasm');

module.exports = config;
