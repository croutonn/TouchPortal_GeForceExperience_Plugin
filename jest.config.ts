import pkg from './package.json'

export default {
  displayName: pkg.name,
  coverageProvider: 'v8',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
