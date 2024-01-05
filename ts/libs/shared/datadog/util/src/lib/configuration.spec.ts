import { withDatadogEnabledCheck } from './configuration';

describe('configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withDatadogEnabledCheck', () => {
    const callback = vi.fn();

    it.each([
      { env: 'production', expectedCalledTimes: 1 },
      { env: 'development', expectedCalledTimes: 0 },
    ])(
      'should execute callback when env is not development',
      ({ env, expectedCalledTimes }) => {
        withDatadogEnabledCheck({ env }, callback);
        expect(callback).toBeCalledTimes(expectedCalledTimes);
      }
    );
  });
});
