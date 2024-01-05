import { Config } from 'jest';

const config: Config = {
  displayName: 'clinical-kpi-data-access',
  preset: '../../../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/ts/libs/clinical-kpi/data-access',
};

export default config;
