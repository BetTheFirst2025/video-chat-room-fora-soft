import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    globals: {
      window: 'readonly',
      document: 'readonly',
      navigator: 'readonly',
      console: 'readonly',
      setTimeout: 'readonly',
      clearTimeout: 'readonly',
      RTCPeerConnection: 'readonly',
      RTCSessionDescription: 'readonly',   
      RTCIceCandidate: 'readonly',          
      MediaStream: 'readonly',
      fetch: 'readonly',
      crypto: 'readonly',
    },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', 'playwright-report/'],
  },
];