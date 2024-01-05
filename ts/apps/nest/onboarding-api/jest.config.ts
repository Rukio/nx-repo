import type { Config } from 'jest';

const config: Config = {
  displayName: 'onboarding-api',
  preset: '../../../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  coveragePathIgnorePatterns: ['./src/main.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/ts/apps/nest/onboarding-api',
  globalSetup: './src/testUtils/global.setup.ts',
};

export default config;
