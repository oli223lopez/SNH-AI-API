module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  rootDir: '.', // Set to project root (directory containing package.json)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  watchman: false,
};