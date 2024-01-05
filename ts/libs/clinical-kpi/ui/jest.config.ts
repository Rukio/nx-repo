import { Config } from 'jest';

const config: Config = {
  displayName: 'clinical-kpi-ui',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['./src/testUtils/setupTests.ts'],
  coverageDirectory: '../../../../coverage/ts/libs/clinical-kpi/ui',
  globalSetup: './src/testUtils/global.setup.ts',
};

export default config;
