/* eslint-disable */
export default {
  displayName: 'consumer-web-web-request-data-access',
  preset: '../../../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory:
    '../../../../../coverage/ts/libs/consumer-web/web-request/data-access',
};
