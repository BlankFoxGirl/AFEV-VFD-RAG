module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
    'prettier',
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
};
