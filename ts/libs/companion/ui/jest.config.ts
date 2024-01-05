import { Config } from 'jest';

const config: Config = {
  displayName: 'companion-ui',
  preset: '../../../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../coverage/ts/libs/companion/ui',
  setupFilesAfterEnv: ['./src/testUtils/jest.setup.ts'],
  globalSetup: './src/testUtils/global.setup.ts',
};

export default config;
