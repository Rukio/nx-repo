/* eslint-disable */
export default {
  displayName: 'nest-statsig',
  preset: '../../../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../../../coverage/ts/libs/nest/statsig',
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
