/* eslint-disable */
export default {
  displayName: 'design-system',
  preset: '../../../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../../coverage/ts/libs/shared/ui/design-system',
  setupFilesAfterEnv: ['./src/setupTests.ts'],
  globalSetup: './src/lib/testUtils/globalSetup.ts',
};
