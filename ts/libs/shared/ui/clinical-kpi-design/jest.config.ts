/* eslint-disable */
export default {
  displayName: 'clinical-kpi-design',
  preset: '../../../../../jest.preset.js',
  transform: {
    '^.+\\.(j|t)sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
  coverageDirectory:
    '../../../../../coverage/ts/libs/shared/ui/clinical-kpi-design',
  globalSetup: './src/testUtils/global.setup.ts',
};
