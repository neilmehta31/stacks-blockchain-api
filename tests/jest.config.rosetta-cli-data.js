/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: `${require('path').dirname(__dirname)}/src`,
  testMatch: ['<rootDir>/tests-rosetta-cli-data/**/*.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests-rosetta-cli-data/setup.ts', '<rootDir>/tests-rosetta-cli-data/teardown.ts'],
  collectCoverageFrom: ['<rootDir>/**/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/tests*'],
  coverageDirectory: '<rootDir>/../coverage',
  globalSetup: '<rootDir>/tests-rosetta-cli-data/setup.ts',
  globalTeardown: '<rootDir>/tests-rosetta-cli-data/teardown.ts',
  testTimeout: 240000,
  verbose: true,
};

module.exports = config;
