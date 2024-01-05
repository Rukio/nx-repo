/* eslint-disable */
export default {
  displayName: 'insurance-dashboard',
  preset: '../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/ts/apps/insurance-dashboard',
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
};
