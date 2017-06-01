module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jquery: true,
    amd: true
  },
  extends: ['eslint:recommended', "plugin:react/recommended"],
  plugins: [
    "react"
  ],
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    // Comma at the end of a dictionary
    // 'comma-dangle': ['error', 'always-multiline'],
    // Indent must be four space
    indent: ['error', 4],
    // Not sure what this does...
    //'linebreak-style': ['error', 'unix'],
    // Single quotes
    quotes: ['error', 'single'],
    // Semi colon end of line
    semi: ['error', 'always'],
    // Unused variable spits out a warning
    'no-unused-vars': ['warn'],
    // Allow to use console
    'no-console': 0,
  },

  globals: {
    "G": true,
    "GEPPETTO": true,
    "casper": true
  }
};