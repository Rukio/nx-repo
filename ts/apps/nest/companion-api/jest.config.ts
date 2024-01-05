import type { Config } from 'jest';

const config: Config = {
  displayName: 'companion-api',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': '@swc/jest',
  },
  coveragePathIgnorePatterns: ['./src/main.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/ts/apps/nest/companion-api',
  setupFilesAfterEnv: ['./src/testUtils/jest.setup.ts'],
  globalSetup: './src/testUtils/global.setup.ts',
};

export default config;
