const { resolve } = require('path')
const { pathsToModuleNameMapper } = require('ts-jest/utils')

const pkg = require('./package.json')
const baseTsconfig = require('./tsconfig.json')
const CI = !!process.env.CI

module.exports = () => {
  return {
    displayName: pkg.name,
    rootDir: __dirname,
    transform: { '^.+\\.tsx?$': 'ts-jest' },
    testEnvironment: 'node',
    globals: {
      'ts-jest': {
        diagnostics: false,
        tsconfig: 'tsconfig.test.json',
      },
    },
    restoreMocks: true,
    reporters: ['default'],
    modulePathIgnorePatterns: ['dist'],
    moduleNameMapper: pathsToModuleNameMapper(
      baseTsconfig.compilerOptions.paths || [],
      {
        prefix: `./`,
      }
    ),
    cacheDirectory: resolve(
      __dirname,
      `${CI ? '' : 'node_modules/'}.cache/jest`
    ),
    collectCoverage: false,
  }
}
