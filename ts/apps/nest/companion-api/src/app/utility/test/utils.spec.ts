import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import {
  ConfigGetWithOneArg,
  mockConfigService,
} from '../../common/mocks/config.service.mock';
import { getRequiredEnvironmentVariable, isJsonObject } from '../utils';

describe('Utils', () => {
  describe(`${isJsonObject.name}`, () => {
    it('should return false for null', () => {
      expect(isJsonObject(null)).toStrictEqual(false);
    });

    it('should return false for undefined', () => {
      expect(isJsonObject(undefined)).toStrictEqual(false);
    });

    it('should return true for object', () => {
      expect(isJsonObject({})).toStrictEqual(true);
    });

    it('should return false for an array', () => {
      expect(isJsonObject([])).toStrictEqual(false);
    });

    it('should return false for an boolean', () => {
      expect(isJsonObject(true)).toStrictEqual(false);
    });

    it('should return false for an number', () => {
      expect(isJsonObject(22)).toStrictEqual(false);
    });

    it('should return false for an string', () => {
      expect(isJsonObject('ahhhhhhhh')).toStrictEqual(false);
    });
  });

  describe(`${getRequiredEnvironmentVariable.name}`, () => {
    const testKey = 'TEST_KEY';
    const testValue = 'test_value';

    it('should return config value if exists', () => {
      (mockConfigService.get as unknown as ConfigGetWithOneArg)
        .calledWith(testKey)
        .mockReturnValue(testValue);
      expect(
        getRequiredEnvironmentVariable(testKey, mockConfigService)
      ).toStrictEqual(testValue);
    });

    it(`should throw ${MissingEnvironmentVariableException.name} if config value does not exist`, () => {
      (mockConfigService.get as unknown as ConfigGetWithOneArg)
        .calledWith(testKey)
        .mockReturnValue(undefined);
      expect(() =>
        getRequiredEnvironmentVariable(testKey, mockConfigService)
      ).toThrow(MissingEnvironmentVariableException);
    });
  });
});
