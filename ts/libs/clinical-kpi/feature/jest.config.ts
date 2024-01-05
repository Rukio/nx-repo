import { Config } from 'jest';

const config: Config = {
  displayName: 'clinical-kpi-feature',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../coverage/ts/libs/clinical-kpi/feature',
  setupFilesAfterEnv: ['./src/lib/util/testUtils/setupTests.ts'],
};

export default config;
