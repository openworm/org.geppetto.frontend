module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
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


    //"max-len": [1, 120, 4, {"ignoreComments": true, "ignoreUrls": true, "ignorePattern": "^\\s*var\\s.+=\\s*require\\s*\\("}],
    //"complexity": [1, 5], // Cyclomatic complexity

    // React Rules
    "react/jsx-indent-props": [2, 4], // Use 4 spaces for props indentation
    "react/prefer-es6-class": [1, "always"], // Prefer ES6 classes but don't hard require them yet
    "react/jsx-no-bind": [1, {
      "ignoreRefs": false,
      "allowArrowFunctions": false,
      "allowBind": false
    }]
  },
};