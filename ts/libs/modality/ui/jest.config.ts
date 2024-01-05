/* eslint-disable */
export default {
  displayName: 'modality-ui',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../coverage/ts/libs/modality/ui',
  setupFilesAfterEnv: ['./src/lib/testUtils/setupTests.ts'],
};
