/* eslint-disable */
export default {
  displayName: 'risk-stratification-admin-ui',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory:
    '../../../../coverage/ts/libs/risk-stratification-admin/ui',
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
};
