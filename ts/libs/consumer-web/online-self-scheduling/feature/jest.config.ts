/* eslint-disable */
export default {
  displayName: 'consumer-web-online-self-scheduling-feature',
  preset: '../../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
  globalSetup: './src/testUtils/global.setup.ts',
  coverageDirectory:
    '../../../../../coverage/ts/libs/consumer-web/online-self-scheduling/feature',
};
