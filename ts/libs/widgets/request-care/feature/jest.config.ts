/* eslint-disable */
export default {
  displayName: 'widgets-request-care-feature',
  preset: '../../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory:
    '../../../../../coverage/ts/libs/widgets/request-care/feature',
  setupFilesAfterEnv: ['./src/lib/testUtils/setupTests.ts'],
};
