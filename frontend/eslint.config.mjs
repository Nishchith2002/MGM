import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier'; // Import Prettier config

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: { js },
    extends: ['js/recommended', 'prettier'], // Add "prettier" to extend Prettier rules
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: { globals: globals.browser },
  },
  pluginReact.configs.flat.recommended,
  {
    // Adding Prettier plugin to highlight Prettier errors
    rules: {
      'prettier/prettier': 'error', // Show Prettier issues as errors
    },
  },
]);
