/* eslint-disable */
export default {
  displayName: 'patient-portal',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/ts/apps/patient-portal',
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
};
